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
