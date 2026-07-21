from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


class LLMConfigurationError(RuntimeError):
    """Raised when an LLM provider cannot be configured safely."""


class LLMResponseError(RuntimeError):
    """Raised when a model response cannot be used by the simulation."""


class AgentStateChange(BaseModel):
    model_config = ConfigDict(extra="forbid")

    morale: int = Field(ge=-30, le=30)
    stress: int = Field(ge=-30, le=30)
    loyalty: int = Field(ge=-30, le=30)
    productivity: int = Field(ge=-30, le=30)


class AgentLLMResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    public_message: str = Field(min_length=3, max_length=2000)
    internal_thought: str = Field(min_length=3, max_length=2000)
    state_changes: AgentStateChange
    memory_update: str = Field(min_length=1, max_length=2000)
    action: str = Field(min_length=1, max_length=120)
    action_detail: str = Field(max_length=2000)

class ReportInsights(BaseModel):
    model_config = ConfigDict(extra="forbid")

    executive_summary: str = Field(min_length=1, max_length=3000)
    critical_finding: str = Field(min_length=1, max_length=2000)
    simulation_overview: str = Field(min_length=1, max_length=3000)
    analysis_insights: str = Field(min_length=1, max_length=5000)
    conclusion: str = Field(min_length=1, max_length=3000)
    recommendations: list[str] = Field(min_length=5, max_length=5)

    @field_validator(
        "executive_summary",
        "critical_finding",
        "simulation_overview",
        "analysis_insights",
        "conclusion",
        mode="before",
    )
    @classmethod
    def require_nonblank_section(cls, value: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError("report sections must not be blank")
        return value.strip()

    @field_validator("recommendations")
    @classmethod
    def require_unique_recommendations(cls, values: list[str]) -> list[str]:
        cleaned = [
            value.strip()
            for value in values
            if isinstance(value, str) and value.strip()
        ]
        if len(cleaned) != 5:
            raise ValueError("exactly five non-empty recommendations are required")
        if len({value.casefold() for value in cleaned}) != len(cleaned):
            raise ValueError("recommendations must be unique")
        return cleaned
