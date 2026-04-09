"""
Simulation CRUD and control routes.
"""

from fastapi import APIRouter, HTTPException, Depends
from models.schemas import (
    CreateSimulationRequest, SimulationResponse, SimulationMetrics,
    InterventionRequest, SimulationStatus, AgentState,
    Message, StateChanges,
)
from services.simulation_engine import (
    create_simulation, get_simulation_state, process_intervention, compute_metrics,
)
from services.report_generator import generate_report
from routers.auth import get_current_user, TokenData

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.post("/create")
async def create_sim(
    request: CreateSimulationRequest,
    current_user: TokenData | None = Depends(get_current_user),
):
    """Create a new simulation and return its ID."""
    user_id = current_user.user_id if current_user else None
    sim_id = await create_simulation(request, user_id=user_id)
    return {"id": sim_id, "status": "idle"}


@router.get("/{sim_id}/status")
async def get_sim_status(sim_id: str):
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
    """Generate and return the post-simulation report."""
    state = await get_simulation_state(sim_id)
    if not state:
        raise HTTPException(status_code=404, detail="Simulation not found")

    report = await generate_report(state)
    return report.model_dump()
