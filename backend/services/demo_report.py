"""Local narrative builder for the public scripted demo report."""

from __future__ import annotations


def build_demo_report_insights(
    *,
    company: dict,
    crisis: str,
    agents_data: list[dict],
    messages: list[dict],
    total_rounds: int,
    key_metrics: dict,
) -> dict:
    """Build report prose from calculated demo state without an LLM call."""
    company_name = company.get("name", "The company")
    public_messages = [
        message for message in messages if message.get("type") == "public"
    ]
    total_agents = key_metrics.get("total_agents", len(agents_data))
    resignations = key_metrics.get("resignations", 0)
    avg_morale = key_metrics.get("avg_morale", 0)
    avg_stress = key_metrics.get("avg_stress", 0)
    avg_productivity = key_metrics.get("avg_productivity", 0)

    highest_stress_agent = max(
        agents_data,
        key=lambda agent: agent.get("state", {}).get("stress", 0),
        default={"name": "the team", "state": {"stress": avg_stress}},
    )
    highest_stress_name = highest_stress_agent.get("name", "the team")
    highest_stress = highest_stress_agent.get("state", {}).get(
        "stress",
        avg_stress,
    )

    retention_summary = (
        f"all {total_agents} team members remained active"
        if resignations == 0
        else f"{resignations} of {total_agents} team members resigned"
    )
    decision_reached = any(
        "TEAM DECISION REACHED" in str(message.get("content", ""))
        for message in messages
    )
    decision_summary = (
        "The team converted its initial proposal into a shared recovery decision."
        if decision_reached
        else "The transcript shows coordinated recovery work without a formal decision event."
    )

    return {
        "executive_summary": (
            f"{company_name} rehearsed a production database recovery across "
            f"{total_rounds} rounds and {len(public_messages)} agent messages. "
            f"The run ended with average morale at {avg_morale}%, average stress "
            f"at {avg_stress}%, and {retention_summary}."
        ),
        "critical_finding": (
            f"{highest_stress_name} carried the highest final stress at "
            f"{highest_stress}%. The strongest control was the team's decision "
            "to surface the replication gap before production cutover."
        ),
        "simulation_overview": (
            f"This scripted exercise tested {total_agents} Northstar Labs team "
            f"members against the scenario: {crisis}. It covered recovery "
            "strategy, execution setbacks, a client escalation, evidence-based "
            "stakeholder communication, and post-incident accountability."
        ),
        "analysis_insights": (
            f"{decision_summary} Alex established technical gates, Sam made the "
            "data gap visible, and Jordan paired transparent communication with "
            "customer-level verification. Jordan answered the client escalation "
            "with an evidence-backed recovery review. The follow-up exchanges show the plan "
            "adapting to evidence instead of hiding uncertainty. Final average "
            f"productivity was {avg_productivity}%, while the team retained a "
            "clear separation between recovery, validation, and communication."
        ),
        "conclusion": (
            f"{company_name} completed the rehearsal with a viable recovery "
            "pattern: freeze risky changes, verify data, communicate facts, and "
            "assign remediation owners. The primary residual risk is allowing "
            "manual validation and restore knowledge to remain undocumented."
        ),
        "recommendations": [
            "Schedule recurring restore drills with two-person verification.",
            "Automate snapshot, checksum, and replication-gap validation.",
            "Define customer communication templates with evidence-based update gates.",
            "Track every post-incident remediation item with an owner and due date.",
            "Run a blameless review focused on system controls and recovery readiness.",
        ],
    }
