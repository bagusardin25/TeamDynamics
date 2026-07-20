from services.simulation_events import (
    classify_system_event,
    enrich_system_message,
)


def test_classifies_legacy_system_events_without_exposing_decorative_emoji():
    event = classify_system_event(
        "🚨 CRITICAL INCIDENT: Production database has been wiped."
    )

    assert event == {
        "kind": "crisis",
        "title": "Critical Incident",
        "summary": "Production database has been wiped.",
        "severity": "critical",
        "effects": [],
    }


def test_enriches_system_message_with_typed_metadata_and_clean_content():
    enriched = enrich_system_message(
        {
            "id": 1,
            "type": "system",
            "content": "📊 Phase Shift → Execution & Adaptation: Execute the plan.",
        }
    )

    assert enriched["content"] == (
        "Phase Shift → Execution & Adaptation: Execute the plan."
    )
    assert enriched["event"]["kind"] == "phase_shift"
    assert enriched["event"]["title"] == "Execution & Adaptation"


def test_leaves_agent_messages_unchanged():
    message = {"id": 2, "type": "agent", "content": "I support the plan."}

    assert enrich_system_message(message) == message
