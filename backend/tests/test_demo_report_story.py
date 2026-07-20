from services.demo_report import build_demo_report_insights


def test_demo_report_mentions_the_client_recovery_escalation():
    insights = build_demo_report_insights(
        company={"name": "Northstar Labs"},
        crisis="Production database failure",
        agents_data=[
            {"name": "Alex", "state": {"stress": 35}},
            {"name": "Sam", "state": {"stress": 30}},
            {"name": "Jordan", "state": {"stress": 28}},
        ],
        messages=[
            {
                "type": "system",
                "content": (
                    "UNEXPECTED EVENT: Key Client Requests Recovery Proof"
                ),
            },
            {
                "type": "public",
                "content": "We will deliver the client recovery packet.",
            },
        ],
        total_rounds=3,
        key_metrics={
            "total_agents": 3,
            "resignations": 0,
            "avg_morale": 72,
            "avg_stress": 31,
            "avg_productivity": 88,
        },
    )

    narrative = " ".join(
        [
            insights["executive_summary"],
            insights["critical_finding"],
            insights["simulation_overview"],
            insights["analysis_insights"],
            insights["conclusion"],
        ]
    )
    assert "client escalation" in narrative.lower()
