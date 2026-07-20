import asyncio

from data.world_state import WorldState
from models.schemas import (
    AgentFullState,
    AgentState,
    InterventionCategory,
    InterventionRequest,
    InterventionTarget,
    InterventionTargetKind,
    InterventionType,
    PersonalityTraits,
    SimulationControl,
    SimulationStatus,
)
from services import simulation_engine as engine
from services.demo_responses import get_demo_agent_response


def _agent(agent_id: str, name: str) -> AgentFullState:
    return AgentFullState(
        id=agent_id,
        name=name,
        role='Engineer',
        type='Builder',
        personality=PersonalityTraits(
            empathy=50,
            ambition=50,
            stressTolerance=50,
            agreeableness=50,
            assertiveness=50,
        ),
        state=AgentState(
            morale=60,
            stress=50,
            loyalty=55,
            productivity=70,
        ),
    )


def _state(sim_id: str = 'sim-engine') -> dict:
    return {
        'id': sim_id,
        'status': SimulationStatus.PAUSED,
        'current_round': 2,
        'total_rounds': 3,
        'company': {'name': 'Northstar', 'culture': 'Direct'},
        'crisis_scenario': 'rnd4',
        'agents': [_agent('alex', 'Alex'), _agent('jordan', 'Jordan')],
        'messages': [],
        'pacing': 'fast',
        'mode': 'demo',
        'runtime_model': 'scripted-mock',
        'strict_llm': False,
        'interventions': [],
        'pending_intervention_id': None,
        'step_remaining': 0,
        'websockets': [],
    }


def _request() -> InterventionRequest:
    return InterventionRequest(
        type=InterventionType.CUSTOM,
        custom_message='Give Alex dedicated recovery time',
        category=InterventionCategory.PEOPLE,
        target=InterventionTarget(
            kind=InterventionTargetKind.AGENT,
            id='alex',
        ),
    )


def _install_state(monkeypatch, state: dict, world: WorldState):
    engine._active_simulations[state['id']] = state
    engine._world_states[state['id']] = world

    async def no_op(*args, **kwargs):
        return None

    monkeypatch.setattr(engine, 'update_agent_state', no_op)
    monkeypatch.setattr(engine, 'update_simulation_status', no_op)
    monkeypatch.setattr(engine, 'db_save_world_state', no_op)
    monkeypatch.setattr(engine, 'save_message', no_op)
    monkeypatch.setattr(engine, '_sync_sim_to_redis', no_op)


def test_serialized_state_preserves_intervention_control_fields():
    state = _state()
    state['interventions'] = [{'id': 'int-1', 'rollback': {'agents': {}}}]
    state['pending_intervention_id'] = 'int-1'
    state['step_remaining'] = 1

    serialized = engine._serialize_sim_state(state)

    assert serialized['interventions'] == state['interventions']
    assert serialized['pending_intervention_id'] == 'int-1'
    assert serialized['step_remaining'] == 1


def test_apply_returns_preview_actual_receipt_and_updates_only_target(monkeypatch):
    state = _state()
    _install_state(monkeypatch, state, WorldState())
    request = _request()
    preview = asyncio.run(engine.preview_intervention(state['id'], request))
    request.preview_token = preview['preview_token']
    request.confirmed = True

    receipt = asyncio.run(
        engine.process_intervention(state['id'], request=request)
    )

    assert receipt['preview_effects'] == receipt['actual_effects']
    assert receipt['target']['kind'] == 'agent'
    assert state['agents'][0].state.morale > 60
    assert state['agents'][1].state.morale == 60


def test_undo_restores_snapshot_before_next_agent(monkeypatch):
    state = _state()
    _install_state(monkeypatch, state, WorldState())
    request = _request()
    preview = asyncio.run(engine.preview_intervention(state['id'], request))
    request.preview_token = preview['preview_token']
    request.confirmed = True
    receipt = asyncio.run(
        engine.process_intervention(state['id'], request=request)
    )

    undone = asyncio.run(
        engine.undo_intervention(state['id'], receipt['id'])
    )

    assert state['agents'][0].state.morale == 60
    assert undone['status'] == 'undone'
    assert undone['can_undo'] is False


def test_undo_broadcasts_the_updated_receipt(monkeypatch):
    state = _state()
    _install_state(monkeypatch, state, WorldState())
    request = _request()
    preview = asyncio.run(engine.preview_intervention(state['id'], request))
    request.preview_token = preview['preview_token']
    request.confirmed = True
    receipt = asyncio.run(
        engine.process_intervention(state['id'], request=request)
    )
    messages = []

    async def record_message(sim_id, message):
        messages.append((sim_id, message))

    asyncio.run(
        engine.undo_intervention(
            state['id'],
            receipt['id'],
            ws_broadcast=record_message,
        )
    )

    broadcast_receipt = messages[0][1]['state_changes']['_intervention']
    assert broadcast_receipt['status'] == 'undone'
    assert broadcast_receipt['can_undo'] is False


def test_apply_broadcast_uses_typed_unique_event_effects(monkeypatch):
    state = _state()
    _install_state(monkeypatch, state, WorldState())
    request = _request()
    preview = asyncio.run(engine.preview_intervention(state['id'], request))
    request.preview_token = preview['preview_token']
    request.confirmed = True
    messages = []

    async def record_message(_sim_id, message):
        messages.append(message)

    asyncio.run(
        engine.process_intervention(
            state['id'],
            request=request,
            ws_broadcast=record_message,
        )
    )

    effects = messages[0]['event']['effects']
    assert effects
    assert all(set(effect) == {'label', 'value', 'tone'} for effect in effects)
    assert all(effect['label'].startswith('Alex · ') for effect in effects)
    keys = {(effect['label'], effect['value']) for effect in effects}
    assert len(keys) == len(effects)


def test_pause_resume_and_step_have_explicit_control_state(monkeypatch):
    state = _state()
    state['status'] = SimulationStatus.RUNNING
    _install_state(monkeypatch, state, WorldState())

    paused = asyncio.run(
        engine.control_simulation(state['id'], SimulationControl.PAUSE)
    )
    stepped = asyncio.run(
        engine.control_simulation(state['id'], SimulationControl.STEP)
    )
    resumed = asyncio.run(
        engine.control_simulation(state['id'], SimulationControl.RESUME)
    )

    assert paused == {'status': 'paused', 'step_remaining': 0}
    assert stepped == {'status': 'running', 'step_remaining': 1}
    assert resumed == {'status': 'running', 'step_remaining': 0}


def test_demo_next_agent_acknowledges_pending_intervention():
    state = _state()
    state['interventions'] = [
        {
            'id': 'int-1',
            'command': 'Cancel overtime',
            'target': {'kind': 'all_team', 'label': 'All team'},
            'status': 'applied',
            'response_status': 'pending',
        }
    ]
    state['pending_intervention_id'] = 'int-1'

    scripted = get_demo_agent_response({'name': 'Alex'}, 1, 1)
    response = asyncio.run(
        engine._resolve_agent_response(
            state=state,
            agent={'name': 'Alex'},
            round_num=1,
            exchange_num=1,
            llm_request={},
        )
    )

    assert 'management intervention' in response['public_message'].lower()
    assert response['public_message'].endswith(scripted['public_message'])
    assert state['interventions'][0]['response_status'] == 'acknowledged'
    assert state['pending_intervention_id'] is None


def test_redis_reconstruction_restores_intervention_audit_state():
    state = _state()
    state['interventions'] = [
        {
            'id': 'int-1',
            'command': 'Cancel overtime',
            'rollback': {'agents': {}},
        }
    ]
    state['pending_intervention_id'] = 'int-1'
    serialized = engine._serialize_sim_state(state)

    reconstructed = asyncio.run(engine._reconstruct_sim_state(serialized))

    assert reconstructed['interventions'] == state['interventions']
    assert reconstructed['pending_intervention_id'] == 'int-1'
    assert reconstructed['step_remaining'] == 0


def test_legacy_websocket_style_apply_defaults_to_all_team(monkeypatch):
    state = _state()
    _install_state(monkeypatch, state, WorldState())

    receipt = asyncio.run(
        engine.process_intervention(
            state['id'],
            InterventionType.PIZZA,
            ws_broadcast=None,
        )
    )

    assert receipt['target']['kind'] == 'all_team'
    assert receipt['semantics'] == 'preset'
    assert all(agent.state.morale > 60 for agent in state['agents'])
