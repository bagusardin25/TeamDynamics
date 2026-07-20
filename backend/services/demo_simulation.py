from __future__ import annotations

import asyncio
from copy import deepcopy
from collections.abc import Awaitable, Callable

from data.presets import PRESET_AGENTS
from data.world_state import RandomEvent, WorldState
from models.schemas import (
    AgentConfig,
    CompanyProfile,
    CreateSimulationRequest,
    CrisisConfig,
    CrisisScenario,
    PacingSpeed,
    SimulationParams,
)


DEMO_RUNTIME_MODEL = "scripted-mock"
DEMO_TYPING_DELAY_SECONDS = 0.6


async def wait_for_demo_typing_state(
    mode: str,
    sleeper: Callable[[float], Awaitable[None]] = asyncio.sleep,
) -> None:
    """Keep the scripted typing state visible without delaying real model calls."""
    if mode == "demo":
        await sleeper(DEMO_TYPING_DELAY_SECONDS)

_DEMO_RESOLUTION_EVENT = RandomEvent(
    id="client_recovery_escalation",
    name="Key Client Requests Recovery Proof",
    description=(
        "Northstar Labs' largest client has paused its renewal and requested "
        "a verified recovery timeline plus evidence of new safeguards."
    ),
    probability=1.0,
    world_effects={
        "customer_satisfaction": -4,
        "company_reputation": -2,
        "budget_remaining": -1,
    },
    morale_effect=-2,
    stress_effect=4,
    min_round=3,
    crisis_filter=["rnd4"],
)

DEMO_COMPANY = CompanyProfile(
    name="Northstar Labs",
    culture=(
        "A fast-moving product engineering company that values ownership, "
        "reliability, and candid communication, but is under severe delivery pressure."
    ),
)


def build_demo_world_state() -> WorldState:
    """Return the calibrated starting conditions for the scripted incident."""
    return WorldState(
        budget_remaining=75,
        deadline_weeks_left=2,
        team_capacity=100,
        customer_satisfaction=35,
        technical_debt=60,
        company_reputation=45,
    )


def get_demo_round_event(round_num: int) -> RandomEvent | None:
    """Return the one scripted escalation used by the public demo."""
    if round_num != 3:
        return None
    return deepcopy(_DEMO_RESOLUTION_EVENT)


def build_demo_simulation_request() -> CreateSimulationRequest:
    agents = [
        AgentConfig.model_validate(
            {
                **deepcopy(agent),
                "model": DEMO_RUNTIME_MODEL,
            }
        )
        for agent in PRESET_AGENTS[:3]
    ]

    return CreateSimulationRequest(
        company=DEMO_COMPANY,
        agents=agents,
        crisis=CrisisConfig(scenario=CrisisScenario.DB_DELETED),
        params=SimulationParams(duration_weeks=3, pacing=PacingSpeed.NORMAL),
    )
