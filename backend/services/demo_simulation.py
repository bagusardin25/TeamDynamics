from __future__ import annotations

from copy import deepcopy

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
