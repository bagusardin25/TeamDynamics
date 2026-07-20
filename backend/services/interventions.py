'''Deterministic planning and receipts for simulation interventions.'''

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import json
from typing import Any
from uuid import uuid4

from data.world_state import WorldState, clamp
from models.agent import apply_intervention
from models.schemas import (
    AgentFullState,
    InterventionCategory,
    InterventionRequest,
    InterventionTargetKind,
    InterventionType,
    SimulationStatus,
)


_PRESET_COMMANDS = {
    InterventionType.BONUS: 'Surprise bonus',
    InterventionType.PIZZA: 'Team reset',
    InterventionType.CANCEL_OVERTIME: 'Cancel overtime',
}

_CUSTOM_AGENT_EFFECTS: dict[InterventionCategory, dict[str, int]] = {
    InterventionCategory.PEOPLE: {
        'morale': 10,
        'stress': -8,
        'loyalty': 5,
    },
    InterventionCategory.TIME_SCOPE: {
        'stress': -6,
        'productivity': 4,
    },
    InterventionCategory.RESOURCES: {
        'stress': -4,
        'productivity': 8,
    },
    InterventionCategory.POLICY: {
        'morale': 3,
        'loyalty': 5,
    },
    InterventionCategory.INCIDENT: {
        'stress': 8,
        'productivity': -5,
    },
}

_CUSTOM_PROJECT_EFFECTS: dict[InterventionCategory, dict[str, int]] = {
    InterventionCategory.PEOPLE: {
        'team_capacity': 5,
        'budget_remaining': -3,
    },
    InterventionCategory.TIME_SCOPE: {
        'deadline_weeks_left': 1,
        'technical_debt': 4,
    },
    InterventionCategory.RESOURCES: {
        'budget_remaining': -8,
        'team_capacity': 10,
    },
    InterventionCategory.POLICY: {
        'company_reputation': 4,
    },
    InterventionCategory.INCIDENT: {
        'customer_satisfaction': -5,
        'technical_debt': 5,
    },
}

_EFFECT_LABELS = {
    'morale': 'Morale',
    'stress': 'Stress',
    'loyalty': 'Loyalty',
    'productivity': 'Productivity',
    'budget_remaining': 'Budget remaining',
    'deadline_weeks_left': 'Deadline',
    'team_capacity': 'Team capacity',
    'customer_satisfaction': 'Customer satisfaction',
    'technical_debt': 'Technical debt',
    'company_reputation': 'Company reputation',
}


def _enum_value(value: Any) -> Any:
    return value.value if hasattr(value, 'value') else value


def _active_agents(state: dict) -> list[AgentFullState]:
    return [
        agent
        for agent in state.get('agents', [])
        if not agent.has_resigned
    ]


def _resolve_target(
    state: dict,
    request: InterventionRequest,
) -> tuple[dict[str, str], list[AgentFullState]]:
    target = request.target
    if target.kind == InterventionTargetKind.AGENT:
        agent = next(
            (
                candidate
                for candidate in _active_agents(state)
                if candidate.id == target.id
            ),
            None,
        )
        if agent is None:
            raise ValueError('Selected agent is not active in this simulation')
        return (
            {'kind': 'agent', 'id': agent.id, 'label': agent.name},
            [agent],
        )

    if target.kind == InterventionTargetKind.ALL_TEAM:
        return (
            {'kind': 'all_team', 'label': 'All team'},
            _active_agents(state),
        )
    if target.kind == InterventionTargetKind.PROJECT:
        return ({'kind': 'project', 'label': 'Project'}, [])
    return (
        {'kind': 'decision_process', 'label': 'Decision process'},
        [],
    )


def _bounded_value(key: str, before: int, delta: int) -> int:
    if key == 'deadline_weeks_left':
        return max(0, before + delta)
    return clamp(before + delta)


def _effect(
    scope: str,
    scope_label: str,
    key: str,
    before: int,
    delta: int,
) -> dict:
    after = _bounded_value(key, before, delta)
    return {
        'scope': scope,
        'scope_label': scope_label,
        'key': key,
        'label': _EFFECT_LABELS[key],
        'before': before,
        'delta': after - before,
        'after': after,
        'unit': 'step' if key == 'deadline_weeks_left' else '%',
    }


def _agent_effects(
    agents: list[AgentFullState],
    request: InterventionRequest,
) -> list[dict]:
    effects: list[dict] = []
    for agent in agents:
        if request.type == InterventionType.CUSTOM:
            changes = _CUSTOM_AGENT_EFFECTS[request.category]
        else:
            changes = {
                key: value
                for key, value in apply_intervention(
                    agent,
                    request.type,
                ).model_dump().items()
                if value is not None
            }
        for key, delta in changes.items():
            effects.append(
                _effect(
                    'agent:' + agent.id,
                    agent.name,
                    key,
                    getattr(agent.state, key),
                    delta,
                )
            )
    return effects


def _project_effects(
    world: WorldState,
    request: InterventionRequest,
) -> list[dict]:
    changes = _CUSTOM_PROJECT_EFFECTS[request.category]
    return [
        _effect('project', 'Project', key, getattr(world, key), delta)
        for key, delta in changes.items()
    ]


def _requires_confirmation(request: InterventionRequest) -> bool:
    return (
        request.target.kind
        in {
            InterventionTargetKind.ALL_TEAM,
            InterventionTargetKind.AGENT,
            InterventionTargetKind.PROJECT,
        }
        or request.category
        in {
            InterventionCategory.TIME_SCOPE,
            InterventionCategory.RESOURCES,
            InterventionCategory.INCIDENT,
        }
    )


def _preview_token(payload: dict) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()


def build_intervention_preview(
    state: dict,
    world: WorldState,
    request: InterventionRequest,
) -> dict:
    '''Plan deterministic effects from the current state without mutating it.'''
    target, target_agents = _resolve_target(state, request)
    if request.target.kind in {
        InterventionTargetKind.ALL_TEAM,
        InterventionTargetKind.AGENT,
    }:
        effects = _agent_effects(target_agents, request)
    elif request.target.kind == InterventionTargetKind.PROJECT:
        effects = _project_effects(world, request)
    else:
        effects = []

    semantics = (
        'category_based'
        if request.type == InterventionType.CUSTOM
        else 'preset'
    )
    command = (
        request.custom_message
        if request.type == InterventionType.CUSTOM
        else _PRESET_COMMANDS[request.type]
    )
    is_demo_custom = (
        state.get('mode') == 'demo'
        and request.type == InterventionType.CUSTOM
    )
    response_note = (
        'No direct metric change. The next eligible agent turn will acknowledge this directive.'
        if request.target.kind == InterventionTargetKind.DECISION_PROCESS
        else (
            'This scripted demo applies category-based metric effects; it does not branch the remaining story.'
            if is_demo_custom
            else 'The next eligible agent turn will acknowledge this intervention.'
        )
    )
    token_payload = {
        'simulation_id': state.get('id'),
        'round': state.get('current_round', 0),
        'type': request.type.value,
        'command': command,
        'category': request.category.value,
        'target': target,
        'effects': effects,
    }
    return {
        **token_payload,
        'effects': effects,
        'confirmation_required': _requires_confirmation(request),
        'semantics': semantics,
        'metrics_only': bool(
            is_demo_custom
            and request.target.kind
            != InterventionTargetKind.DECISION_PROCESS
        ),
        'response_note': response_note,
        'preview_token': _preview_token(token_payload),
    }


def apply_intervention_preview(
    state: dict,
    world: WorldState,
    preview: dict,
) -> dict:
    '''Apply the exact bounded effects in a preview and create a private record.'''
    rollback = {'agents': {}, 'world': {}}
    actual_effects: list[dict] = []
    agents_by_id = {
        agent.id: agent
        for agent in state.get('agents', [])
    }

    for planned in preview.get('effects', []):
        effect = deepcopy(planned)
        scope = effect['scope']
        key = effect['key']
        if scope.startswith('agent:'):
            agent_id = scope.split(':', 1)[1]
            agent = agents_by_id[agent_id]
            rollback['agents'].setdefault(
                agent_id,
                agent.state.model_dump(),
            )
            before = getattr(agent.state, key)
            after = _bounded_value(key, before, effect['delta'])
            setattr(agent.state, key, after)
        else:
            rollback['world'].setdefault(key, getattr(world, key))
            before = getattr(world, key)
            after = _bounded_value(key, before, effect['delta'])
            setattr(world, key, after)
        effect.update(
            {
                'before': before,
                'delta': after - before,
                'after': after,
            }
        )
        actual_effects.append(effect)

    record = {
        'id': 'int-' + uuid4().hex,
        'type': preview['type'],
        'command': preview['command'],
        'category': preview['category'],
        'target': deepcopy(preview['target']),
        'preview_effects': deepcopy(preview.get('effects', [])),
        'actual_effects': actual_effects,
        'applied_round': state.get('current_round', 0),
        'applied_at': datetime.now(timezone.utc).isoformat(),
        'status': 'applied',
        'response_status': 'pending',
        'confirmation_required': preview.get(
            'confirmation_required',
            False,
        ),
        'semantics': preview.get('semantics', 'preset'),
        'response_note': preview.get('response_note', ''),
        'rollback': rollback,
    }
    state.setdefault('interventions', []).append(record)
    state['pending_intervention_id'] = record['id']
    return record


def can_undo_intervention(state: dict, record: dict) -> bool:
    '''Return whether the latest record can be safely rolled back.'''
    status = _enum_value(state.get('status'))
    interventions = state.get('interventions', [])
    return bool(
        status == SimulationStatus.PAUSED.value
        and interventions
        and interventions[-1].get('id') == record.get('id')
        and record.get('status') == 'applied'
        and record.get('response_status') == 'pending'
        and record.get('applied_round') == state.get('current_round')
        and state.get('pending_intervention_id') == record.get('id')
        and record.get('rollback') is not None
    )


def public_intervention_receipt(record: dict, state: dict) -> dict:
    '''Serialize an intervention for clients without exposing rollback state.'''
    public = {
        key: deepcopy(value)
        for key, value in record.items()
        if key != 'rollback'
    }
    public['can_undo'] = can_undo_intervention(state, record)
    return public


def build_demo_acknowledgement(record: dict, agent_name: str) -> str:
    '''Build truthful deterministic acknowledgement copy for scripted demos.'''
    return (
        agent_name
        + ' acknowledges the management intervention '
        + '“'
        + record['command']
        + '” for '
        + record['target']['label']
        + '. The team will account for it in the next decision.'
    )
