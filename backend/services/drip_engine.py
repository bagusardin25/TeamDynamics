"""
Drip Engine — Orchestrates the onboarding email drip campaign.
Handles enrollment, step advancement, smart skip logic, and periodic processing.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from services.email_service import get_email_service
from services.email_templates import render_template

logger = logging.getLogger(__name__)


# ── Drip Sequence Configuration ───────────────────────────────────────

ONBOARDING_SEQUENCE = [
    {
        "step": 1,
        "delay_hours": 0,        # Immediate
        "template": "welcome",
        "email_type": "onboarding_welcome",
        "skip_if": None,
    },
    {
        "step": 2,
        "delay_hours": 24,       # +1 day
        "template": "meet_your_team",
        "email_type": "onboarding_meet_team",
        "skip_if": None,
    },
    {
        "step": 3,
        "delay_hours": 72,       # +3 days
        "template": "inject_chaos",
        "email_type": "onboarding_inject_chaos",
        "skip_if": "has_simulation",  # Skip if user already ran a simulation
    },
    {
        "step": 4,
        "delay_hours": 168,      # +7 days
        "template": "understand_reports",
        "email_type": "onboarding_reports",
        "skip_if": "no_completed_sim",  # Skip if user has no completed simulation
    },
    {
        "step": 5,
        "delay_hours": 336,      # +14 days
        "template": "advanced_features",
        "email_type": "onboarding_advanced",
        "skip_if": None,
    },
]

TOTAL_STEPS = len(ONBOARDING_SEQUENCE)


def _get_step_config(step: int) -> dict | None:
    """Get the configuration for a specific step number."""
    for s in ONBOARDING_SEQUENCE:
        if s["step"] == step:
            return s
    return None


class DripEngine:
    """Manages the onboarding drip campaign lifecycle."""

    def __init__(self):
        self._email_service = get_email_service()

    async def enroll_user(self, user_id: str, email: str, name: str):
        """
        Enroll a new user into the drip campaign.
        Called immediately after registration. Sends welcome email right away.
        """
        from models.database import create_drip_state, log_email

        try:
            # Create drip tracking state
            now = datetime.now(timezone.utc)
            next_step = _get_step_config(2)
            next_send = now + timedelta(hours=next_step["delay_hours"]) if next_step else None

            await create_drip_state(user_id, next_send_at=next_send)

            # Send welcome email immediately (step 1)
            step1 = _get_step_config(1)
            template_data = render_template(step1["template"], name)

            result = await self._email_service.send_email(
                to=email,
                subject=template_data["subject"],
                html_body=template_data["html"],
                tags=[{"name": "campaign", "value": "onboarding"},
                      {"name": "step", "value": "1"}],
            )

            status = "sent" if result["success"] else "failed"
            await log_email(
                user_id=user_id,
                email_type=step1["email_type"],
                subject=template_data["subject"],
                status=status,
                error_message=result.get("error"),
            )

            # Advance to step 2
            from models.database import advance_drip_step
            await advance_drip_step(user_id, current_step=1, next_send_at=next_send)

            logger.info(f"📧 User {user_id} enrolled in drip campaign — welcome email {status}")

        except Exception as e:
            logger.error(f"📧 Failed to enroll user {user_id} in drip: {e}")

    async def process_pending_drips(self):
        """
        Process all pending drip emails. Called periodically by the scheduler.
        Fetches users with due emails and sends the next step.
        """
        from models.database import (
            get_pending_drips, get_user_by_id, get_user_simulations,
            advance_drip_step, deactivate_drip, log_email,
        )

        try:
            pending = await get_pending_drips()
            if not pending:
                return

            logger.info(f"📧 Processing {len(pending)} pending drip emails...")

            for drip in pending:
                user_id = drip["user_id"]
                current_step = drip["current_step"]
                next_step_num = current_step + 1

                # Check if sequence is complete
                step_config = _get_step_config(next_step_num)
                if not step_config:
                    await deactivate_drip(user_id)
                    logger.info(f"📧 User {user_id}: drip sequence complete")
                    continue

                # Get user data
                user = await get_user_by_id(user_id)
                if not user:
                    await deactivate_drip(user_id)
                    continue

                # Check opt-out
                if user.get("email_onboarding_opt_out", False):
                    await deactivate_drip(user_id)
                    logger.info(f"📧 User {user_id}: opted out — deactivating drip")
                    continue

                # Evaluate skip condition
                should_skip = await self._evaluate_skip(
                    user_id, step_config.get("skip_if")
                )

                if should_skip:
                    # Skip this step, advance to next
                    logger.info(
                        f"📧 User {user_id}: skipping step {next_step_num} "
                        f"(condition: {step_config['skip_if']})"
                    )
                    await log_email(
                        user_id=user_id,
                        email_type=step_config["email_type"],
                        subject=f"[SKIPPED] {step_config['template']}",
                        status="skipped",
                    )
                    # Calculate next step timing
                    further_step = _get_step_config(next_step_num + 1)
                    if further_step:
                        next_send = datetime.now(timezone.utc) + timedelta(
                            hours=further_step["delay_hours"] - step_config["delay_hours"]
                        )
                        await advance_drip_step(user_id, next_step_num, next_send)
                    else:
                        await deactivate_drip(user_id)
                    continue

                # Send the email
                try:
                    template_data = render_template(
                        step_config["template"], user["name"]
                    )
                    result = await self._email_service.send_email(
                        to=user["email"],
                        subject=template_data["subject"],
                        html_body=template_data["html"],
                        tags=[
                            {"name": "campaign", "value": "onboarding"},
                            {"name": "step", "value": str(next_step_num)},
                        ],
                    )

                    status = "sent" if result["success"] else "failed"
                    await log_email(
                        user_id=user_id,
                        email_type=step_config["email_type"],
                        subject=template_data["subject"],
                        status=status,
                        error_message=result.get("error"),
                    )

                    # Advance step
                    further_step = _get_step_config(next_step_num + 1)
                    if further_step:
                        delay_diff = further_step["delay_hours"] - step_config["delay_hours"]
                        next_send = datetime.now(timezone.utc) + timedelta(hours=delay_diff)
                        await advance_drip_step(user_id, next_step_num, next_send)
                    else:
                        # Last step — deactivate
                        await advance_drip_step(user_id, next_step_num, next_send_at=None)
                        await deactivate_drip(user_id)

                    logger.info(
                        f"📧 User {user_id}: step {next_step_num} {status}"
                    )

                except Exception as e:
                    logger.error(
                        f"📧 Failed to send step {next_step_num} to {user_id}: {e}"
                    )

        except Exception as e:
            logger.error(f"📧 Drip processing error: {e}")

    async def _evaluate_skip(self, user_id: str, condition: str | None) -> bool:
        """Evaluate whether a drip step should be skipped based on user activity."""
        if not condition:
            return False

        from models.database import get_user_simulations

        try:
            sims = await get_user_simulations(user_id)

            if condition == "has_simulation":
                # Skip if user already has at least one simulation
                return len(sims) > 0

            if condition == "no_completed_sim":
                # Skip if user has NO completed simulations
                completed = [s for s in sims if s.get("status") == "completed"]
                return len(completed) == 0

        except Exception as e:
            logger.error(f"📧 Skip evaluation error for {user_id}: {e}")

        return False


# Singleton
_drip_engine: DripEngine | None = None


def get_drip_engine() -> DripEngine:
    """Get or create the global DripEngine instance."""
    global _drip_engine
    if _drip_engine is None:
        _drip_engine = DripEngine()
    return _drip_engine
