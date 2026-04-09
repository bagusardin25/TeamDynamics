"""
SQLite database layer using aiosqlite for async operations.
"""

from __future__ import annotations

import json
import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "teamdynamics.db"


async def get_db() -> aiosqlite.Connection:
    """Get a database connection."""
    db = await aiosqlite.connect(str(DB_PATH))
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    return db


async def init_db():
    """Initialize database tables."""
    db = await get_db()
    try:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                avatar_url TEXT,
                auth_provider TEXT NOT NULL DEFAULT 'email',
                hashed_password TEXT,
                role TEXT NOT NULL DEFAULT 'user',
                credits INTEGER NOT NULL DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS simulations (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                status TEXT NOT NULL DEFAULT 'idle',
                current_round INTEGER NOT NULL DEFAULT 0,
                total_rounds INTEGER NOT NULL DEFAULT 12,
                company_name TEXT NOT NULL,
                company_culture TEXT NOT NULL,
                crisis_scenario TEXT NOT NULL,
                crisis_description TEXT,
                pacing TEXT NOT NULL DEFAULT 'normal',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS agents (
                id TEXT NOT NULL,
                simulation_id TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                type TEXT NOT NULL,
                color TEXT,
                personality_json TEXT NOT NULL,
                morale INTEGER NOT NULL DEFAULT 70,
                stress INTEGER NOT NULL DEFAULT 30,
                loyalty INTEGER NOT NULL DEFAULT 70,
                productivity INTEGER NOT NULL DEFAULT 75,
                has_resigned INTEGER NOT NULL DEFAULT 0,
                resigned_week INTEGER,
                PRIMARY KEY (id, simulation_id),
                FOREIGN KEY (simulation_id) REFERENCES simulations(id)
            );

            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                simulation_id TEXT NOT NULL,
                round INTEGER NOT NULL,
                agent_id TEXT,
                agent_name TEXT,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                thought TEXT,
                state_changes_json TEXT,
                timestamp TEXT,
                FOREIGN KEY (simulation_id) REFERENCES simulations(id)
            );
        """)
        await db.commit()

        # Migration: Add user_id column if not exists (for existing databases)
        try:
            await db.execute("SELECT user_id FROM simulations LIMIT 1")
        except Exception:
            await db.execute("ALTER TABLE simulations ADD COLUMN user_id TEXT REFERENCES users(id)")
            await db.commit()

    finally:
        await db.close()


# ── User Operations ───────────────────────────────────────────────────

async def create_user(user_id: str, email: str, name: str,
                      auth_provider: str = "email",
                      hashed_password: str | None = None,
                      avatar_url: str | None = None,
                      role: str = "user") -> dict:
    """Create a new user and return their data."""
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO users (id, email, name, auth_provider, hashed_password, avatar_url, role)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (user_id, email, name, auth_provider, hashed_password, avatar_url, role)
        )
        await db.commit()
        return {
            "id": user_id, "email": email, "name": name,
            "auth_provider": auth_provider, "avatar_url": avatar_url,
            "role": role, "credits": 10,
        }
    finally:
        await db.close()


async def get_user_by_email(email: str) -> dict | None:
    """Get a user by email."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM users WHERE email=?", (email,))
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def get_user_by_id(user_id: str) -> dict | None:
    """Get a user by ID."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM users WHERE id=?", (user_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def update_user_credits(user_id: str, credits: int):
    """Update user credits."""
    db = await get_db()
    try:
        await db.execute("UPDATE users SET credits=? WHERE id=?", (credits, user_id))
        await db.commit()
    finally:
        await db.close()


async def get_user_simulations(user_id: str) -> list[dict]:
    """Get all simulations for a user, ordered by newest first."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT id, status, current_round, total_rounds, company_name,
                      crisis_scenario, pacing, created_at
               FROM simulations WHERE user_id=? ORDER BY created_at DESC""",
            (user_id,)
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


# ── Simulation Operations ─────────────────────────────────────────────

async def save_simulation(sim_id: str, company_name: str, company_culture: str,
                          crisis_scenario: str, crisis_description: str | None,
                          total_rounds: int, pacing: str, user_id: str | None = None):
    """Insert a new simulation record."""
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO simulations (id, user_id, status, current_round, total_rounds,
               company_name, company_culture, crisis_scenario, crisis_description, pacing)
               VALUES (?, ?, 'idle', 0, ?, ?, ?, ?, ?, ?)""",
            (sim_id, user_id, total_rounds, company_name, company_culture,
             crisis_scenario, crisis_description, pacing)
        )
        await db.commit()
    finally:
        await db.close()


async def update_simulation_status(sim_id: str, status: str, current_round: int | None = None):
    """Update simulation status and optionally the round."""
    db = await get_db()
    try:
        if current_round is not None:
            await db.execute(
                "UPDATE simulations SET status=?, current_round=? WHERE id=?",
                (status, current_round, sim_id)
            )
        else:
            await db.execute(
                "UPDATE simulations SET status=? WHERE id=?",
                (status, sim_id)
            )
        await db.commit()
    finally:
        await db.close()


async def get_simulation(sim_id: str) -> dict | None:
    """Get simulation record by ID."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM simulations WHERE id=?", (sim_id,))
        row = await cursor.fetchone()
        if row:
            return dict(row)
        return None
    finally:
        await db.close()


async def save_agent(sim_id: str, agent_id: str, name: str, role: str,
                     agent_type: str, color: str | None, personality: dict,
                     morale: int = 70, stress: int = 30,
                     loyalty: int = 70, productivity: int = 75):
    """Insert an agent record."""
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO agents (id, simulation_id, name, role, type, color,
               personality_json, morale, stress, loyalty, productivity)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (agent_id, sim_id, name, role, agent_type, color,
             json.dumps(personality), morale, stress, loyalty, productivity)
        )
        await db.commit()
    finally:
        await db.close()


async def update_agent_state(sim_id: str, agent_id: str, morale: int, stress: int,
                             loyalty: int, productivity: int,
                             has_resigned: bool = False, resigned_week: int | None = None):
    """Update an agent's live state."""
    db = await get_db()
    try:
        await db.execute(
            """UPDATE agents SET morale=?, stress=?, loyalty=?, productivity=?,
               has_resigned=?, resigned_week=? WHERE id=? AND simulation_id=?""",
            (morale, stress, loyalty, productivity,
             1 if has_resigned else 0, resigned_week, agent_id, sim_id)
        )
        await db.commit()
    finally:
        await db.close()


async def get_agents(sim_id: str) -> list[dict]:
    """Get all agents for a simulation."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM agents WHERE simulation_id=?", (sim_id,)
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def save_message(sim_id: str, round_num: int, agent_id: str | None,
                       agent_name: str | None, msg_type: str, content: str,
                       thought: str | None = None,
                       state_changes: dict | None = None,
                       timestamp: str | None = None) -> int:
    """Insert a message and return its ID."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO messages (simulation_id, round, agent_id, agent_name,
               type, content, thought, state_changes_json, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (sim_id, round_num, agent_id, agent_name, msg_type, content,
             thought, json.dumps(state_changes) if state_changes else None, timestamp)
        )
        await db.commit()
        return cursor.lastrowid
    finally:
        await db.close()


async def get_messages(sim_id: str) -> list[dict]:
    """Get all messages for a simulation."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM messages WHERE simulation_id=? ORDER BY id ASC",
            (sim_id,)
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()
