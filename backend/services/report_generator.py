"""
Report Generator — compiles simulation data into post-simulation reports.
"""

from __future__ import annotations

import logging
from models.schemas import AgentFullState, AgentReport, ReportResponse
from services.llm_service import generate_report_insights
from services.demo_report import build_demo_report_insights
from models.agent import compute_initial_state

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

def _outcome_from_messages(
    messages: list[dict],
    agents: list[AgentFullState],
) -> dict:
    """Extract a structured outcome and repair legacy generic descriptions."""
    structured_outcome = None
    title = ""
    for message in reversed(messages):
        changes = message.get("state_changes") or {}
        candidate = changes.get("outcome") if isinstance(changes, dict) else None
        if isinstance(candidate, dict) and candidate.get("title"):
            structured_outcome = dict(candidate)
            title = str(candidate["title"])
            break
        content = str(message.get("content", ""))
        if "SIMULATION OUTCOME:" in content:
            title = (
                content.split("SIMULATION OUTCOME:", 1)[1]
                .splitlines()[0]
                .strip()
                .title()
            )
            break

    active_agents = [agent for agent in agents if not agent.has_resigned]
    resigned_count = len(agents) - len(active_agents)
    avg_morale = (
        sum(agent.state.morale for agent in active_agents) // len(active_agents)
        if active_agents
        else 0
    )
    normalized_title = title.casefold()
    if not title:
        if not active_agents:
            title = "Total Collapse"
        elif resigned_count > len(agents) / 2 or avg_morale < 20:
            title = "Team Fracture"
        else:
            title = "Simulation Completed"
        normalized_title = title.casefold()

    if normalized_title == "team fracture":
        if resigned_count > len(agents) / 2:
            description = (
                f"{resigned_count} of {len(agents)} team members resigned; "
                f"the remaining team's final morale was {avg_morale}%."
            )
        else:
            description = (
                f"Active-team morale collapsed to {avg_morale}% while "
                f"{resigned_count} of {len(agents)} team members resigned. "
                "The fracture was driven primarily by morale collapse, not headcount loss."
            )
    elif structured_outcome and structured_outcome.get("description"):
        description = str(structured_outcome["description"])
    elif normalized_title == "total collapse":
        description = "No active team members remained at the end of the simulation."
    else:
        description = (
            f"The active team finished with {avg_morale}% morale and "
            f"{resigned_count} resignation(s)."
        )

    outcome_id = (
        structured_outcome.get("id")
        if structured_outcome
        else title.casefold().replace(" ", "_")
    )
    return {
        "id": outcome_id,
        "title": title,
        "description": description,
        "emoji": (structured_outcome or {}).get("emoji", ""),
    }




async def generate_report(sim_state: dict) -> ReportResponse:
    """Generate a full post-simulation report."""
    agents: list[AgentFullState] = sim_state["agents"]
    messages = sim_state["messages"]
    company = sim_state["company"]
    crisis_desc = sim_state.get("crisis_description", "Unknown")

    # Build agent reports from exact initial states and persisted snapshots.
    agent_reports = []
    metrics_history = sim_state.get("metrics_history") or []
    initial_state_by_agent = {
        agent.id: compute_initial_state(
            agent.personality.model_dump(by_alias=True)
        )
        for agent in agents
    }
    exact_peak_stress: dict[str, int] = {}
    for snapshot in metrics_history:
        agent_states = snapshot.get("agent_states")
        if not isinstance(agent_states, dict):
            continue
        for agent_id, agent_state in agent_states.items():
            if not isinstance(agent_state, dict):
                continue
            stress = agent_state.get("stress")
            if isinstance(stress, (int, float)):
                exact_peak_stress[agent_id] = max(
                    exact_peak_stress.get(agent_id, 0),
                    int(stress),
                )

    for agent in agents:
        status, status_label = _classify_agent(agent)
        initial_state = initial_state_by_agent[agent.id]
        peak_is_estimate = agent.id not in exact_peak_stress
        peak_stress = (
            max(initial_state["stress"], agent.state.stress)
            if peak_is_estimate
            else max(initial_state["stress"], exact_peak_stress[agent.id])
        )

        agent_reports.append(AgentReport(
            id=agent.id,
            name=agent.name,
            role=agent.role,
            starting_morale=initial_state["morale"],
            ending_morale=agent.state.morale,
            peak_stress=min(100, peak_stress),
            peak_stress_is_estimate=peak_is_estimate,
            has_resigned=agent.has_resigned,
            resigned_week=agent.resigned_week,
            status=status,
            status_label=status_label,
        ))

    # Compare active agents against their actual personality-derived baseline.
    active = [a for a in agents if not a.has_resigned]
    if active:
        avg_productivity = sum(a.state.productivity for a in active) // len(active)
        initial_avg_productivity = sum(
            initial_state_by_agent[a.id]["productivity"]
            for a in active
        ) // len(active)
    else:
        avg_productivity = 0
        initial_avg_productivity = 0
    productivity_drop = max(0, initial_avg_productivity - avg_productivity)


    # Reconstruct Timeline metrics per round
    timeline = []
    agent_states = {}
    for a in agents:
        p_dict = a.personality.model_dump(by_alias=True)
        init_st = compute_initial_state(p_dict)
        agent_states[a.id] = {
            "morale": init_st["morale"],
            "stress": init_st["stress"],
            "prod": init_st["productivity"],
            "resigned": False
        }
    
    def calc_averages(states):
        active = [s for s in states.values() if not s["resigned"]]
        if not active: return {"morale":0, "stress":0, "output":0}
        return {
            "morale": sum(s["morale"] for s in active) // len(active),
            "stress": sum(s["stress"] for s in active) // len(active),
            "output": sum(s["prod"] for s in active) // len(active)
        }
        
    timeline.append({"round": 0, **calc_averages(agent_states)})

    msgs_by_round = {}
    for m in messages:
        r = m.get("round", 0)
        msgs_by_round.setdefault(r, []).append(m)

    completed_rounds = sim_state.get("current_round", 0)
    for r in range(1, completed_rounds + 1):
        for m in msgs_by_round.get(r, []):
            sc = m.get("state_changes")
            aid = m.get("agent_id")
            if sc and aid and aid in agent_states and not agent_states[aid]["resigned"]:
                agent_states[aid]["morale"] = max(0, min(100, agent_states[aid]["morale"] + sc.get("morale", 0)))
                agent_states[aid]["stress"] = max(0, min(100, agent_states[aid]["stress"] + sc.get("stress", 0)))
                agent_states[aid]["prod"] = max(0, min(100, agent_states[aid]["prod"] + sc.get("productivity", 0)))
            
            # Simple resignation check
            msg_content = str(m.get("content", ""))
            if aid and aid in agent_states and m.get("type") == "system" and "resigned" in msg_content.lower():
                 agent_states[aid]["resigned"] = True
                 
        timeline.append({"round": r, **calc_averages(agent_states)})

    # Generate AI insights
    recorded_timeline = [
        {
            "round": snapshot.get("round", 0),
            "morale": snapshot.get("morale", 0),
            "stress": snapshot.get("stress", 0),
            "output": snapshot.get("productivity", 0),
        }
        for snapshot in metrics_history
        if all(
            key in snapshot
            for key in ("round", "morale", "stress", "productivity")
        )
    ]
    if recorded_timeline:
        if recorded_timeline[0]["round"] != 0 and timeline:
            recorded_timeline.insert(0, timeline[0])
        timeline = recorded_timeline


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

    # Compute structured key metrics
    total_agents = len(agents)
    active_agents = [a for a in agents if not a.has_resigned]
    resigned_agents = [a for a in agents if a.has_resigned]

    if active_agents:
        final_avg_morale = sum(a.state.morale for a in active_agents) // len(active_agents)
        final_avg_stress = sum(a.state.stress for a in active_agents) // len(active_agents)
        final_avg_loyalty = sum(a.state.loyalty for a in active_agents) // len(active_agents)
    else:
        final_avg_morale = 0
        final_avg_stress = 0
        final_avg_loyalty = 0

    key_metrics = {
        "total_agents": total_agents,
        "active_agents": len(active_agents),
        "resignations": len(resigned_agents),
        "avg_morale": final_avg_morale,
        "avg_stress": final_avg_stress,
        "avg_loyalty": final_avg_loyalty,
        "avg_productivity": avg_productivity,
        "productivity_drop": productivity_drop,
        "simulation_weeks": completed_rounds,
        "total_planned_weeks": sim_state.get("total_rounds", 12),
    }

    outcome = _outcome_from_messages(messages, agents)
    report_source = "llm"
    if sim_state.get("mode") == "demo":
        report_source = "scripted-mock"
        insights = build_demo_report_insights(
            company=company,
            crisis=crisis_desc,
            agents_data=agents_data,
            messages=messages_data,
            total_rounds=sim_state.get("total_rounds", 12),
            key_metrics=key_metrics,
        )
    else:
        insights = await generate_report_insights(
            company=company,
            crisis=crisis_desc,
            agents_data=agents_data,
            messages=messages_data,
            total_rounds=sim_state.get("total_rounds", 12),
            outcome=outcome,
        )

    return ReportResponse(
        simulation_id=sim_state["id"],
        company_name=company["name"],
        crisis_name=crisis_name,
        total_rounds=sim_state.get("total_rounds", 12),
        completed_rounds=sim_state.get("current_round", 0),
        report_source=report_source,
        executive_summary=insights.get("executive_summary", "Simulation completed."),
        critical_finding=insights.get("critical_finding", "No critical findings."),
        simulation_overview=insights.get("simulation_overview", ""),
        key_metrics=key_metrics,
        analysis_insights=insights.get("analysis_insights", ""),
        conclusion=insights.get("conclusion", ""),
        agent_reports=agent_reports,
        productivity_drop=productivity_drop,
        recommendations=insights.get("recommendations", []),
        timeline=timeline,
    )
