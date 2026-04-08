"""
Report Generator — compiles simulation data into post-simulation reports.
"""

from __future__ import annotations

import logging
from models.schemas import AgentFullState, AgentReport, ReportResponse
from services.llm_service import generate_report_insights

logger = logging.getLogger(__name__)


def _classify_agent(agent: AgentFullState) -> tuple[str, str]:
    """Classify an agent's final status for the report."""
    if agent.has_resigned:
        return "Failed", f"Resigned • Week {agent.resigned_week}"
    elif agent.state.morale < 30:
        return "Critical", f"Survived (Critically Low Morale: {agent.state.morale}%)"
    elif agent.state.morale < 50:
        return "Stressed", f"Survived (Under Pressure)"
    elif agent.state.morale >= 70:
        return "Thriving", "Thriving"
    else:
        return "Stable", "Survived"


async def generate_report(sim_state: dict) -> ReportResponse:
    """Generate a full post-simulation report."""
    agents: list[AgentFullState] = sim_state["agents"]
    messages = sim_state["messages"]
    company = sim_state["company"]
    crisis_desc = sim_state.get("crisis_description", "Unknown")

    # Build agent reports
    agent_reports = []
    peak_stress_map = {}

    # Compute peak stress from messages
    for msg in messages:
        sc = msg.get("state_changes")
        agent_id = msg.get("agent_id")
        if sc and agent_id:
            stress_delta = sc.get("stress", 0)
            if agent_id not in peak_stress_map:
                peak_stress_map[agent_id] = 30  # starting stress approx
            peak_stress_map[agent_id] = max(
                peak_stress_map[agent_id],
                peak_stress_map[agent_id] + stress_delta
            )

    for agent in agents:
        status, status_label = _classify_agent(agent)

        starting_morale = 70  # approximate, from initial computation
        peak_stress = min(100, peak_stress_map.get(agent.id, agent.state.stress))

        agent_reports.append(AgentReport(
            id=agent.id,
            name=agent.name,
            role=agent.role,
            starting_morale=starting_morale,
            ending_morale=agent.state.morale,
            peak_stress=peak_stress,
            has_resigned=agent.has_resigned,
            resigned_week=agent.resigned_week,
            status=status,
            status_label=status_label,
        ))

    # Compute productivity drop
    active = [a for a in agents if not a.has_resigned]
    if active:
        avg_productivity = sum(a.state.productivity for a in active) // len(active)
    else:
        avg_productivity = 0
    productivity_drop = max(0, 75 - avg_productivity)  # Relative to starting ~75

    # Generate AI insights
    agents_data = [
        {
            "name": a.name,
            "role": a.role,
            "state": a.state.model_dump(),
            "has_resigned": a.has_resigned,
            "resigned_week": a.resigned_week,
        }
        for a in agents
    ]
    messages_data = [
        {
            "round": m.get("round", 0),
            "agent_name": m.get("agent_name", "System"),
            "type": m.get("type", "public"),
            "content": m.get("content", ""),
        }
        for m in messages
    ]

    from data.presets import CRISIS_SCENARIOS
    crisis_name = CRISIS_SCENARIOS.get(
        sim_state.get("crisis_scenario", ""), {}
    ).get("name", crisis_desc or "Custom Crisis")

    insights = await generate_report_insights(
        company=company,
        crisis=crisis_desc,
        agents_data=agents_data,
        messages=messages_data,
        total_rounds=sim_state.get("total_rounds", 12),
    )

    return ReportResponse(
        simulation_id=sim_state["id"],
        company_name=company["name"],
        crisis_name=crisis_name,
        total_rounds=sim_state.get("total_rounds", 12),
        completed_rounds=sim_state.get("current_round", 0),
        executive_summary=insights.get("executive_summary", "Simulation completed."),
        critical_finding=insights.get("critical_finding", "No critical findings."),
        agent_reports=agent_reports,
        productivity_drop=productivity_drop,
        recommendations=insights.get("recommendations", []),
    )
