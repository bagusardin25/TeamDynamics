from __future__ import annotations

import asyncio

from services import simulation_engine


def test_demo_response_resolver_never_calls_external_model(monkeypatch):
    async def forbidden_model_call(**kwargs):
        raise AssertionError("external model path was called")

    monkeypatch.setattr(
        simulation_engine,
        "generate_agent_response",
        forbidden_model_call,
    )

    response = asyncio.run(
        simulation_engine._resolve_agent_response(
            state={"mode": "demo"},
            agent={"name": "Alex"},
            round_num=1,
            exchange_num=2,
            llm_request={},
        )
    )

    assert response["action"] == "propose_solution"


def test_standard_response_resolver_preserves_external_model_path(monkeypatch):
    captured = {}

    async def fake_model_call(**kwargs):
        captured.update(kwargs)
        return {"public_message": "model response"}

    monkeypatch.setattr(
        simulation_engine,
        "generate_agent_response",
        fake_model_call,
    )

    response = asyncio.run(
        simulation_engine._resolve_agent_response(
            state={"mode": "standard"},
            agent={"name": "Alex"},
            round_num=1,
            exchange_num=1,
            llm_request={"agent": {"name": "Alex"}, "strict_llm": False},
        )
    )

    assert response == {"public_message": "model response"}
    assert captured == {
        "agent": {"name": "Alex"},
        "strict_llm": False,
    }
