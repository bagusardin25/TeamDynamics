import asyncio

from models.schemas import SimulationStatus
from routers import websocket as websocket_router
from routers.simulation import router


def test_intervention_routes_expose_preview_undo_and_control_contracts():
    routes = {
        route.path: route.methods
        for route in router.routes
    }

    assert routes['/api/simulation/{sim_id}/interventions/preview'] == {'POST'}
    assert routes['/api/simulation/{sim_id}/interventions/{intervention_id}/undo'] == {'POST'}
    assert routes['/api/simulation/{sim_id}/control'] == {'POST'}


def test_existing_apply_route_remains_available():
    routes = {
        route.path: route.methods
        for route in router.routes
    }

    assert routes['/api/simulation/{sim_id}/intervene'] == {'POST'}


def test_control_state_is_broadcast_to_connected_viewers(monkeypatch):
    state = {
        'status': SimulationStatus.PAUSED,
        'step_remaining': 0,
        'interventions': [],
    }
    payloads = []
    published = []

    class Viewer:
        async def send_json(self, payload):
            payloads.append(payload)

    async def get_state(_sim_id):
        return state

    async def publish(sim_id, payload):
        published.append((sim_id, payload))

    monkeypatch.setattr(websocket_router, 'get_simulation_state', get_state)
    monkeypatch.setattr(
        websocket_router.state_manager,
        'publish_ws_message',
        publish,
    )
    monkeypatch.setitem(
        websocket_router._ws_connections,
        'sim-control',
        [Viewer()],
    )

    asyncio.run(websocket_router.broadcast_control_state('sim-control'))

    assert payloads == [{
        'type': 'control',
        'control': {'status': 'paused', 'step_remaining': 0},
        'interventions': [],
    }]
    assert published == [('sim-control', payloads[0])]
