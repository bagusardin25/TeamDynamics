"""
TeamDynamics Backend — FastAPI Application
Multi-agent AI simulation engine for team dynamics.
"""

import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from models.database import init_db
from routers.simulation import router as simulation_router
from routers.agents import router as agents_router
from routers.websocket import router as websocket_router
from routers.auth import router as auth_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("🚀 Initializing TeamDynamics Backend...")
    await init_db()
    logger.info("✅ Database initialized")
    logger.info(f"🤖 LLM Provider: {os.getenv('LLM_PROVIDER', 'openai')}")
    yield
    logger.info("👋 Shutting down TeamDynamics Backend")


app = FastAPI(
    title="TeamDynamics API",
    description="Multi-agent AI simulation engine for team dynamics, morale, and productivity.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(simulation_router)
app.include_router(agents_router)
app.include_router(websocket_router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TeamDynamics Backend",
        "version": "1.0.0",
        "llm_provider": os.getenv("LLM_PROVIDER", "openai"),
    }
