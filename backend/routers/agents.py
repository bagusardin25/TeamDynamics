"""
Agent preset routes.
"""

from fastapi import APIRouter
from data.presets import PRESET_AGENTS

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("/presets")
async def get_preset_agents():
    """Return all available preset agent personas."""
    return PRESET_AGENTS
