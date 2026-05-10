"""
Admin routes — LLM usage monitoring, budget management, and system health.
All endpoints require admin role authentication.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel

from routers.auth import require_auth, TokenData
from services.llm_budget import budget_tracker

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Auth Helper ───────────────────────────────────────────────────────

async def require_admin(current_user: TokenData = Depends(require_auth)) -> TokenData:
    """Require admin role — raises 403 if not admin."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── LLM Usage ─────────────────────────────────────────────────────────

@router.get("/llm-usage")
async def get_llm_usage(admin: TokenData = Depends(require_admin)):
    """Get LLM usage stats (today + 30-day history)."""
    return budget_tracker.get_usage_stats()


class BudgetUpdateRequest(BaseModel):
    daily_cap_usd: float


@router.patch("/llm-budget")
async def update_llm_budget(
    req: BudgetUpdateRequest,
    admin: TokenData = Depends(require_admin),
):
    """Update the daily LLM budget cap. Set to 0 to disable."""
    if req.daily_cap_usd < 0:
        raise HTTPException(status_code=400, detail="Budget cap cannot be negative")

    old_cap = budget_tracker.daily_cap
    budget_tracker.daily_cap = req.daily_cap_usd

    logger.info(
        f"💰 Admin {admin.user_id} updated LLM budget: "
        f"${old_cap:.2f} → ${req.daily_cap_usd:.2f}"
    )

    return {
        "success": True,
        "old_cap_usd": old_cap,
        "new_cap_usd": budget_tracker.daily_cap,
        "message": (
            f"Budget cap updated to ${req.daily_cap_usd:.2f}/day"
            if req.daily_cap_usd > 0
            else "Budget enforcement DISABLED — all LLM calls will be allowed"
        ),
    }
