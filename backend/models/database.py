"""
PostgreSQL database layer using asyncpg with connection pooling.
Supports Supabase (with SSL) and local PostgreSQL.
"""

from __future__ import annotations

import os
import ssl
import json
import logging
import asyncpg
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/teamdynamics"
)

# Connection pool (initialized at startup)
_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    """Get or create the connection pool."""
    global _pool
    if _pool is None:
        # Detect if SSL is needed (Supabase, cloud PostgreSQL)
        parsed = urlparse(DATABASE_URL)
        qs = parse_qs(parsed.query)
        needs_ssl = (
            "sslmode" in qs
            or "supabase" in (parsed.hostname or "")
            or os.getenv("DB_SSL", "").lower() in ("true", "1", "require")
        )

        # Strip sslmode from URL since asyncpg handles it via ssl parameter
        clean_url = DATABASE_URL.split("?")[0]

        ssl_ctx = ssl.create_default_context() if needs_ssl else None
        if ssl_ctx:
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl.CERT_NONE

        _pool = await asyncpg.create_pool(
            clean_url,
            min_size=2,
            max_size=10,
            command_timeout=30,
            ssl=ssl_ctx,
        )
    return _pool


async def init_db():
    """Initialize database tables."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Create tables
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                avatar_url TEXT,
                auth_provider TEXT NOT NULL DEFAULT 'email',
                hashed_password TEXT,
                role TEXT NOT NULL DEFAULT 'user',
                credits INTEGER NOT NULL DEFAULT 10,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS simulations (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                status TEXT NOT NULL DEFAULT 'idle',
                current_round INTEGER NOT NULL DEFAULT 0,
                total_rounds INTEGER NOT NULL DEFAULT 12,
                company_name TEXT NOT NULL,
                company_culture TEXT NOT NULL,
                crisis_scenario TEXT NOT NULL,
                crisis_description TEXT,
                pacing TEXT NOT NULL DEFAULT 'normal',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT NOT NULL,
                simulation_id TEXT NOT NULL REFERENCES simulations(id),
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                type TEXT NOT NULL,
                color TEXT,
                personality_json TEXT NOT NULL,
                morale INTEGER NOT NULL DEFAULT 70,
                stress INTEGER NOT NULL DEFAULT 30,
                loyalty INTEGER NOT NULL DEFAULT 70,
                productivity INTEGER NOT NULL DEFAULT 75,
                has_resigned BOOLEAN NOT NULL DEFAULT FALSE,
                resigned_week INTEGER,
                memory_json TEXT DEFAULT '[]',
                PRIMARY KEY (id, simulation_id)
            )
        """)

        # Migration: add memory_json if it doesn't exist
        try:
            await conn.execute("""
                ALTER TABLE agents ADD COLUMN IF NOT EXISTS memory_json TEXT DEFAULT '[]'
            """)
        except Exception:
            pass  # Column already exists

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                simulation_id TEXT NOT NULL REFERENCES simulations(id),
                round INTEGER NOT NULL,
                agent_id TEXT,
                agent_name TEXT,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                thought TEXT,
                state_changes_json TEXT,
                timestamp TEXT
            )
        """)

    logger.info("✅ PostgreSQL database initialized")


async def close_db():
    """Close the connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def _record_to_dict(record: asyncpg.Record) -> dict:
    """Convert asyncpg Record to a plain dict."""
    return dict(record)


# ── User Operations ───────────────────────────────────────────────────

async def create_user(user_id: str, email: str, name: str,
                      auth_provider: str = "email",
                      hashed_password: str | None = None,
                      avatar_url: str | None = None,
                      role: str = "user") -> dict:
    """Create a new user and return their data."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO users (id, email, name, auth_provider, hashed_password, avatar_url, role)
               VALUES ($1, $2, $3, $4, $5, $6, $7)""",
            user_id, email, name, auth_provider, hashed_password, avatar_url, role
        )
        return {
            "id": user_id, "email": email, "name": name,
            "auth_provider": auth_provider, "avatar_url": avatar_url,
            "role": role, "credits": 10,
        }


async def get_user_by_email(email: str) -> dict | None:
    """Get a user by email."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE email=$1", email)
        return _record_to_dict(row) if row else None


async def get_user_by_id(user_id: str) -> dict | None:
    """Get a user by ID."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE id=$1", user_id)
        return _record_to_dict(row) if row else None


async def update_user_credits(user_id: str, credits: int):
    """Update user credits."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("UPDATE users SET credits=$1 WHERE id=$2", credits, user_id)


async def get_user_simulations(user_id: str) -> list[dict]:
    """Get all simulations for a user, ordered by newest first."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, status, current_round, total_rounds, company_name,
                      crisis_scenario, pacing, created_at
               FROM simulations WHERE user_id=$1 ORDER BY created_at DESC""",
            user_id
        )
        return [_record_to_dict(r) for r in rows]


# ── Simulation Operations ─────────────────────────────────────────────

async def save_simulation(sim_id: str, company_name: str, company_culture: str,
                          crisis_scenario: str, crisis_description: str | None,
                          total_rounds: int, pacing: str, user_id: str | None = None):
    """Insert a new simulation record."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO simulations (id, user_id, status, current_round, total_rounds,
               company_name, company_culture, crisis_scenario, crisis_description, pacing)
               VALUES ($1, $2, 'idle', 0, $3, $4, $5, $6, $7, $8)""",
            sim_id, user_id, total_rounds, company_name, company_culture,
            crisis_scenario, crisis_description, pacing
        )


async def update_simulation_status(sim_id: str, status: str, current_round: int | None = None):
    """Update simulation status and optionally the round."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        if current_round is not None:
            await conn.execute(
                "UPDATE simulations SET status=$1, current_round=$2 WHERE id=$3",
                status, current_round, sim_id
            )
        else:
            await conn.execute(
                "UPDATE simulations SET status=$1 WHERE id=$2",
                status, sim_id
            )


async def get_simulation(sim_id: str) -> dict | None:
    """Get simulation record by ID."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM simulations WHERE id=$1", sim_id)
        return _record_to_dict(row) if row else None


async def save_agent(sim_id: str, agent_id: str, name: str, role: str,
                     agent_type: str, color: str | None, personality: dict,
                     morale: int = 70, stress: int = 30,
                     loyalty: int = 70, productivity: int = 75):
    """Insert an agent record."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO agents (id, simulation_id, name, role, type, color,
               personality_json, morale, stress, loyalty, productivity)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)""",
            agent_id, sim_id, name, role, agent_type, color,
            json.dumps(personality), morale, stress, loyalty, productivity
        )


async def update_agent_state(sim_id: str, agent_id: str, morale: int, stress: int,
                             loyalty: int, productivity: int,
                             has_resigned: bool = False, resigned_week: int | None = None):
    """Update an agent's live state."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE agents SET morale=$1, stress=$2, loyalty=$3, productivity=$4,
               has_resigned=$5, resigned_week=$6 WHERE id=$7 AND simulation_id=$8""",
            morale, stress, loyalty, productivity,
            has_resigned, resigned_week, agent_id, sim_id
        )


async def get_agents(sim_id: str) -> list[dict]:
    """Get all agents for a simulation."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM agents WHERE simulation_id=$1", sim_id
        )
        return [_record_to_dict(r) for r in rows]


async def update_agent_memory(sim_id: str, agent_id: str, memory_json: str):
    """Update an agent's memory summary."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE agents SET memory_json=$1 WHERE id=$2 AND simulation_id=$3",
            memory_json, agent_id, sim_id
        )


async def get_agent_memory(sim_id: str, agent_id: str) -> str:
    """Get an agent's memory JSON string."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT memory_json FROM agents WHERE id=$1 AND simulation_id=$2",
            agent_id, sim_id
        )
        return row["memory_json"] if row and row["memory_json"] else "[]"


async def save_message(sim_id: str, round_num: int, agent_id: str | None,
                       agent_name: str | None, msg_type: str, content: str,
                       thought: str | None = None,
                       state_changes: dict | None = None,
                       timestamp: str | None = None) -> int:
    """Insert a message and return its ID."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO messages (simulation_id, round, agent_id, agent_name,
               type, content, thought, state_changes_json, timestamp)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               RETURNING id""",
            sim_id, round_num, agent_id, agent_name, msg_type, content,
            thought, json.dumps(state_changes) if state_changes else None, timestamp
        )
        return row["id"]


async def get_messages(sim_id: str) -> list[dict]:
    """Get all messages for a simulation."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM messages WHERE simulation_id=$1 ORDER BY id ASC",
            sim_id
        )
        return [_record_to_dict(r) for r in rows]
