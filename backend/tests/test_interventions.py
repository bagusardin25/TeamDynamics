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
    SimulationStatus,
)
from services.interventions import (
    apply_intervention_preview,
    build_demo_acknowledgement,
    build_intervention_preview,
    can_undo_intervention,
    public_intervention_receipt,
)


def _agent(agent_id: str, name: str) -> AgentFullState:
    return AgentFullState(
        id=agent_id,
        name=name,
        role="Engineer",
        type="Builder",
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


def _state() -> dict:
    return {
        "id": "sim-1",
        "status": SimulationStatus.PAUSED,
        "current_round": 2,
        "mode": "demo",
        "agents": [_agent("alex", "Alex"), _agent("jordan", "Jordan")],
        "interventions": [],
        "pending_intervention_id": None,
    }


def test_preview_and_apply_scope_agent_effects_to_selected_target():
    state = _state()
    world = WorldState()
    request = InterventionRequest(
        type=InterventionType.CUSTOM,
        custom_message="Give Alex dedicated recovery time",
        category=InterventionCategory.PEOPLE,
        target=InterventionTarget(
            kind=InterventionTargetKind.AGENT,
            id="alex",
        ),
    )

    preview = build_intervention_preview(state, world, request)

    assert preview["target"] == {
        "kind": "agent",
        "id": "alex",
        "label": "Alex",
    }
    assert {effect["scope"] for effect in preview["effects"]} == {"agent:alex"}
    assert {effect["scope_label"] for effect in preview["effects"]} == {"Alex"}
    assert preview["semantics"] == "category_based"
    assert preview["confirmation_required"] is True

    jordan_before = state["agents"][1].state.model_dump()
    record = apply_intervention_preview(state, world, preview)

    assert state["agents"][0].state.morale > 60
    assert state["agents"][1].state.model_dump() == jordan_before
    assert record["preview_effects"] == record["actual_effects"]


def test_custom_project_preview_is_deterministic_and_requires_confirmation():
    state = _state()
    world = WorldState(budget_remaining=80, team_capacity=70)
    request = InterventionRequest(
        type=InterventionType.CUSTOM,
        custom_message="Bring in temporary incident support",
        category=InterventionCategory.RESOURCES,
        target=InterventionTarget(kind=InterventionTargetKind.PROJECT),
    )

    first = build_intervention_preview(state, world, request)
    second = build_intervention_preview(state, world, request)

    assert first["effects"] == second["effects"]
    assert first["confirmation_required"] is True
    assert first["semantics"] == "category_based"
    assert {effect["key"] for effect in first["effects"]} == {
        "budget_remaining",
        "team_capacity",
    }
    assert {effect["scope_label"] for effect in first["effects"]} == {"Project"}


def test_decision_process_preview_promises_no_direct_metric_change():
    state = _state()
    world = WorldState()
    request = InterventionRequest(
        type=InterventionType.CUSTOM,
        custom_message="Require an explicit risk review before voting",
        category=InterventionCategory.POLICY,
        target=InterventionTarget(
            kind=InterventionTargetKind.DECISION_PROCESS,
        ),
    )

    preview = build_intervention_preview(state, world, request)

    assert preview["effects"] == []
    assert preview["metrics_only"] is False
    assert preview["response_note"] == (
        "No direct metric change. The next eligible agent turn will acknowledge this directive."
    )


def test_public_receipt_and_safe_undo_policy_hide_rollback_state():
    state = _state()
    record = {
        "id": "int-1",
        "type": "custom",
        "command": "Give Alex recovery time",
        "category": "people",
        "target": {"kind": "agent", "id": "alex", "label": "Alex"},
        "preview_effects": [],
        "actual_effects": [],
        "applied_round": 2,
        "applied_at": "2026-07-20T00:00:00+00:00",
        "status": "applied",
        "response_status": "pending",
        "confirmation_required": True,
        "semantics": "category_based",
        "rollback": {"agents": {"alex": {"morale": 60}}},
    }
    state["interventions"] = [record]
    state["pending_intervention_id"] = "int-1"

    assert can_undo_intervention(state, record) is True
    public = public_intervention_receipt(record, state)
    assert public["can_undo"] is True
    assert "rollback" not in public

    record["response_status"] = "acknowledged"
    assert can_undo_intervention(state, record) is False


def test_scripted_demo_custom_intervention_stays_pending_for_acknowledgement():
    state = _state()
    world = WorldState()
    request = InterventionRequest(
        type=InterventionType.CUSTOM,
        custom_message='Give Alex recovery time',
        category=InterventionCategory.PEOPLE,
        target=InterventionTarget(
            kind=InterventionTargetKind.AGENT,
            id='alex',
        ),
    )

    preview = build_intervention_preview(state, world, request)
    record = apply_intervention_preview(state, world, preview)

    assert preview['metrics_only'] is True
    assert record['response_status'] == 'pending'
    assert state['pending_intervention_id'] == record['id']


def test_demo_acknowledgement_is_explicit_about_the_applied_intervention():
    record = {
        "command": "Cancel overtime",
        "target": {"kind": "all_team", "label": "All team"},
        "semantics": "preset",
    }

    message = build_demo_acknowledgement(record, "Alex")

    assert "Cancel overtime" in message
    assert "management intervention" in message.lower()
    assert "All team" in message
