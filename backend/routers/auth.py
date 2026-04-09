"""
Authentication routes — register, login, Google OAuth, and user profile.
"""

from __future__ import annotations

import os
import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

import httpx

from services.auth_service import (
    hash_password, verify_password, create_access_token,
    decode_access_token, is_admin_email, TokenData,
)
from models.database import (
    create_user, get_user_by_email, get_user_by_id,
    get_user_simulations,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

# Security scheme
security = HTTPBearer(auto_error=False)

# Google OAuth config
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")


# ── Request/Response Models ───────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token from frontend


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    role: str
    credits: int
    auth_provider: str


# ── Auth Dependency ───────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData | None:
    """Extract and validate the current user from the JWT token.
    Returns None if no token is provided (allows optional auth)."""
    if not credentials:
        return None
    token_data = decode_access_token(credentials.credentials)
    return token_data


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """Require authentication — raises 401 if no valid token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    token_data = decode_access_token(credentials.credentials)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return token_data


# ── Routes ────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    """Register a new user with email and password."""
    # Check if email already exists
    existing = await get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = str(uuid.uuid4())[:12]
    role = "admin" if is_admin_email(req.email) else "user"

    user = await create_user(
        user_id=user_id,
        email=req.email,
        name=req.name,
        auth_provider="email",
        hashed_password=await hash_password(req.password),
        role=role,
    )

    token = create_access_token({
        "sub": user_id,
        "email": req.email,
        "role": role,
    })

    return {"token": token, "user": user}


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Login with email and password."""
    user = await get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("hashed_password"):
        raise HTTPException(
            status_code=401,
            detail="This account uses Google login. Please sign in with Google."
        )

    if not await verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
    })

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatar_url": user.get("avatar_url"),
            "role": user["role"],
            "credits": user["credits"],
            "auth_provider": user["auth_provider"],
        },
    }


@router.post("/google", response_model=AuthResponse)
async def google_auth(req: GoogleAuthRequest):
    """Authenticate with Google OAuth. Creates account if new user."""
    # Verify the Google ID token
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={req.credential}"
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")
            google_data = resp.json()
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Failed to verify Google token")

    email = google_data.get("email")
    name = google_data.get("name", email.split("@")[0])
    avatar = google_data.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Could not get email from Google")

    # Check if user exists
    user = await get_user_by_email(email)

    if not user:
        # Create new user
        user_id = str(uuid.uuid4())[:12]
        role = "admin" if is_admin_email(email) else "user"

        user = await create_user(
            user_id=user_id,
            email=email,
            name=name,
            auth_provider="google",
            avatar_url=avatar,
            role=role,
        )
    else:
        user = {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatar_url": user.get("avatar_url") or avatar,
            "role": user["role"],
            "credits": user["credits"],
            "auth_provider": user["auth_provider"],
        }

    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
    })

    return {"token": token, "user": user}


@router.get("/me")
async def get_me(current_user: TokenData = Depends(require_auth)):
    """Get current user profile."""
    user = await get_user_by_id(current_user.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "avatar_url": user.get("avatar_url"),
        "role": user["role"],
        "credits": user["credits"],
        "auth_provider": user["auth_provider"],
    }


@router.get("/me/simulations")
async def get_my_simulations(current_user: TokenData = Depends(require_auth)):
    """Get all simulations for the current user."""
    sims = await get_user_simulations(current_user.user_id)
    return sims
