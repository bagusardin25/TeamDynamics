"""
Authentication service — JWT token management and password hashing.
"""

from __future__ import annotations

import os
import asyncio
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from jose import JWTError, jwt
from pydantic import BaseModel
import bcrypt

load_dotenv()

# JWT Configuration
_PLACEHOLDER_SECRETS = {
    "",
    "your-secret-key",
    "change-me",
    "change-this-in-production",
    "teamdynamics-secret-key-change-in-production",
}


def _is_production() -> bool:
    env = (
        os.getenv("ENVIRONMENT")
        or os.getenv("APP_ENV")
        or os.getenv("RAILWAY_ENVIRONMENT")
        or os.getenv("VERCEL_ENV")
        or ""
    ).lower()
    return env in {"production", "prod"}


def _load_secret_key() -> str:
    configured = os.getenv("JWT_SECRET_KEY", "").strip()
    if configured and configured.lower() not in _PLACEHOLDER_SECRETS and len(configured) >= 32:
        return configured

    if _is_production():
        raise RuntimeError(
            "JWT_SECRET_KEY must be set to a strong random value of at least 32 characters in production."
        )

    return "dev-only-" + secrets.token_urlsafe(48)


SECRET_KEY = _load_secret_key()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


class TokenData(BaseModel):
    user_id: str
    email: str
    role: str


def _hash_sync(password: str) -> str:
    """Synchronous bcrypt hash."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_sync(plain_password: str, hashed_password: str) -> bool:
    """Synchronous bcrypt verify."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


async def hash_password(password: str) -> str:
    """Hash a password (runs in thread pool to avoid blocking async loop)."""
    return await asyncio.to_thread(_hash_sync, password)


async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash (runs in thread pool)."""
    return await asyncio.to_thread(_verify_sync, plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> TokenData | None:
    """Decode and validate a JWT token. Returns TokenData or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role", "user")
        if user_id is None or email is None:
            return None
        return TokenData(user_id=user_id, email=email, role=role)
    except JWTError:
        return None


def is_admin_email(email: str) -> bool:
    """Check if an email is designated as admin (no-limit)."""
    admin_email = os.getenv("ADMIN_EMAIL", "")
    if not admin_email:
        return False
    return email.lower() == admin_email.lower()

