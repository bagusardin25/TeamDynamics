"""
Rate Limiter — Shared SlowAPI limiter instance for all routers.

This module exists to avoid circular imports between main.py and routers.
All routers that need per-route rate limiting import `limiter` from here.
"""

import os
from slowapi import Limiter
from slowapi.util import get_remote_address

REDIS_URL = os.getenv("REDIS_URL", "")

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],
    storage_uri=REDIS_URL if REDIS_URL else "memory://",
    in_memory_fallback_enabled=True,
    headers_enabled=True,
    swallow_errors=True,
)
