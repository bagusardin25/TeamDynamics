from __future__ import annotations

from copy import deepcopy

from data.presets import PRESET_AGENTS
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

DEMO_COMPANY = CompanyProfile(
    name="Northstar Labs",
    culture=(
        "A fast-moving product engineering company that values ownership, "
        "reliability, and candid communication, but is under severe delivery pressure."
    ),
)


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
