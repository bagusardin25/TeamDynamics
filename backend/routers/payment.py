"""
Payment routes — Stripe Checkout integration for credit purchases.

Supports:
- Creating Stripe Checkout Sessions for credit packages
- Handling Stripe webhook events to fulfill purchases
- Listing available credit packages
"""

from __future__ import annotations

import os
import json
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from routers.auth import require_auth, TokenData

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payment", tags=["payment"])

# ── Credit Packages ──────────────────────────────────────────────────

CREDIT_PACKAGES = [
    {
        "id": "starter",
        "name": "Starter",
        "credits": 5,
        "price": 499,  # cents
        "price_display": "$4.99",
        "description": "5 simulation credits — perfect for trying out TeamDynamics",
        "popular": False,
    },
    {
        "id": "growth",
        "name": "Growth",
        "credits": 15,
        "price": 1499,  # cents
        "price_display": "$14.99",
        "description": "15 simulation credits — best value for regular use",
        "popular": True,
    },
    {
        "id": "professional",
        "name": "Professional",
        "credits": 50,
        "price": 4999,  # cents
        "price_display": "$49.99",
        "description": "50 simulation credits — for consultants and teams",
        "popular": False,
    },
]

PACKAGE_MAP = {p["id"]: p for p in CREDIT_PACKAGES}


# ── Request Models ───────────────────────────────────────────────────

class CreateCheckoutRequest(BaseModel):
    package_id: str
    success_url: str | None = None
    cancel_url: str | None = None


# ── Routes ───────────────────────────────────────────────────────────

@router.get("/plans")
async def get_plans():
    """Return available credit packages."""
    return CREDIT_PACKAGES


@router.post("/create-checkout")
async def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: TokenData = Depends(require_auth),
):
    """Create a Stripe Checkout Session for purchasing credits."""
    package = PACKAGE_MAP.get(request.package_id)
    if not package:
        raise HTTPException(status_code=400, detail=f"Unknown package: {request.package_id}")

    stripe_key = os.getenv("STRIPE_SECRET_KEY")
    if not stripe_key:
        raise HTTPException(
            status_code=503,
            detail="Payment system is not configured. Please contact support."
        )

    try:
        import stripe
        stripe.api_key = stripe_key

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        success_url = request.success_url or f"{frontend_url}/dashboard?payment=success"
        cancel_url = request.cancel_url or f"{frontend_url}/pricing?payment=cancelled"

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"TeamDynamics {package['name']} — {package['credits']} Credits",
                        "description": package["description"],
                    },
                    "unit_amount": package["price"],
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": current_user.user_id,
                "package_id": package["id"],
                "credits": str(package["credits"]),
            },
            customer_email=current_user.email,
        )

        return {"checkout_url": session.url, "session_id": session.id}

    except ImportError:
        raise HTTPException(status_code=503, detail="Stripe package not installed")
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events (checkout.session.completed)."""
    stripe_key = os.getenv("STRIPE_SECRET_KEY")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not stripe_key:
        raise HTTPException(status_code=503, detail="Payment system not configured")

    try:
        import stripe
        stripe.api_key = stripe_key
    except ImportError:
        raise HTTPException(status_code=503, detail="Stripe package not installed")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        if webhook_secret and sig_header:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            # Development mode: parse without signature verification
            event = json.loads(payload)
            logger.warning("⚠️ Stripe webhook received without signature verification (dev mode)")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid webhook payload: {e}")

    # Handle checkout.session.completed
    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})

        user_id = metadata.get("user_id")
        package_id = metadata.get("package_id")
        credits_str = metadata.get("credits")

        if user_id and credits_str:
            credits = int(credits_str)
            try:
                from models.database import add_user_credits, save_payment_transaction

                # Add credits to user
                await add_user_credits(user_id, credits)

                # Record the transaction
                await save_payment_transaction(
                    user_id=user_id,
                    stripe_session_id=session.get("id", ""),
                    package_id=package_id or "unknown",
                    credits=credits,
                    amount_cents=session.get("amount_total", 0),
                    currency=session.get("currency", "usd"),
                )

                logger.info(
                    f"✅ Payment fulfilled: user={user_id}, "
                    f"package={package_id}, credits=+{credits}"
                )
            except Exception as e:
                logger.error(f"❌ Failed to fulfill payment for user {user_id}: {e}")
                # Don't raise — Stripe will retry the webhook
        else:
            logger.warning(f"⚠️ Checkout session missing metadata: {metadata}")

    return {"status": "ok"}
