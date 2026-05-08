"""
State Manager — Redis-backed shared cache with in-memory fallback.

Provides a dual-layer caching strategy:
  Layer 1: Process-local dict (fast, for sync access within the current worker)
  Layer 2: Redis (shared across workers for horizontal scaling)
  Layer 3: PostgreSQL (persistent source of truth — handled by database.py)

When REDIS_URL is not configured, all operations gracefully fall back to
process-local dicts only (identical to pre-Redis behavior).
"""

from __future__ import annotations

import os
import json
import asyncio
import logging
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

# Redis client (initialized at startup, None if not configured)
_redis_client = None
_redis_available = False

# Local in-memory fallback cache (used when Redis is not available,
# and as Layer 1 fast cache even when Redis IS available)
_local_cache: dict[str, str] = {}


# ── Lifecycle ─────────────────────────────────────────────────────────

async def init_redis():
    """Initialize the Redis connection pool. Safe to call if REDIS_URL is not set."""
    global _redis_client, _redis_available

    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        logger.info("⚠️  REDIS_URL not configured — using in-memory cache only (single-worker mode)")
        return

    try:
        import redis.asyncio as aioredis
        _redis_client = aioredis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
        )
        # Test connection
        await _redis_client.ping()
        _redis_available = True
        logger.info(f"✅ Redis connected ({redis_url.split('@')[-1] if '@' in redis_url else redis_url})")
    except ImportError:
        logger.warning("⚠️  redis package not installed — using in-memory cache only")
    except Exception as e:
        logger.warning(f"⚠️  Redis connection failed: {e} — using in-memory cache only")
        _redis_client = None
        _redis_available = False


async def close_redis():
    """Close the Redis connection pool."""
    global _redis_client, _redis_available
    if _redis_client:
        try:
            await _redis_client.aclose()
        except Exception:
            pass
        _redis_client = None
        _redis_available = False


def is_available() -> bool:
    """Check if Redis is currently available."""
    return _redis_available


# ── Generic Cache Operations ─────────────────────────────────────────

async def cache_get(key: str) -> str | None:
    """Get a value from cache. Tries Redis first, falls back to local."""
    # Try Redis
    if _redis_available and _redis_client:
        try:
            value = await _redis_client.get(key)
            if value is not None:
                return value
        except Exception as e:
            logger.debug(f"Redis GET failed for {key}: {e}")

    # Fall back to local
    return _local_cache.get(key)


async def cache_set(key: str, value: str, ttl: int = 7200):
    """Set a value in cache. Writes to both Redis and local."""
    # Always write to local
    _local_cache[key] = value

    # Also write to Redis if available
    if _redis_available and _redis_client:
        try:
            await _redis_client.set(key, value, ex=ttl)
        except Exception as e:
            logger.debug(f"Redis SET failed for {key}: {e}")


async def cache_delete(key: str):
    """Delete a value from cache."""
    _local_cache.pop(key, None)

    if _redis_available and _redis_client:
        try:
            await _redis_client.delete(key)
        except Exception as e:
            logger.debug(f"Redis DELETE failed for {key}: {e}")


# ── Typed Helpers (JSON serialization) ────────────────────────────────

# Key format: "sim:{sim_id}:{type}"

async def get_sim_state(sim_id: str) -> dict | None:
    """Get cached simulation state."""
    raw = await cache_get(f"sim:{sim_id}:state")
    if raw:
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            pass
    return None


async def set_sim_state(sim_id: str, state: dict):
    """Cache a simulation state (serialized, without non-serializable fields)."""
    await cache_set(f"sim:{sim_id}:state", json.dumps(state))


async def get_world(sim_id: str) -> dict | None:
    """Get cached world state."""
    raw = await cache_get(f"sim:{sim_id}:world")
    if raw:
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            pass
    return None


async def set_world(sim_id: str, world_data: dict):
    """Cache world state data."""
    await cache_set(f"sim:{sim_id}:world", json.dumps(world_data))


async def get_tracker_data(sim_id: str) -> dict | None:
    """Get cached decision tracker."""
    raw = await cache_get(f"sim:{sim_id}:tracker")
    if raw:
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            pass
    return None


async def set_tracker_data(sim_id: str, data: dict):
    """Cache decision tracker data."""
    await cache_set(f"sim:{sim_id}:tracker", json.dumps(data))


async def get_metrics(sim_id: str) -> list | None:
    """Get cached metrics history."""
    raw = await cache_get(f"sim:{sim_id}:metrics")
    if raw:
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            pass
    return None


async def set_metrics(sim_id: str, history: list):
    """Cache metrics history."""
    await cache_set(f"sim:{sim_id}:metrics", json.dumps(history))


async def get_events(sim_id: str) -> list | None:
    """Get cached fired events list."""
    raw = await cache_get(f"sim:{sim_id}:events")
    if raw:
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            pass
    return None


async def set_events(sim_id: str, events: list):
    """Cache fired events list."""
    await cache_set(f"sim:{sim_id}:events", json.dumps(events))


# ── Pub/Sub for WebSocket Broadcasting ────────────────────────────────

async def publish_ws_message(sim_id: str, payload: dict):
    """Publish a WebSocket message to the Redis pub/sub channel for a simulation."""
    if not _redis_available or not _redis_client:
        return  # No cross-worker broadcasting without Redis

    try:
        channel = f"ws:sim:{sim_id}"
        await _redis_client.publish(channel, json.dumps(payload))
    except Exception as e:
        logger.debug(f"Redis PUBLISH failed for sim {sim_id}: {e}")


async def subscribe_ws_messages(sim_id: str) -> AsyncGenerator[dict, None]:
    """
    Subscribe to WebSocket messages for a simulation via Redis pub/sub.
    Yields parsed message dicts. Returns immediately if Redis is not available.
    """
    if not _redis_available or not _redis_client:
        return

    try:
        pubsub = _redis_client.pubsub()
        channel = f"ws:sim:{sim_id}"
        await pubsub.subscribe(channel)

        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        yield data
                    except (json.JSONDecodeError, TypeError):
                        continue
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.aclose()
    except Exception as e:
        logger.debug(f"Redis subscribe failed for sim {sim_id}: {e}")


# ── Cleanup ───────────────────────────────────────────────────────────

async def cleanup_sim(sim_id: str):
    """Remove all cached data for a completed simulation."""
    keys = [
        f"sim:{sim_id}:state",
        f"sim:{sim_id}:world",
        f"sim:{sim_id}:tracker",
        f"sim:{sim_id}:metrics",
        f"sim:{sim_id}:events",
    ]
    for key in keys:
        _local_cache.pop(key, None)

    if _redis_available and _redis_client:
        try:
            await _redis_client.delete(*keys)
        except Exception as e:
            logger.debug(f"Redis cleanup failed for sim {sim_id}: {e}")
