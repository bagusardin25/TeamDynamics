from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


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
