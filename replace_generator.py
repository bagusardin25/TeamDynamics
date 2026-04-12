import re

with open("backend/services/report_generator.py", "r", encoding="utf-8") as f:
    content = f.read()

# Add compute_initial_state import
content = content.replace(
    'from services.llm_service import generate_report_insights',
    'from services.llm_service import generate_report_insights\nfrom models.agent import compute_initial_state'
)

# Insert timeline reconstruction before Insights creation
search_str = "    # Generate AI insights"

timeline_code = """
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

    # Generate AI insights"""

if search_str in content:
    content = content.replace(search_str, timeline_code, 1)
else:
    print("Could not find '# Generate AI insights'")

# Pass timeline to ReportResponse
if 'recommendations=insights.get("recommendations", []),' in content:
    content = content.replace(
        'recommendations=insights.get("recommendations", []),',
        'recommendations=insights.get("recommendations", []),\n        timeline=timeline,'
    )
else:
    print("Could not find recommendations line")

with open("backend/services/report_generator.py", "w", encoding="utf-8") as out:
    out.write(content)

print("Success")
