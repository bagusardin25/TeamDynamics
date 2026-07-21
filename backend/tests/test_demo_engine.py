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

def test_metrics_snapshot_persists_exact_per_agent_state():
    from models.schemas import AgentFullState, AgentState

    sim_id = "exact-agent-snapshot"
    agent = AgentFullState(
        id="agent-1",
        name="Maya Pratama",
        role="CEO",
        type="Driver",
        personality={},
        state=AgentState(
            morale=42,
            stress=88,
            loyalty=51,
            productivity=63,
        ),
    )

    try:
        simulation_engine._metrics_history.pop(sim_id, None)
        simulation_engine.record_metrics_snapshot(sim_id, 4, [agent])

        snapshot = simulation_engine.get_metrics_history(sim_id)[0]
        assert snapshot["agent_states"]["agent-1"] == {
            "morale": 42,
            "stress": 88,
            "loyalty": 51,
            "productivity": 63,
            "has_resigned": False,
            "resigned_week": None,
        }
    finally:
        simulation_engine._metrics_history.pop(sim_id, None)
