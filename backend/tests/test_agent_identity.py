from __future__ import annotations

import pytest
from pydantic import ValidationError

from models.schemas import AgentConfig
from models.document import DocumentAnalysisResult
from services.document_service import _without_non_person_agent_names


def _agent(name: str) -> AgentConfig:
    return AgentConfig(
        id="agent-1",
        name=name,
        role="Engineering Lead",
        type="Driver",
        personality={},
    )


@pytest.mark.parametrize(
    "invalid_name",
    ["kelelahan", "Kelelahan.", "burnout", "under pressure"],
)
def test_agent_config_rejects_status_or_feeling_as_name(invalid_name):
    with pytest.raises(ValidationError, match="person's name"):
        _agent(invalid_name)


@pytest.mark.parametrize(
    "valid_name",
    ["Budi", "Maya Pratama", "Nur A. Putri"],
)
def test_agent_config_accepts_person_names(valid_name):
    assert _agent(valid_name).name == valid_name


def test_document_analysis_discards_status_name_and_preserves_valid_member():
    personality = {
        "empathy": 50,
        "ambition": 50,
        "stressTolerance": 50,
        "agreeableness": 50,
        "assertiveness": 50,
    }
    analysis = DocumentAnalysisResult.model_validate({
        "company_name": "NexaRoster",
        "company_culture": "Direct and collaborative",
        "operating_context": "High-pressure delivery",
        "summary": "A product team under deadline pressure.",
        "key_requirements": [],
        "team_risks": [],
        "suggested_crisis": {
            "title": "Launch delay",
            "description": "A critical launch is delayed.",
        },
        "team_source": "inferred",
        "suggested_agents": [
            {
                "name": "kelelahan",
                "source_evidence": None,
                "role": "Status",
                "type": "Invalid fragment",
                "rationale": "Incorrectly extracted.",
                "personality": personality,
            },
            {
                "name": "Maya Pratama",
                "source_evidence": None,
                "role": "CEO",
                "type": "Driver",
                "rationale": "Leads the company.",
                "personality": personality,
            },
        ],
        "suggested_team_rules": [],
        "actionable_insights": [],
    })

    sanitized = _without_non_person_agent_names(analysis)

    assert sanitized.team_source.value == "inferred"
    assert [agent.name for agent in sanitized.suggested_agents] == [
        "Maya Pratama"
    ]

    only_invalid = analysis.model_copy(
        update={"suggested_agents": analysis.suggested_agents[:1]}
    )
    sanitized_empty = _without_non_person_agent_names(only_invalid)
    assert sanitized_empty.suggested_agents == []
    assert sanitized_empty.team_source.value == "none"
