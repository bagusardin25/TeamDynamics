"""
Email Service — Send transactional emails via Resend API.
Falls back gracefully if RESEND_API_KEY is not configured.
"""

from __future__ import annotations

import os
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "TeamDynamics <onboarding@resend.dev>")
EMAIL_ENABLED = os.getenv("EMAIL_DRIP_ENABLED", "true").lower() in ("true", "1", "yes")

RESEND_API_URL = "https://api.resend.com/emails"


class EmailService:
    """Handles sending emails via Resend's HTTP API."""

    def __init__(self):
        self._api_key = RESEND_API_KEY
        self._from = EMAIL_FROM
        self._enabled = EMAIL_ENABLED and bool(self._api_key)
        if not self._enabled:
            logger.warning(
                "📧 Email service DISABLED — set RESEND_API_KEY and EMAIL_DRIP_ENABLED=true to enable"
            )

    @property
    def is_enabled(self) -> bool:
        return self._enabled

    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        tags: list[dict] | None = None,
    ) -> dict:
        """
        Send an email via Resend API.

        Args:
            to: Recipient email address
            subject: Email subject line
            html_body: Full HTML email body
            tags: Optional Resend tags for tracking (e.g. [{"name": "campaign", "value": "onboarding"}])

        Returns:
            dict with "success" (bool), "id" (Resend email ID or None), "error" (str or None)
        """
        if not self._enabled:
            logger.info(f"📧 [DRY RUN] Would send '{subject}' to {to}")
            return {"success": True, "id": "dry-run", "error": None}

        payload = {
            "from": self._from,
            "to": [to],
            "subject": subject,
            "html": html_body,
        }
        if tags:
            payload["tags"] = tags

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    RESEND_API_URL,
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

            if resp.status_code in (200, 201):
                data = resp.json()
                email_id = data.get("id", "unknown")
                logger.info(f"📧 Email sent: '{subject}' → {to} (ID: {email_id})")
                return {"success": True, "id": email_id, "error": None}
            else:
                error_msg = resp.text[:200]
                logger.error(
                    f"📧 Email send failed ({resp.status_code}): {error_msg}"
                )
                return {"success": False, "id": None, "error": error_msg}

        except httpx.RequestError as e:
            error_msg = f"Network error: {str(e)}"
            logger.error(f"📧 Email send failed: {error_msg}")
            return {"success": False, "id": None, "error": error_msg}
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"📧 Email send failed: {error_msg}")
            return {"success": False, "id": None, "error": error_msg}


# Singleton instance
_email_service: EmailService | None = None


def get_email_service() -> EmailService:
    """Get or create the global EmailService instance."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
