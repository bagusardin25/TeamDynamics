from __future__ import annotations

import asyncio
from types import SimpleNamespace

import openai
import pytest
from pydantic import BaseModel

from models.llm import AgentLLMResponse, LLMResponseError
from services import llm_service
from services.llm_budget import _estimate_cost


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
