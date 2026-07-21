from __future__ import annotations

import asyncio
from types import SimpleNamespace

import openai
import pytest
from pydantic import BaseModel

from models.llm import AgentLLMResponse, LLMResponseError, ReportInsights
from services import llm_service
from services.llm_budget import LLMBudgetTracker, _estimate_cost


class TinyDocumentResponse(BaseModel):
    company_name: str


def _valid_parsed_response() -> AgentLLMResponse:
    return AgentLLMResponse(
        public_message="We should stabilize production before assigning blame.",
        internal_thought="The team needs a calm recovery plan.",
        state_changes={
            "morale": -2,
            "stress": 4,
            "loyalty": 0,
            "productivity": -3,
        },
        memory_update="Production recovery became the immediate priority.",
        action="propose_recovery_plan",
        action_detail="Freeze deploys, restore backups, and communicate status.",
    )


def test_gpt56_resolves_to_openai():
    assert llm_service._resolve_provider_and_model("gpt-5.6") == (
        "openai",
        "gpt-5.6",
    )


def test_call_openai_uses_responses_parse(monkeypatch):
    captured = {}

    class FakeResponses:
        async def parse(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(
                output_parsed=_valid_parsed_response(),
                model="gpt-5.6",
                usage=SimpleNamespace(input_tokens=120, output_tokens=45),
            )

    class FakeClient:
        responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(openai, "AsyncOpenAI", lambda **kwargs: FakeClient())

    result, usage = asyncio.run(
        llm_service._call_openai(
            "system instructions",
            "round input",
            model="gpt-5.6",
            max_tokens=600,
        )
    )

    assert captured["model"] == "gpt-5.6"
    assert captured["text_format"] is AgentLLMResponse
    assert captured["store"] is False
    assert "temperature" not in captured
    assert result["action"] == "propose_recovery_plan"
    assert usage == {
        "provider": "openai",
        "model": "gpt-5.6",
        "tokens_in": 120,
        "tokens_out": 45,
    }




def test_call_openai_accepts_a_document_response_model(monkeypatch):
    captured = {}

    class FakeResponses:
        async def parse(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(
                output_parsed=TinyDocumentResponse(company_name="Northstar Labs"),
                model="gpt-4o-mini",
                usage=SimpleNamespace(input_tokens=20, output_tokens=5),
            )

    class FakeClient:
        responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(openai, "AsyncOpenAI", lambda **kwargs: FakeClient())

    result, _ = asyncio.run(
        llm_service._call_openai(
            "analyze document",
            "document text",
            model="gpt-4o-mini",
            response_model=TinyDocumentResponse,
        )
    )

    assert captured["text_format"] is TinyDocumentResponse
    assert result == {"company_name": "Northstar Labs"}

def test_openrouter_cheap_fallback_uses_free_router(monkeypatch):
    monkeypatch.delenv("OPENROUTER_CHEAP_MODEL", raising=False)

    assert llm_service._cheap_model_for_provider("openrouter") == "openrouter/free"


def test_openrouter_unavailable_model_is_not_retried_while_circuit_is_open(
    monkeypatch,
):
    calls = []

    class NotFoundError(RuntimeError):
        status_code = 404

    async def fake_openrouter(
        system_prompt,
        user_prompt,
        model,
        temperature,
        max_tokens,
    ):
        calls.append(model)
        if model == "retired/model:free":
            raise NotFoundError("model not found")
        return (
            {"result": "free fallback"},
            {
                "provider": "openrouter",
                "model": model,
                "tokens_in": 10,
                "tokens_out": 5,
            },
        )

    monkeypatch.setenv("OPENROUTER_CHEAP_MODEL", "openrouter/free")
    monkeypatch.setattr(llm_service, "_call_openrouter", fake_openrouter)
    monkeypatch.setattr(llm_service.budget_tracker, "check_budget", lambda: None)
    monkeypatch.setattr(llm_service.budget_tracker, "begin_call", lambda: None)
    monkeypatch.setattr(llm_service.budget_tracker, "end_call", lambda: None)
    monkeypatch.setattr(
        llm_service.budget_tracker,
        "should_use_fallback_model",
        lambda: False,
    )
    llm_service._OPENROUTER_MODEL_CIRCUIT.clear()

    first = asyncio.run(
        llm_service._dispatch_llm_call(
            "system", "user", "openrouter", "retired/model:free"
        )
    )
    second = asyncio.run(
        llm_service._dispatch_llm_call(
            "system", "user", "openrouter", "retired/model:free"
        )
    )

    assert first == {"result": "free fallback"}
    assert second == {"result": "free fallback"}
    assert calls == [
        "retired/model:free",
        "openrouter/free",
        "openrouter/free",
    ]
    llm_service._OPENROUTER_MODEL_CIRCUIT.clear()



def test_default_openrouter_failure_opens_circuit_without_duplicate_retry(
    monkeypatch,
):
    calls = []

    class NotFoundError(RuntimeError):
        status_code = 404

    async def fake_openrouter(
        system_prompt,
        user_prompt,
        model,
        temperature,
        max_tokens,
    ):
        calls.append(model)
        raise NotFoundError("free router unavailable")

    monkeypatch.setenv("OPENROUTER_DEFAULT_MODEL", "openrouter/free")
    monkeypatch.setenv("OPENROUTER_CHEAP_MODEL", "openrouter/free")
    monkeypatch.setattr(llm_service, "_call_openrouter", fake_openrouter)
    monkeypatch.setattr(llm_service.budget_tracker, "check_budget", lambda: None)
    monkeypatch.setattr(llm_service.budget_tracker, "begin_call", lambda: None)
    monkeypatch.setattr(llm_service.budget_tracker, "end_call", lambda: None)
    llm_service._OPENROUTER_MODEL_CIRCUIT.clear()

    with pytest.raises(NotFoundError):
        asyncio.run(
            llm_service._dispatch_llm_call(
                "system", "user", "openrouter"
            )
        )
    with pytest.raises(llm_service.LLMResponseError):
        asyncio.run(
            llm_service._dispatch_llm_call(
                "system", "user", "openrouter"
            )
        )

    assert calls == ["openrouter/free"]
    llm_service._OPENROUTER_MODEL_CIRCUIT.clear()



def test_strict_dispatch_does_not_try_cheap_model(monkeypatch):
    calls = []

    async def failing_call(*args, **kwargs):
        calls.append(kwargs.get("model") or args[2])
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(llm_service, "_call_openai", failing_call)
    monkeypatch.setattr(llm_service.budget_tracker, "check_budget", lambda: None)
    monkeypatch.setattr(llm_service.budget_tracker, "begin_call", lambda: None)
    monkeypatch.setattr(llm_service.budget_tracker, "end_call", lambda: None)
    monkeypatch.setattr(
        llm_service.budget_tracker,
        "should_use_fallback_model",
        lambda: False,
    )

    with pytest.raises(RuntimeError, match="provider unavailable"):
        asyncio.run(
            llm_service._dispatch_llm_call(
                "system",
                "user",
                "openai",
                "gpt-5.6",
                allow_model_fallback=False,
            )
        )

    assert calls == ["gpt-5.6"]


def test_strict_agent_response_raises_instead_of_fake_dialogue(monkeypatch):
    async def failing_dispatch(*args, **kwargs):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", failing_dispatch)

    with pytest.raises(LLMResponseError, match="GPT-5.6"):
        asyncio.run(
            llm_service.generate_agent_response(
                agent={
                    "name": "Alex",
                    "role": "Tech Lead",
                    "personality": {},
                    "model": "gpt-5.6",
                },
                company={"name": "Northstar Labs", "culture": "Candid"},
                crisis_description="Production database failure",
                round_num=1,
                total_rounds=3,
                conversation_history=[],
                strict_llm=True,
            )
        )


def test_gpt56_budget_estimate_uses_published_token_rates():
    assert _estimate_cost("gpt-5.6", tokens_in=1000, tokens_out=1000) == 0.035

def test_agent_prompt_locks_identity_and_requires_novel_grounded_response():
    prompt = llm_service._build_agent_system_prompt(
        agent={
            "name": "Maya Pratama",
            "role": "CEO",
            "type": "Driver",
            "personality": {},
            "state": {
                "morale": 42,
                "stress": 68,
                "loyalty": 55,
                "productivity": 61,
            },
        },
        company={"name": "NexaRoster", "culture": "Collaborative"},
        crisis="Critical delivery delay",
    )

    assert "IDENTITY LOCK" in prompt
    assert "Maya Pratama" in prompt
    assert "Never invent, rename, or impersonate" in prompt
    assert "NOVEL CONTRIBUTION" in prompt
    assert "STATE-CHANGE GROUNDING" in prompt


def test_round_prompt_highlights_own_prior_position_and_latest_peer_message():
    prompt = llm_service._build_round_user_prompt(
        4,
        12,
        [
            {
                "type": "public",
                "agent_name": "Maya Pratama",
                "content": "Freeze scope for one week.",
            },
            {
                "type": "public",
                "agent_name": "Arif Nugroho",
                "content": "A full freeze will delay the security patch.",
            },
        ],
        agent_name="Maya Pratama",
    )

    assert "YOUR MOST RECENT PUBLIC POSITION" in prompt
    assert "Freeze scope for one week." in prompt
    assert "LATEST TEAMMATE CONTRIBUTION" in prompt
    assert "A full freeze will delay the security patch." in prompt
    assert "Do not merely restate" in prompt


def test_generate_agent_response_requires_schema_validation_for_openrouter(
    monkeypatch,
):
    captured = {}

    async def fake_dispatch(*args, **kwargs):
        captured.update(kwargs)
        return _valid_parsed_response().model_dump()

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        llm_service.generate_agent_response(
            agent={
                "name": "Maya Pratama",
                "role": "CEO",
                "type": "Driver",
                "personality": {},
                "state": {},
                "model": "openrouter/free",
            },
            company={"name": "NexaRoster", "culture": "Collaborative"},
            crisis_description="Critical delivery delay",
            round_num=1,
            total_rounds=12,
            conversation_history=[],
        )
    )

    assert captured["response_model"] is AgentLLMResponse
    assert result["public_message"].startswith("We should stabilize")

def _valid_report_insights() -> dict:
    return {
        "executive_summary": "The team completed the simulation under pressure.",
        "critical_finding": "Final morale requires immediate intervention.",
        "simulation_overview": "A twelve-week delivery crisis tested the team.",
        "analysis_insights": "Stress and morale moved in opposite directions.",
        "conclusion": "The team remains operational but fragile.",
        "recommendations": [
            "Publish a weekly recovery scorecard.",
            "Retest the crisis response after two weeks.",
            "Rebalance workload this week.",
            "Run weekly morale reviews.",
            "Assign one accountable recovery owner.",
        ],
    }


def test_report_insights_retries_partial_json_with_corrective_prompt(monkeypatch):
    calls = []

    async def fake_dispatch(system_prompt, user_prompt, *args, **kwargs):
        calls.append((user_prompt, kwargs))
        if len(calls) == 1:
            return {"executive_summary": "Only one partial field."}
        return _valid_report_insights()

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        llm_service.generate_report_insights(
            company={"name": "NexaRoster", "culture": "Collaborative"},
            crisis="Critical delivery delay",
            agents_data=[],
            messages=[],
            total_rounds=12,
            outcome={
                "title": "Team Fracture",
                "description": "Final morale collapsed.",
            },
        )
    )

    assert result["critical_finding"].startswith("Final morale")
    assert len(calls) == 2
    assert calls[0][1]["response_model"] is ReportInsights
    assert "CORRECTIVE RETRY" in calls[1][0]


def test_report_fallback_is_specific_unique_and_metric_grounded(monkeypatch):
    async def failing_dispatch(*args, **kwargs):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", failing_dispatch)

    result = asyncio.run(
        llm_service.generate_report_insights(
            company={"name": "NexaRoster", "culture": "Collaborative"},
            crisis="Critical delivery delay",
            agents_data=[
                {
                    "name": "Maya Pratama",
                    "role": "CEO",
                    "state": {
                        "morale": 9,
                        "stress": 88,
                        "loyalty": 24,
                        "productivity": 51,
                    },
                    "has_resigned": False,
                },
                {
                    "name": "Bima Santoso",
                    "role": "People & Culture Lead",
                    "state": {
                        "morale": 8,
                        "stress": 91,
                        "loyalty": 12,
                        "productivity": 40,
                    },
                    "has_resigned": True,
                    "resigned_week": 10,
                },
            ],
            messages=[],
            total_rounds=12,
            outcome={
                "title": "Team Fracture",
                "description": "The active team ended at 9% morale.",
            },
        )
    )

    combined = " ".join(
        [
            result["executive_summary"],
            result["critical_finding"],
            result["analysis_insights"],
            result["conclusion"],
            *result["recommendations"],
        ]
    )
    assert "9%" in combined
    assert "Maya Pratama" in combined
    assert "Bima Santoso" in combined
    assert len(result["recommendations"]) >= 3
    assert len(result["recommendations"]) == len(set(result["recommendations"]))
    assert all(
        recommendation != "Review the simulation transcript for additional insights."
        for recommendation in result["recommendations"]
    )


def test_call_openai_defaults_to_cost_conscious_model(monkeypatch):
    captured = {}

    class FakeResponses:
        async def parse(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(
                output_parsed=_valid_parsed_response(),
                model="gpt-4o-mini",
                usage=SimpleNamespace(input_tokens=120, output_tokens=45),
            )

    class FakeClient:
        responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.delenv("OPENAI_MODEL", raising=False)
    monkeypatch.setattr(openai, "AsyncOpenAI", lambda **kwargs: FakeClient())

    asyncio.run(llm_service._call_openai("system", "user"))

    assert captured["model"] == "gpt-4o-mini"
    assert "temperature" in captured


def test_budget_tracker_defaults_to_quarter_dollar_daily_cap(monkeypatch):
    monkeypatch.delenv("LLM_DAILY_BUDGET_USD", raising=False)

    assert LLMBudgetTracker().daily_cap == 0.25
