"""
Simulation CRUD and control routes.
"""

from fastapi import APIRouter, HTTPException, Depends
from models.schemas import (
    CreateSimulationRequest, SimulationResponse, SimulationMetrics,
    InterventionRequest, SimulationStatus, AgentState, GenerateCrisisRequest,
    Message, StateChanges,
)
from services.simulation_engine import (
    create_simulation, get_simulation_state, process_intervention, compute_metrics,
)
from services.report_generator import generate_report
from routers.auth import get_current_user, TokenData

router = APIRouter(prefix="/api/simulation", tags=["simulation"])



@router.post("/generate-crisis")
async def generate_crisis(request: GenerateCrisisRequest):
    """Generate a custom crisis tailored to the company using AI."""
    from services.llm_service import generate_tailored_crisis
    
    crisis = await generate_tailored_crisis(request.company_name, request.company_culture)
    return crisis

@router.post("/create")
async def create_sim(
    request: CreateSimulationRequest,
    current_user: TokenData | None = Depends(get_current_user),
):
    """Create a new simulation and return its ID."""
    from models.database import get_user_by_id, update_user_credits

    user_id = current_user.user_id if current_user else None

    # Credit check for authenticated non-admin users
    if current_user and current_user.role != "admin":
        user = await get_user_by_id(current_user.user_id)
        if user and user["credits"] <= 0:
            raise HTTPException(
                status_code=403,
                detail="No simulation credits remaining. Please upgrade your plan."
            )

    sim_id = await create_simulation(request, user_id=user_id)

    # Deduct credit for authenticated non-admin users
    if current_user and current_user.role != "admin":
        user = await get_user_by_id(current_user.user_id)
        if user:
            await update_user_credits(current_user.user_id, max(0, user["credits"] - 1))

    return {"id": sim_id, "status": "idle"}



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
    """Get current simulation status, round, agents, messages, and metrics."""
    state = await get_simulation_state(sim_id)
    if not state:
        raise HTTPException(status_code=404, detail="Simulation not found")

    agents = state["agents"]
    metrics = compute_metrics(agents)

    # Convert agents to serializable format
    agents_data = []
    for a in agents:
        agents_data.append({
            "id": a.id,
            "name": f"{a.name} ({a.role})",
            "morale": a.state.morale,
            "stress": a.state.stress,
            "loyalty": a.state.loyalty,
            "productivity": a.state.productivity,
            "initials": a.initials or a.compute_initials(),
            "has_resigned": a.has_resigned,
            "resigned_week": a.resigned_week,
        })

    return {
        "id": state["id"],
        "status": state["status"].value if isinstance(state["status"], SimulationStatus) else state["status"],
        "currentRound": state["current_round"],
        "totalRounds": state["total_rounds"],
        "company": state["company"],
        "agents": agents_data,
        "messages": state["messages"],
        "metrics": metrics,
    }


@router.post("/{sim_id}/intervene")
async def intervene(sim_id: str, request: InterventionRequest):
    """Send a God Mode intervention to an active simulation."""
    state = await get_simulation_state(sim_id)
    if not state:
        raise HTTPException(status_code=404, detail="Simulation not found")

    from routers.websocket import broadcast_message
    msg = await process_intervention(
        sim_id, request.type, request.custom_message, ws_broadcast=broadcast_message,
    )

    # Return updated metrics
    agents = state["agents"]
    metrics = compute_metrics(agents)

    return {
        "message": msg,
        "metrics": metrics,
        "agents": [
            {
                "id": a.id,
                "name": f"{a.name} ({a.role})",
                "morale": a.state.morale,
                "stress": a.state.stress,
                "initials": a.initials or a.compute_initials(),
            }
            for a in agents
        ],
    }



@router.get("/{sim_id}/report")
async def get_report(sim_id: str):
    if sim_id == "demo":
        return {
            "simulation_id": "demo",
            "company_name": "Pied Piper",
            "crisis_name": "Server Outage during TechCrunch Disrupt",
            "total_rounds": 12,
            "completed_rounds": 12,
            "executive_summary": "A 12-week crisis simulation tested Pied Piper's 3-person team against a critical server outage during TechCrunch Disrupt. The team narrowly avoided total failure, but sustained significant burnout — final average morale settled at 50% with stress remaining elevated at 73%.",
            "critical_finding": "Stress reached a dangerous 95% peak at Week 8 — a direct result of unresolved interpersonal blame between Dinesh and Gilfoyle that CEO Richard failed to mediate. Without intervention, two engineers were within one round of resignation.",
            "simulation_overview": "This simulation modeled a high-stakes scenario where Pied Piper's core infrastructure failed 45 minutes before their TechCrunch Disrupt presentation. The 12-week scenario tested crisis communication, technical problem-solving under pressure, and leadership effectiveness across a 3-member engineering team.",
            "key_metrics": {
                "total_agents": 3,
                "active_agents": 3,
                "resignations": 0,
                "avg_morale": 50,
                "avg_stress": 73,
                "avg_loyalty": 70,
                "avg_productivity": 53,
                "productivity_drop": 25,
                "simulation_weeks": 12,
                "total_planned_weeks": 12
            },
            "analysis_insights": "The simulation revealed a critical leadership vacuum during weeks 4-8 when CEO Richard Hendricks defaulted to micromanagement rather than strategic delegation. Dinesh and Gilfoyle's interpersonal conflict (visible from Week 2 onward) was never properly addressed, creating a toxic blame cycle that amplified stress across the entire team. The turning point came at Week 9 when the team organically shifted from blame to collaborative problem-solving, resulting in a partial recovery. However, the damage was already done — Dinesh's morale dropped to 35%, indicating severe burnout risk that persists beyond the simulation window.",
            "conclusion": "Pied Piper's team survived the crisis but emerged significantly weakened. In a real-world scenario, the combination of 35% morale (Dinesh) and 95% peak stress levels would likely trigger attrition within 4-6 weeks post-crisis. The primary risk factor is the CEO's inability to mediate interpersonal conflict during high-pressure situations.",
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
                "Implement a crisis communication protocol with designated roles to prevent blame cycles during high-pressure incidents.",
                "Train the CEO on conflict mediation techniques — the failure to address the Dinesh-Gilfoyle dynamic was the primary driver of sustained stress.",
                "Establish mandatory post-incident debrief sessions within 48 hours to prevent unresolved tensions from compounding.",
                "Introduce a buddy system or peer support mechanism for engineers during extended crisis periods.",
                "Deploy automated infrastructure monitoring and failover systems to reduce single-point-of-failure risk before major events."
            ],
            "timeline": [
                {"round": 0, "morale": 70, "stress": 30, "output": 75},
                {"round": 1, "morale": 68, "stress": 35, "output": 74},
                {"round": 2, "morale": 65, "stress": 45, "output": 70},
                {"round": 3, "morale": 60, "stress": 55, "output": 68},
                {"round": 4, "morale": 55, "stress": 65, "output": 60},
                {"round": 5, "morale": 50, "stress": 75, "output": 55},
                {"round": 6, "morale": 45, "stress": 85, "output": 50},
                {"round": 7, "morale": 42, "stress": 92, "output": 45},
                {"round": 8, "morale": 40, "stress": 95, "output": 40},
                {"round": 9, "morale": 42, "stress": 88, "output": 55},
                {"round": 10, "morale": 48, "stress": 75, "output": 65},
                {"round": 11, "morale": 52, "stress": 68, "output": 70},
                {"round": 12, "morale": 58, "stress": 60, "output": 75}
            ]
        }
    """Generate and return the post-simulation report.
    
    Reports are generated once by AI and then persisted to the database.
    Subsequent requests return the saved version for consistency.
    """
    import json
    from models.database import get_saved_report, save_report

    # Check for a previously saved report first
    saved = await get_saved_report(sim_id)
    if saved:
        return json.loads(saved)

    # No saved report — generate it fresh
    state = await get_simulation_state(sim_id)
    if not state:
        raise HTTPException(status_code=404, detail="Simulation not found")

    report = await generate_report(state)
    report_dict = report.model_dump()

    # Persist the generated report so future requests get the same content
    await save_report(sim_id, json.dumps(report_dict))

    return report_dict
