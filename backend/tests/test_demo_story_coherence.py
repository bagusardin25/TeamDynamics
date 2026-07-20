from __future__ import annotations

from types import SimpleNamespace

from data.world_state import apply_random_event_to_world, tick_world_state
from services import demo_simulation, simulation_engine
from services.decision_engine import (
    cleanup_tracker,
    determine_outcome,
    process_agent_action,
)
from services.demo_responses import get_demo_agent_response


AGENTS = (
    ("Alex", "Tech Lead"),
    ("Sam", "Junior Dev"),
    ("Jordan", "Product Manager"),
)


def test_demo_opens_with_disagreement_then_reaches_revised_consensus():
    actions = [
        get_demo_agent_response({"name": name}, 1, exchange)["action"]
        for exchange in (1, 2)
        for name, _role in AGENTS
    ]

    assert actions == [
        "propose_solution",
        "support_proposal",
        "oppose_proposal",
        "propose_solution",
        "support_proposal",
        "support_proposal",
    ]


def test_demo_resolution_dialogue_responds_to_client_escalation():
    for name, _role in AGENTS:
        dialogue = " ".join(
            get_demo_agent_response({"name": name}, 3, exchange)[
                "public_message"
            ]
            for exchange in (1, 2)
        ).lower()

        assert "client" in dialogue


def test_demo_uses_a_recoverable_initial_world_state():
    factory = getattr(demo_simulation, "build_demo_world_state", None)

    assert callable(factory)
    world = factory()
    assert world.customer_satisfaction == 35


def test_demo_has_one_fixed_resolution_event_returned_as_a_copy():
    getter = getattr(demo_simulation, "get_demo_round_event", None)

    assert callable(getter)
    assert getter(1) is None
    assert getter(2) is None

    event = getter(3)
    assert event is not None
    assert event.id == "client_recovery_escalation"
    assert event.world_effects["customer_satisfaction"] == -4

    event.world_effects["customer_satisfaction"] = -99
    assert getter(3).world_effects["customer_satisfaction"] == -4


def test_demo_event_resolution_never_uses_global_random_roll(monkeypatch):
    resolver = getattr(simulation_engine, "_resolve_round_event", None)

    assert callable(resolver)

    def forbidden_random_roll(*_args, **_kwargs):
        raise AssertionError("global random-event path was called")

    monkeypatch.setattr(
        simulation_engine,
        "roll_random_event",
        forbidden_random_roll,
    )

    event = resolver(
        state={"mode": "demo"},
        sim_id="demo-event",
        current_round=3,
        crisis_scenario="rnd4",
    )

    assert event is not None
    assert event.id == "client_recovery_escalation"


def test_demo_story_finishes_as_team_triumph_with_improved_customer_trust():
    world_factory = getattr(demo_simulation, "build_demo_world_state", None)
    event_getter = getattr(demo_simulation, "get_demo_round_event", None)

    assert callable(world_factory)
    assert callable(event_getter)

    sim_id = "demo-story-coherence"
    world = world_factory()

    try:
        for round_num in range(1, 4):
            if round_num > 1:
                tick_world_state(world)

            event = event_getter(round_num)
            if event is not None:
                apply_random_event_to_world(world, event)

            for exchange in (1, 2):
                for name, role in AGENTS:
                    response = get_demo_agent_response(
                        {"name": name},
                        round_num,
                        exchange,
                    )
                    process_agent_action(
                        sim_id,
                        round_num,
                        f"{name} ({role})",
                        role,
                        response["action"],
                        response["action_detail"],
                        world=world,
                    )

        agents = [
            SimpleNamespace(
                has_resigned=False,
                state=SimpleNamespace(morale=70),
            )
            for _name, _role in AGENTS
        ]
        outcome = determine_outcome(
            sim_id,
            agents,
            total_rounds=3,
            current_round=3,
            world=world,
        )

        assert outcome.id == "team_triumph"
        assert world.customer_satisfaction >= 40
    finally:
        cleanup_tracker(sim_id)
