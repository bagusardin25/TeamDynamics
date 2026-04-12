"""
Pydantic models for the TeamDynamics API.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ── Enums ─────────────────────────────────────────────────────────────

class SimulationStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


class MessageType(str, Enum):
    PUBLIC = "public"
    THOUGHT = "thought"
    SYSTEM = "system"


class PacingSpeed(str, Enum):
    SLOW = "slow"
    NORMAL = "normal"
    FAST = "fast"


class InterventionType(str, Enum):
    BONUS = "bonus"
    PIZZA = "pizza"
    CANCEL_OVERTIME = "cancel_overtime"
    CUSTOM = "custom"


class CrisisScenario(str, Enum):
    MANDATORY_WEEKEND = "rnd1"
    LAYOFFS = "rnd2"
    CEO_RESIGNS = "rnd3"
    DB_DELETED = "rnd4"
    CUSTOM = "custom"


# ── Sub-models ────────────────────────────────────────────────────────

class PersonalityTraits(BaseModel):
    empathy: int = Field(ge=0, le=100, default=50)
    ambition: int = Field(ge=0, le=100, default=50)
    stress_tolerance: int = Field(ge=0, le=100, default=50, alias="stressTolerance")
    agreeableness: int = Field(ge=0, le=100, default=50)
    assertiveness: int = Field(ge=0, le=100, default=50)

    model_config = {"populate_by_name": True}


class AgentState(BaseModel):
    morale: int = Field(ge=0, le=100, default=70)
    stress: int = Field(ge=0, le=100, default=30)
    loyalty: int = Field(ge=0, le=100, default=70)
    productivity: int = Field(ge=0, le=100, default=75)


class StateChanges(BaseModel):
    morale: Optional[int] = None
    stress: Optional[int] = None
    loyalty: Optional[int] = None
    productivity: Optional[int] = None


class CompanyProfile(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    culture: str = Field(min_length=1, max_length=1000)


# ── Agent ─────────────────────────────────────────────────────────────

class AgentConfig(BaseModel):
    id: str
    name: str
    role: str
    type: str
    personality: PersonalityTraits
    color: Optional[str] = None
    motivation: Optional[str] = None
    expertise: Optional[str] = None
    model: Optional[str] = None  # Per-agent LLM model override (e.g. "anthropic/claude-3.7-sonnet")


class AgentFullState(AgentConfig):
    """Agent config + live simulation state."""
    state: AgentState = Field(default_factory=AgentState)
    initials: str = ""
    has_resigned: bool = False
    resigned_week: Optional[int] = None

    def compute_initials(self) -> str:
        parts = self.name.split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[1][0]).upper()
        return self.name[:2].upper()


# ── Crisis ────────────────────────────────────────────────────────────

class CrisisConfig(BaseModel):
    scenario: CrisisScenario
    custom_description: Optional[str] = None


# ── Simulation ────────────────────────────────────────────────────────

class SimulationParams(BaseModel):
    duration_weeks: int = Field(ge=1, le=52, default=12)
    pacing: PacingSpeed = PacingSpeed.NORMAL


class CreateSimulationRequest(BaseModel):
    company: CompanyProfile
    agents: list[AgentConfig]
    crisis: CrisisConfig
    params: SimulationParams = Field(default_factory=SimulationParams)


class Message(BaseModel):
    id: int
    round: int
    agent_id: Optional[str] = Field(default=None, alias="agentId")
    agent_name: Optional[str] = Field(default=None, alias="agent")
    type: MessageType
    content: str
    thought: Optional[str] = None
    state_changes: Optional[StateChanges] = Field(default=None, alias="changes")
    timestamp: Optional[str] = None

    model_config = {"populate_by_name": True}


class SimulationMetrics(BaseModel):
    avg_morale: int = Field(alias="avgMorale", default=70)
    avg_stress: int = Field(alias="avgStress", default=30)
    productivity: int = 75
    resignations: int = 0

    model_config = {"populate_by_name": True}


class SimulationResponse(BaseModel):
    id: str
    status: SimulationStatus
    current_round: int = Field(alias="currentRound", default=0)
    total_rounds: int = Field(alias="totalRounds", default=12)
    company: CompanyProfile
    agents: list[AgentFullState]
    messages: list[Message] = []
    metrics: SimulationMetrics = Field(default_factory=SimulationMetrics)

    model_config = {"populate_by_name": True}


# ── Intervention ──────────────────────────────────────────────────────

class InterventionRequest(BaseModel):
    type: InterventionType
    custom_message: Optional[str] = None


# ── Report ────────────────────────────────────────────────────────────

class AgentReport(BaseModel):
    id: str
    name: str
    role: str
    starting_morale: int
    ending_morale: int
    peak_stress: int
    has_resigned: bool
    resigned_week: Optional[int] = None
    status: str  # "Failed", "Stable", "Thriving"
    status_label: str  # "Resigned • Week 9", "Survived", etc.


class ReportResponse(BaseModel):
    simulation_id: str
    company_name: str
    crisis_name: str
    total_rounds: int
    completed_rounds: int
    executive_summary: str
    critical_finding: str
    agent_reports: list[AgentReport]
    productivity_drop: int
    recommendations: list[str]
    timeline: list[dict] = []

