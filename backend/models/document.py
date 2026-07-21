from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DocumentAnalysisError(RuntimeError):
    """Raised when extracted document text cannot produce a valid AI analysis."""


class DocumentTeamSource(str, Enum):
    DOCUMENTED = "documented"
    INFERRED = "inferred"
    NONE = "none"


class DocumentPersonality(BaseModel):
    model_config = ConfigDict(extra="forbid")

    empathy: int = Field(ge=0, le=100)
    ambition: int = Field(ge=0, le=100)
    stressTolerance: int = Field(ge=0, le=100)
    agreeableness: int = Field(ge=0, le=100)
    assertiveness: int = Field(ge=0, le=100)


class DocumentSuggestedAgent(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(
        min_length=1,
        max_length=100,
        description=(
            "Complete person name; for documented rosters, copy it verbatim from source_evidence."
        ),
    )
    source_evidence: str | None = Field(
        ...,
        max_length=1000,
        description=(
            "For documented rosters, a short unique verbatim source quote containing the complete name and role; otherwise null."
        ),
    )
    role: str = Field(min_length=1, max_length=160)
    type: str = Field(min_length=1, max_length=160)
    rationale: str = Field(min_length=1, max_length=1000)
    personality: DocumentPersonality


class DocumentSuggestedCrisis(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=2000)


class DocumentAnalysisResult(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    company_name: str = Field(min_length=1, max_length=200)
    company_culture: str = Field(min_length=1, max_length=1000)
    operating_context: str = Field(min_length=1, max_length=2000)
    summary: str = Field(min_length=1, max_length=2000)
    key_requirements: list[str] = Field(default_factory=list, max_length=12)
    team_risks: list[str] = Field(default_factory=list, max_length=12)
    suggested_crisis: DocumentSuggestedCrisis
    team_source: DocumentTeamSource
    suggested_agents: list[DocumentSuggestedAgent] = Field(
        default_factory=list, max_length=20
    )
    suggested_team_rules: list[str] = Field(default_factory=list, max_length=12)
    actionable_insights: list[str] = Field(default_factory=list, max_length=12)

    @model_validator(mode="after")
    def validate_team_source(self) -> "DocumentAnalysisResult":
        if self.team_source is DocumentTeamSource.NONE and self.suggested_agents:
            raise ValueError("suggested_agents must be empty when team_source is none")
        if self.team_source is not DocumentTeamSource.NONE and not self.suggested_agents:
            raise ValueError(
                "documented or inferred team_source requires at least one team member"
            )
        if self.team_source is DocumentTeamSource.DOCUMENTED:
            if any(not agent.source_evidence for agent in self.suggested_agents):
                raise ValueError(
                    "documented team members require non-empty source_evidence"
                )
        if self.team_source is DocumentTeamSource.INFERRED:
            if any(agent.source_evidence is not None for agent in self.suggested_agents):
                raise ValueError("inferred team members require source_evidence=null")
        return self
