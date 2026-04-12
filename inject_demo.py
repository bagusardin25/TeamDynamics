with open("backend/routers/simulation.py", "r", encoding="utf-8") as f:
    content = f.read()

demo_status = """
@router.get("/{sim_id}/status")
async def get_sim_status(sim_id: str):
    if sim_id == "demo":
        return {
            "id": "demo",
            "status": "completed",
            "currentRound": 12,
            "totalRounds": 12,
            "company": {"name": "Pied Piper", "culture": "A chaotic, fast-paced startup building compression algorithms."},
            "agents": [
                {"id": "a1", "name": "Richard Hendricks (CEO)", "morale": 50, "stress": 95, "loyalty": 70, "productivity": 40, "initials": "RH", "has_resigned": False, "resigned_week": None},
                {"id": "a2", "name": "Dinesh Chugtai (Senior Engineer)", "morale": 35, "stress": 85, "loyalty": 60, "productivity": 30, "initials": "DC", "has_resigned": False, "resigned_week": None},
                {"id": "a3", "name": "Bertram Gilfoyle (Systems Architect)", "morale": 65, "stress": 40, "loyalty": 80, "productivity": 90, "initials": "BG", "has_resigned": False, "resigned_week": None}
            ],
            "messages": [
                {"id": "m1", "round": 0, "type": "system", "content": "CRISIS INJECTED: Server Outage during TechCrunch Disrupt"},
                {"id": "m2", "round": 1, "agent_id": "a1", "agent_name": "Richard Hendricks", "type": "public", "content": "Guys, the servers just went down. We are presenting in 45 minutes!!! Fix it!", "thought": "I'm going to throw up.", "changes": {"morale": -5, "stress": 20}},
                {"id": "m3", "round": 2, "agent_id": "a2", "agent_name": "Dinesh Chugtai", "type": "public", "content": "It's Gilfoyle's fault. His architecture is failing under load.", "changes": {"morale": -10, "stress": 15}},
                {"id": "m4", "round": 3, "agent_id": "a3", "agent_name": "Bertram Gilfoyle", "type": "public", "content": "My architecture is flawless. It's your bloated Java code that's crashing the JVM.", "changes": {"morale": 0, "stress": 5}},
                {"id": "m5", "round": 12, "type": "system", "content": "Simulation completed. Crisis averted, but at what cost?"}
            ],
            "metrics": {"company_morale": 58, "company_stress": 60, "company_productivity": 75}
        }
    \"\"\"Get current simulation status, round, agents, messages, and metrics.\"\"\""""

content = content.replace("""@router.get("/{sim_id}/status")
async def get_sim_status(sim_id: str):
    \"\"\"Get current simulation status, round, agents, messages, and metrics.\"\"\"""", demo_status)

demo_report = """
@router.get("/{sim_id}/report")
async def get_report(sim_id: str):
    if sim_id == "demo":
        return {
            "simulation_id": "demo",
            "company_name": "Pied Piper",
            "crisis_name": "Server Outage during TechCrunch Disrupt",
            "total_rounds": 12,
            "completed_rounds": 12,
            "executive_summary": "The team experienced significant stress during the total server outage. Initial panic led to severe drops in morale, but they ultimately coordinated a fallback solution before the pitch. However, the resulting burnout was substantial.",
            "critical_finding": "Stress levels peaked dangerously at Week 8, pushing two key engineers near resignation.",
            "productivity_drop": 25,
            "agent_reports": [
                {
                    "id": "a1",
                    "name": "Richard Hendricks",
                    "role": "CEO",
                    "starting_morale": 70,
                    "ending_morale": 50,
                    "peak_stress": 95,
                    "has_resigned": False,
                    "resigned_week": None,
                    "status": "Critical",
                    "status_label": "High Burnout Risk"
                },
                {
                    "id": "a2",
                    "name": "Dinesh Chugtai",
                    "role": "Senior Engineer",
                    "starting_morale": 80,
                    "ending_morale": 35,
                    "peak_stress": 85,
                    "has_resigned": False,
                    "resigned_week": None,
                    "status": "Failed",
                    "status_label": "Burnt Out"
                },
                {
                    "id": "a3",
                    "name": "Bertram Gilfoyle",
                    "role": "Systems Architect",
                    "starting_morale": 60,
                    "ending_morale": 65,
                    "peak_stress": 40,
                    "has_resigned": False,
                    "resigned_week": None,
                    "status": "Thriving",
                    "status_label": "Thrived in Chaos"
                }
            ],
            "recommendations": [
                "Implement a stricter CI/CD pipeline to avoid last-minute critical bugs.",
                "Ensure CEO does not micromanage technical solutions during high-pressure events.",
                "Provide immediate time-off for the engineering team post-launch."
            ],
            "timeline": [
                {"round": 0, "company_morale": 70, "company_stress": 30, "company_productivity": 75},
                {"round": 1, "company_morale": 68, "company_stress": 35, "company_productivity": 74},
                {"round": 2, "company_morale": 65, "company_stress": 45, "company_productivity": 70},
                {"round": 3, "company_morale": 60, "company_stress": 55, "company_productivity": 68},
                {"round": 4, "company_morale": 55, "company_stress": 65, "company_productivity": 60},
                {"round": 5, "company_morale": 50, "company_stress": 75, "company_productivity": 55},
                {"round": 6, "company_morale": 45, "company_stress": 85, "company_productivity": 50},
                {"round": 7, "company_morale": 42, "company_stress": 92, "company_productivity": 45},
                {"round": 8, "company_morale": 40, "company_stress": 95, "company_productivity": 40},
                {"round": 9, "company_morale": 42, "company_stress": 88, "company_productivity": 55},
                {"round": 10, "company_morale": 48, "company_stress": 75, "company_productivity": 65},
                {"round": 11, "company_morale": 52, "company_stress": 68, "company_productivity": 70},
                {"round": 12, "company_morale": 58, "company_stress": 60, "company_productivity": 75}
            ]
        }
    \"\"\"Generate and return the post-simulation report.\"\"\""""

content = content.replace("""@router.get("/{sim_id}/report")
async def get_report(sim_id: str):
    \"\"\"Generate and return the post-simulation report.\"\"\"""", demo_report)

with open("backend/routers/simulation.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Injected DEMO endpoints successfully!")
