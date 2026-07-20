from __future__ import annotations

import asyncio

from models.schemas import SimulationStatus
from routers import websocket as websocket_router


class RecordingWebSocket:
    def __init__(self):
        self.payloads: list[dict] = []

    async def send_json(self, payload: dict):
        self.payloads.append(payload)


def test_background_abort_never_emits_completed(monkeypatch):
    sim_id = "demo-abort"
    websocket = RecordingWebSocket()
    state = {
        "id": sim_id,
        "status": SimulationStatus.RUNNING,
        "current_round": 0,
        "total_rounds": 1,
        "agents": [],
        "messages": [],
        "mode": "demo",
        "runtime_model": "scripted-mock",
    }

    async def fake_get_state(requested_sim_id):
        assert requested_sim_id == sim_id
        return state

    async def failing_round(*args, **kwargs):
        raise RuntimeError("fixture failed")

    async def no_sleep(*args, **kwargs):
        return None

    monkeypatch.setattr(websocket_router, "get_simulation_state", fake_get_state)
    monkeypatch.setattr(websocket_router, "run_simulation_round", failing_round)
    monkeypatch.setattr(websocket_router, "get_metrics_history", lambda _sim_id: [])
    monkeypatch.setattr(websocket_router.asyncio, "sleep", no_sleep)
    websocket_router._ws_connections[sim_id] = [websocket]

    try:
        asyncio.run(websocket_router._run_simulation_background(sim_id))
    finally:
        websocket_router._ws_connections.pop(sim_id, None)

    assert any(
        payload.get("message")
        == "Simulation stopped due to repeated errors. Please try again."
        for payload in websocket.payloads
    )
    assert all(payload.get("type") != "completed" for payload in websocket.payloads)
