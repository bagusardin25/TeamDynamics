"""
TeamDynamics Backend — FastAPI Application
Multi-agent AI simulation engine for team dynamics.
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

load_dotenv()

# ── Sentry Error Tracking ─────────────────────────────────────────────
# Initialize BEFORE app creation so all errors are captured from startup.
# Set SENTRY_DSN in .env to enable. Gracefully disabled when not set.
import sentry_sdk

SENTRY_DSN = os.getenv("SENTRY_DSN", "")


def _sentry_before_send(event, hint):
    """Scrub sensitive fields from Sentry events before transmission."""
    SENSITIVE_KEYS = {"password", "token", "secret", "api_key", "apikey",
                      "authorization", "cookie", "credit_card", "ssn"}
    if "request" in event:
        req = event["request"]
        for section in ("data", "headers", "query_string", "cookies"):
            if section in req and isinstance(req[section], dict):
                for key in list(req[section].keys()):
                    if any(s in key.lower() for s in SENSITIVE_KEYS):
                        req[section][key] = "[Filtered]"
    return event


if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=os.getenv("SENTRY_ENVIRONMENT", "production"),
        release=os.getenv("SENTRY_RELEASE", "teamdynamics-backend@1.0.0"),
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.2")),
        profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.1")),
        send_default_pii=False,
        enable_tracing=True,
        include_local_variables=True,
        before_send=_sentry_before_send,
        max_breadcrumbs=50,
    )

from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded

from models.database import init_db, close_db
from services.state_manager import init_redis, close_redis
from services.rate_limiter import limiter
from routers.simulation import router as simulation_router
from routers.agents import router as agents_router
from routers.websocket import router as websocket_router
from routers.auth import router as auth_router
from routers.document import router as document_router
from routers.payment import router as payment_router
from routers.email import router as email_router
from routers.admin import router as admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Track DB readiness for health endpoint
_db_ready = False

DB_MAX_RETRIES = int(os.getenv("DB_MAX_RETRIES", "5"))
DB_RETRY_DELAY = int(os.getenv("DB_RETRY_DELAY", "3"))


def _is_production_env() -> bool:
    env = (
        os.getenv("ENVIRONMENT")
        or os.getenv("APP_ENV")
        or os.getenv("RAILWAY_ENVIRONMENT")
        or os.getenv("VERCEL_ENV")
        or ""
    ).lower()
    return env in {"production", "prod"}


def _https_enforced() -> bool:
    return os.getenv("FORCE_HTTPS", "").lower() in {"1", "true", "yes"} or _is_production_env()


async def _background_db_init():
    """Connect to the database in the background so the health endpoint is reachable immediately."""
    global _db_ready
    for attempt in range(1, DB_MAX_RETRIES + 1):
        try:
            await init_db()
            logger.info("✅ Database initialized (PostgreSQL)")
            _db_ready = True
            return
        except Exception as e:
            logger.warning(
                f"⚠️ DB connection attempt {attempt}/{DB_MAX_RETRIES} failed: {e}"
            )
            if attempt < DB_MAX_RETRIES:
                await asyncio.sleep(DB_RETRY_DELAY)
    logger.error("❌ Could not connect to database after all retries. "
                  "App will start but DB operations will fail.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle with resilient DB and Redis connection."""
    logger.info("🚀 Initializing TeamDynamics Backend...")
    logger.info(f"🤖 LLM Provider: {os.getenv('LLM_PROVIDER', 'openai')}")

    # Initialize Redis (optional — gracefully falls back to in-memory)
    await init_redis()

    # Start DB connection in the background so /health is reachable immediately
    db_task = asyncio.create_task(_background_db_init())

    # Start background drip email scheduler
    _scheduler = None
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from services.drip_engine import get_drip_engine

        _scheduler = AsyncIOScheduler()
        _scheduler.add_job(
            get_drip_engine().process_pending_drips,
            'interval',
            minutes=15,
            id='drip_email_processor',
            max_instances=1,
        )
        _scheduler.start()
        logger.info("📧 Drip email scheduler started (every 15 min)")
    except ImportError:
        logger.warning("📧 APScheduler not installed — drip emails disabled")
    except Exception as e:
        logger.warning(f"📧 Drip scheduler failed to start: {e}")

    logger.info("🛡️ Rate limiting active (60/min global default)")
    if SENTRY_DSN:
        logger.info("🔍 Sentry error tracking active")
    else:
        logger.info("🔍 Sentry disabled (no SENTRY_DSN configured)")
    yield

    logger.info("👋 Shutting down TeamDynamics Backend")
    # Cancel DB init if still running
    if not db_task.done():
        db_task.cancel()
    if _scheduler:
        _scheduler.shutdown(wait=False)
    await close_redis()
    await close_db()


app = FastAPI(
    title="TeamDynamics API",
    description="Multi-agent AI simulation engine for team dynamics, morale, and productivity.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Rate Limiter Middleware ───────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── LLM Budget Exceeded Handler ──────────────────────────────────────
from services.llm_budget import BudgetExceededError

@app.exception_handler(BudgetExceededError)
async def budget_exceeded_handler(request: Request, exc: BudgetExceededError):
    return JSONResponse(
        status_code=429,
        content={
            "detail": str(exc),
            "type": "llm_budget_exceeded",
            "daily_cap_usd": exc.daily_cap,
            "current_spend_usd": round(exc.current_spend, 4),
        },
    )

# CORS — tightened to only methods/headers the frontend actually uses
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in frontend_url.split(",") if origin.strip()]
if not _is_production_env():
    allowed_origins += ["http://localhost:3000", "http://127.0.0.1:3000"]
allowed_origins = list(set(allowed_origins))
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
)


@app.middleware("http")
async def https_enforcement_middleware(request: Request, call_next):
    """Redirect HTTP to HTTPS and set HSTS in production/proxy deployments."""
    # Exempt health checks from HTTPS redirect, as Railway internal healthchecks use HTTP
    if request.url.path == "/health":
        return await call_next(request)

    host = request.headers.get("host", "")
    is_local = host.startswith(("localhost", "127.0.0.1", "0.0.0.0"))
    forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    forwarded_proto = forwarded_proto.split(",")[0].strip()

    if _https_enforced() and not is_local and forwarded_proto == "http":
        return RedirectResponse(str(request.url.replace(scheme="https")), status_code=308)

    response = await call_next(request)
    if _https_enforced() and not is_local:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response


# ── Sentry User Context Middleware ────────────────────────────────────
# Attaches the authenticated user to Sentry events so errors show who
# triggered them.  Uses the JWT sub claim (user email) when available.
@app.middleware("http")
async def sentry_user_context_middleware(request: Request, call_next):
    if SENTRY_DSN:
        try:
            from jose import jwt
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ", 1)[1]
                payload = jwt.decode(
                    token,
                    os.getenv("JWT_SECRET_KEY", ""),
                    algorithms=["HS256"],
                    options={"verify_exp": False},
                )
                sentry_sdk.set_user({
                    "email": payload.get("sub", "unknown"),
                    "id": payload.get("sub", "unknown"),
                })
        except Exception:
            # Don't block requests if user context extraction fails
            pass
    response = await call_next(request)
    # Clear user context after request to avoid leaking between requests
    if SENTRY_DSN:
        sentry_sdk.set_user(None)
    return response


# Register routers
app.include_router(auth_router)
app.include_router(simulation_router)
app.include_router(agents_router)
app.include_router(websocket_router)
app.include_router(document_router)
app.include_router(payment_router)
app.include_router(email_router)
app.include_router(admin_router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TeamDynamics Backend",
        "version": "1.0.0",
        "db_connected": _db_ready,
        "llm_provider": os.getenv("LLM_PROVIDER", "openai"),
        "sentry_enabled": bool(SENTRY_DSN),
    }


@app.get("/debug-sentry")
async def debug_sentry():
    """Test endpoint to verify Sentry integration.
    Raises a deliberate exception — should appear in your Sentry dashboard.
    Remove or protect this endpoint in production."""
    if os.getenv("SENTRY_DEBUG_ENDPOINT_ENABLED", "").lower() not in {"1", "true", "yes"}:
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    raise RuntimeError("Sentry test: this error was triggered intentionally via /debug-sentry")
