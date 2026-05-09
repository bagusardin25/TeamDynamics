"""
Email routes — manage email preferences, view history, and admin controls.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException

from routers.auth import require_auth, TokenData
from models.database import (
    get_user_by_id, get_drip_state, get_user_email_history,
    set_email_opt_out, deactivate_drip, reactivate_drip,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/email", tags=["email"])


@router.get("/preferences")
async def get_email_preferences(current_user: TokenData = Depends(require_auth)):
    """Get current user's email preferences and drip state."""
    user = await get_user_by_id(current_user.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    drip = await get_drip_state(current_user.user_id)

    return {
        "email_onboarding_opt_out": user.get("email_onboarding_opt_out", False),
        "drip_state": {
            "current_step": drip["current_step"] if drip else 0,
            "is_active": drip["is_active"] if drip else False,
            "total_steps": 5,
            "last_sent_at": str(drip["last_sent_at"]) if drip and drip.get("last_sent_at") else None,
            "next_send_at": str(drip["next_send_at"]) if drip and drip.get("next_send_at") else None,
        } if drip else None,
    }


@router.post("/unsubscribe")
async def unsubscribe_drip(current_user: TokenData = Depends(require_auth)):
    """Unsubscribe from onboarding drip emails."""
    await set_email_opt_out(current_user.user_id, True)
    await deactivate_drip(current_user.user_id)

    logger.info(f"📧 User {current_user.user_id} unsubscribed from drip emails")
    return {"success": True, "message": "Unsubscribed from onboarding emails"}


@router.post("/resubscribe")
async def resubscribe_drip(current_user: TokenData = Depends(require_auth)):
    """Re-subscribe to onboarding drip emails."""
    await set_email_opt_out(current_user.user_id, False)
    await reactivate_drip(current_user.user_id)

    logger.info(f"📧 User {current_user.user_id} re-subscribed to drip emails")
    return {"success": True, "message": "Re-subscribed to onboarding emails"}


@router.get("/history")
async def get_email_history(current_user: TokenData = Depends(require_auth)):
    """Get email delivery history for the current user."""
    history = await get_user_email_history(current_user.user_id)

    return {
        "emails": [
            {
                "id": h["id"],
                "type": h["email_type"],
                "subject": h["subject"],
                "status": h["status"],
                "sent_at": str(h["sent_at"]) if h.get("sent_at") else None,
            }
            for h in history
        ]
    }
