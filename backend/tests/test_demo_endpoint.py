from __future__ import annotations

import asyncio

from fastapi import FastAPI
from fastapi.testclient import TestClient

from routers import simulation as simulation_router
from services.rate_limiter import limiter
from services.simulation_engine import _reconstruct_sim_state, _serialize_sim_state


def _serialized_demo_state() -> dict:
    return {
        "id": "demo1234",
        "status": "idle",
        "current_round": 0,
        "total_rounds": 3,
        "company": {"name": "Northstar Labs", "culture": "Candid"},
        "crisis_scenario": "rnd4",
        "crisis_description": "Production database failure",
        "agents": [],
        "messages": [],
        "pacing": "fast",
        "mode": "demo",
        "runtime_model": "gpt-5.6",
        "strict_llm": True,
    }


def test_demo_endpoint_is_public_and_applies_metadata(monkeypatch):
    captured = {}

    async def fake_create(request, user_id=None, **metadata):
        captured["request"] = request
        captured["user_id"] = user_id
        captured["metadata"] = metadata
        return "demo1234"

    monkeypatch.setattr(simulation_router, "create_simulation", fake_create)

    app = FastAPI()
    app.state.limiter = limiter
    app.include_router(simulation_router.router)
    client = TestClient(app)

    response = client.post("/api/simulation/demo")

    assert response.status_code == 200
    assert response.json() == {
        "id": "demo1234",
        "status": "idle",
        "mode": "demo",
        "runtime_model": "gpt-5.6",
    }
    assert captured["user_id"] is None
    assert captured["metadata"] == {
        "mode": "demo",
        "runtime_model": "gpt-5.6",
        "strict_llm": True,
    }
    assert captured["request"].company.name == "Northstar Labs"


def test_simulation_serialization_keeps_demo_metadata():
    serialized = _serialize_sim_state(_serialized_demo_state())

    assert serialized["mode"] == "demo"
    assert serialized["runtime_model"] == "gpt-5.6"
    assert serialized["strict_llm"] is True


def test_simulation_reconstruction_restores_demo_metadata():
    reconstructed = asyncio.run(_reconstruct_sim_state(_serialized_demo_state()))

    assert reconstructed is not None
    assert reconstructed["mode"] == "demo"
    assert reconstructed["runtime_model"] == "gpt-5.6"
    assert reconstructed["strict_llm"] is True
