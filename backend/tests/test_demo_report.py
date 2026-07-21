from __future__ import annotations

import asyncio

from models.schemas import AgentFullState, AgentState
from services import report_generator
from services.demo_simulation import build_demo_simulation_request


def _simulation_state(mode: str = "demo") -> dict:
    request = build_demo_simulation_request()
    agents = [
        AgentFullState(
            **agent.model_dump(),
            state=AgentState(
                morale=72 + index,
                stress=38 + index,
                loyalty=76 + index,
                productivity=80 - index,
            ),
        )
        for index, agent in enumerate(request.agents)
    ]
    messages = [
        {
            "round": round_num,
            "agent_id": agent.id,
            "agent_name": agent.name,
            "type": "public",
            "content": f"Round {round_num} exchange {exchange_num}",
            "state_changes": {
                "morale": 1,
                "stress": -1,
                "loyalty": 1,
                "productivity": 1,
            },
        }
        for round_num in range(1, 4)
        for exchange_num in range(1, 3)
        for agent in agents
    ]
    return {
        "id": f"{mode}-report",
        "mode": mode,
        "company": request.company.model_dump(),
        "crisis_scenario": request.crisis.scenario.value,
        "crisis_description": "Production database failure",
        "agents": agents,
        "messages": messages,
        "current_round": 3,
        "total_rounds": 3,
    }


def test_demo_report_never_calls_external_insight_generator(monkeypatch):
    async def forbidden_insights(**kwargs):
        raise AssertionError("external report model was called")

    monkeypatch.setattr(
        report_generator,
        "generate_report_insights",
        forbidden_insights,
    )

    report = asyncio.run(report_generator.generate_report(_simulation_state()))

    assert report.report_source == "scripted-mock"
    assert report.key_metrics["total_agents"] == 3
    assert len(report.recommendations) == 5
    assert all(report.recommendations)
    assert "18" in report.executive_summary


def test_standard_report_preserves_external_insight_generator(monkeypatch):
    calls = []

    async def fake_insights(**kwargs):
        calls.append(kwargs)
        return {
            "executive_summary": "Provider-backed summary.",
            "critical_finding": "Provider-backed finding.",
            "simulation_overview": "Provider-backed overview.",
            "analysis_insights": "Provider-backed analysis.",
            "conclusion": "Provider-backed conclusion.",
            "recommendations": ["One", "Two", "Three"],
        }

    monkeypatch.setattr(
        report_generator,
        "generate_report_insights",
        fake_insights,
    )

    report = asyncio.run(
        report_generator.generate_report(_simulation_state(mode="standard"))
    )

    assert report.report_source == "llm"
    assert report.executive_summary == "Provider-backed summary."
    assert len(calls) == 1

def test_standard_report_uses_exact_initial_metrics_and_state_snapshots(
    monkeypatch,
):
    calls = []

    async def fake_insights(**kwargs):
        calls.append(kwargs)
        return {
            "executive_summary": "Grounded summary.",
            "critical_finding": "Grounded finding.",
            "simulation_overview": "Grounded overview.",
            "analysis_insights": "Grounded analysis.",
            "conclusion": "Grounded conclusion.",
            "recommendations": ["One", "Two", "Three"],
        }

    monkeypatch.setattr(
        report_generator,
        "generate_report_insights",
        fake_insights,
    )
    state = _simulation_state(mode="standard")
    first_agent = state["agents"][0]
    state["messages"].append(
        {
            "round": 3,
            "agent_id": None,
            "agent_name": None,
            "type": "system",
            "content": "SIMULATION OUTCOME: TEAM FRACTURE",
            "state_changes": {
                "outcome": {
                    "id": "team_fracture",
                    "title": "Team Fracture",
                    "description": "Final morale collapsed despite one resignation.",
                    "emoji": "broken-heart",
                }
            },
        }
    )
    state["metrics_history"] = [
        {
            "round": 0,
            "agent_states": {
                agent.id: agent.state.model_dump()
                for agent in state["agents"]
            },
        },
        {
            "round": 2,
            "agent_states": {
                **{
                    agent.id: agent.state.model_dump()
                    for agent in state["agents"]
                },
                first_agent.id: {
                    **first_agent.state.model_dump(),
                    "stress": 91,
                },
            },
        },
    ]

    report = asyncio.run(report_generator.generate_report(state))
    first_report = next(
        agent_report
        for agent_report in report.agent_reports
        if agent_report.id == first_agent.id
    )
    expected_initial = report_generator.compute_initial_state(
        first_agent.personality.model_dump(by_alias=True)
    )

    assert first_report.starting_morale == expected_initial["morale"]
    assert first_report.peak_stress == 91
    assert first_report.peak_stress_is_estimate is False
    assert calls[0]["outcome"]["title"] == "Team Fracture"


def test_legacy_report_marks_peak_stress_as_estimated(monkeypatch):
    async def fake_insights(**kwargs):
        return {
            "executive_summary": "Grounded summary.",
            "critical_finding": "Grounded finding.",
            "simulation_overview": "Grounded overview.",
            "analysis_insights": "Grounded analysis.",
            "conclusion": "Grounded conclusion.",
            "recommendations": ["One", "Two", "Three"],
        }

    monkeypatch.setattr(
        report_generator,
        "generate_report_insights",
        fake_insights,
    )
    state = _simulation_state(mode="standard")

    report = asyncio.run(report_generator.generate_report(state))

    assert all(
        agent_report.peak_stress_is_estimate
        for agent_report in report.agent_reports
    )
