"""
TeamDynamics Backend — FastAPI Application
Multi-agent AI simulation engine for team dynamics.
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from models.database import init_db, close_db
from routers.simulation import router as simulation_router
from routers.agents import router as agents_router
from routers.websocket import router as websocket_router
from routers.auth import router as auth_router
from routers.document import router as document_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_MAX_RETRIES = int(os.getenv("DB_MAX_RETRIES", "5"))
DB_RETRY_DELAY = int(os.getenv("DB_RETRY_DELAY", "3"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle with resilient DB connection."""
    logger.info("🚀 Initializing TeamDynamics Backend...")
    logger.info(f"🤖 LLM Provider: {os.getenv('LLM_PROVIDER', 'openai')}")

    # Retry database connection — Railway/cloud DBs may not be ready immediately
    db_ready = False
    for attempt in range(1, DB_MAX_RETRIES + 1):
        try:
            await init_db()
            logger.info("✅ Database initialized (PostgreSQL)")
            db_ready = True
            break
        except Exception as e:
            logger.warning(
                f"⚠️ DB connection attempt {attempt}/{DB_MAX_RETRIES} failed: {e}"
            )
            if attempt < DB_MAX_RETRIES:
                await asyncio.sleep(DB_RETRY_DELAY)

    if not db_ready:
        logger.error("❌ Could not connect to database after all retries. "
                      "App will start but DB operations will fail.")

    yield

    logger.info("👋 Shutting down TeamDynamics Backend")
    await close_db()


app = FastAPI(
    title="TeamDynamics API",
    description="Multi-agent AI simulation engine for team dynamics, morale, and productivity.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend (supports comma-separated origins for production)
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in frontend_url.split(",")]
allowed_origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(simulation_router)
app.include_router(agents_router)
app.include_router(websocket_router)
app.include_router(document_router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TeamDynamics Backend",
        "version": "1.0.0",
        "llm_provider": os.getenv("LLM_PROVIDER", "openai"),
    }
