"""
Simulation CRUD and control routes.
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Response
from models.schemas import (
    CreateSimulationRequest, SimulationResponse, SimulationMetrics,
    InterventionRequest, SimulationStatus, AgentState, GenerateCrisisRequest,
    Message, StateChanges, SimulationControlRequest,
)
from services.simulation_engine import (
    create_simulation, get_simulation_state, process_intervention, compute_metrics,
    preview_intervention, undo_intervention, control_simulation,
    get_public_interventions,
)
from services.report_generator import generate_report
from services.simulation_events import enrich_system_messages
from routers.auth import get_current_user, require_auth, TokenData

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

def _raise_intervention_http(error: ValueError) -> None:
    detail = str(error)
    lowered = detail.lower()
    if 'not found' in lowered:
        status_code = 404
    elif 'selected agent' in lowered:
        status_code = 422
    else:
        status_code = 409
    raise HTTPException(status_code=status_code, detail=detail) from error


@router.post('/{sim_id}/interventions/preview')
async def preview_simulation_intervention(
    sim_id: str,
    request: InterventionRequest,
):
    try:
        return await preview_intervention(sim_id, request)
    except ValueError as error:
        _raise_intervention_http(error)


@router.post('/{sim_id}/interventions/{intervention_id}/undo')
async def undo_simulation_intervention(
    sim_id: str,
    intervention_id: str,
):
    try:
        from routers.websocket import broadcast_message

        return await undo_intervention(
            sim_id,
            intervention_id,
            ws_broadcast=broadcast_message,
        )
    except ValueError as error:
        _raise_intervention_http(error)


@router.post('/{sim_id}/control')
async def update_simulation_control(
    sim_id: str,
    request: SimulationControlRequest,
):
    try:
        from routers.websocket import broadcast_control_state

        result = await control_simulation(sim_id, request.action)
        await broadcast_control_state(sim_id)
        return result
    except ValueError as error:
        _raise_intervention_http(error)


# Per-route rate limits for LLM-heavy endpoints
from services.rate_limiter import limiter
from services.demo_simulation import DEMO_RUNTIME_MODEL, build_demo_simulation_request


@router.post("/generate-crisis")
@limiter.limit("5/minute")
async def generate_crisis(
    request: Request,
    response: Response,
    req: GenerateCrisisRequest,
):
    """Generate a custom crisis tailored to the company using AI."""
    from services.llm_service import generate_tailored_crisis

    crisis = await generate_tailored_crisis(req.company_name, req.company_culture)
    return crisis


@router.post("/create")
@limiter.limit("5/minute")
async def create_sim(
    request: Request,
    response: Response,
    body: CreateSimulationRequest,
    current_user: TokenData = Depends(require_auth),
):
    """Create a new simulation and return its ID. Requires authentication."""
    from models.database import get_user_by_id, update_user_credits

    user_id = current_user.user_id

    # Credit check for non-admin users
    if current_user.role != "admin":
        user = await get_user_by_id(current_user.user_id)
        if user and user["credits"] <= 0:
            raise HTTPException(
                status_code=403,
                detail="No simulation credits remaining. Please upgrade your plan.",
            )

    sim_id = await create_simulation(body, user_id=user_id)

    # Deduct credit for non-admin users
    if current_user.role != "admin":
        user = await get_user_by_id(current_user.user_id)
        if user:
            await update_user_credits(current_user.user_id, max(0, user["credits"] - 1))

    return {"id": sim_id, "status": "idle"}


@router.post("/demo")
@limiter.limit("3/minute")
async def create_demo_simulation(request: Request, response: Response):
    """Create the fixed anonymous Quick Demo backed by local fixtures."""
    body = build_demo_simulation_request()
    sim_id = await create_simulation(
        body,
        user_id=None,
        mode="demo",
        runtime_model=DEMO_RUNTIME_MODEL,
        strict_llm=False,
    )
    return {
        "id": sim_id,
        "status": "idle",
        "mode": "demo",
        "runtime_model": DEMO_RUNTIME_MODEL,
    }


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
        sim_id, request=request, ws_broadcast=broadcast_message,
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

    # No saved report; generate it fresh
    state = await get_simulation_state(sim_id)
    if not state:
        raise HTTPException(status_code=404, detail="Simulation not found")

    report = await generate_report(state)
    report_dict = report.model_dump()

    # Persist the generated report so future requests get the same content
    await save_report(sim_id, json.dumps(report_dict))

    return report_dict


@router.post("/compare")
async def compare_simulations(body: dict):
    """Compare 2-3 completed simulations side-by-side.

    Expects: { "simulation_ids": ["sim-a", "sim-b", ...] }
    Returns normalized comparison data from saved reports.
    """
    import json
    from models.database import get_saved_report, get_simulation

    sim_ids = body.get("simulation_ids", [])
    if not isinstance(sim_ids, list) or len(sim_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 simulation IDs are required")
    if len(sim_ids) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 simulations can be compared")

    results = []
    for sid in sim_ids:
        # Get simulation metadata
        sim = await get_simulation(sid)
        if not sim:
            raise HTTPException(status_code=404, detail=f"Simulation {sid} not found")
        if sim["status"] != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Simulation {sid} is not completed (status: {sim['status']})",
            )

        # Get saved report
        report_json = await get_saved_report(sid)
        if not report_json:
            raise HTTPException(
                status_code=404,
                detail=f"Report for simulation {sid} not found. Open the report page first to generate it.",
            )

        report = json.loads(report_json)
        km = report.get("key_metrics", {})

        results.append({
            "id": sid,
            "company_name": report.get("company_name", sim.get("company_name", "Unknown")),
            "crisis_name": report.get("crisis_name", sim.get("crisis_scenario", "Unknown")),
            "team_size": km.get("total_agents", len(report.get("agent_reports", []))),
            "agent_names": [a["name"] for a in report.get("agent_reports", [])],
            "agent_reports": report.get("agent_reports", []),
            "key_metrics": {
                "avg_morale": km.get("avg_morale", 50),
                "avg_stress": km.get("avg_stress", 50),
                "avg_productivity": km.get("avg_productivity", 50),
                "avg_loyalty": km.get("avg_loyalty", 50),
                "resignations": km.get("resignations", 0),
                "productivity_drop": report.get("productivity_drop", 0),
                "simulation_weeks": km.get("simulation_weeks", report.get("completed_rounds", 0)),
            },
            "timeline": report.get("timeline", []),
            "executive_summary": report.get("executive_summary", ""),
            "created_at": str(sim.get("created_at", "")) if sim.get("created_at") else None,
        })

    return {"simulations": results}


@router.get("/{sim_id}/replay")
async def get_replay_data(sim_id: str):
    """Get full simulation data structured for client-side replay playback.
    Only available for completed simulations. Returns messages grouped by round
    with agent states and metrics snapshots per round."""
    import json as _json
    from models.database import (
        get_simulation, get_agents, get_messages,
        get_world_state as db_get_world_state,
        get_metrics_history as db_get_metrics_history,
        get_saved_report,
    )

    # Get simulation metadata
    sim_data = await get_simulation(sim_id)
    if not sim_data:
        raise HTTPException(status_code=404, detail="Simulation not found")

    if sim_data["status"] != "completed":
        raise HTTPException(status_code=400, detail="Replay is only available for completed simulations")

    # Fetch all data
    agents_db = await get_agents(sim_id)
    messages_db = await get_messages(sim_id)

    # Build agent info with initial and final states
    agents_info = []
    for a in agents_db:
        personality = _json.loads(a["personality_json"]) if a.get("personality_json") else {}
        agents_info.append({
            "id": a["id"],
            "name": a["name"],
            "role": a["role"],
            "type": a["type"],
            "color": a.get("color"),
            "personality": personality,
            "final_state": {
                "morale": a["morale"],
                "stress": a["stress"],
                "loyalty": a["loyalty"],
                "productivity": a["productivity"],
            },
            "has_resigned": bool(a["has_resigned"]),
            "resigned_week": a.get("resigned_week"),
        })

    # Parse and normalize messages
    all_messages = []
    for m in messages_db:
        sc = _json.loads(m["state_changes_json"]) if m.get("state_changes_json") else None
        all_messages.append({
            "id": m["id"],
            "round": m["round"],
            "agent_id": m.get("agent_id"),
            "agent_name": m.get("agent_name"),
            "type": m["type"],
            "content": m["content"],
            "thought": m.get("thought"),
            "state_changes": sc,
            "timestamp": m.get("timestamp"),
        })

    all_messages = enrich_system_messages(all_messages)

    # Group messages by round
    rounds_map: dict[int, list] = {}
    for msg in all_messages:
        r = msg.get("round", 0)
        if r not in rounds_map:
            rounds_map[r] = []
        rounds_map[r].append(msg)

    # Get metrics history
    metrics_history = []
    saved_metrics = await db_get_metrics_history(sim_id)
    if saved_metrics:
        try:
            metrics_history = _json.loads(saved_metrics)
        except Exception:
            pass

    # Build metrics map by round
    metrics_by_round = {}
    for snap in metrics_history:
        metrics_by_round[snap.get("round", 0)] = snap

    # Build rounds array
    total_rounds = sim_data["total_rounds"]
    rounds = []
    for r in range(0, total_rounds + 1):
        rounds.append({
            "round": r,
            "messages": rounds_map.get(r, []),
            "metrics": metrics_by_round.get(r),
        })

    # Get report summary if available
    report_summary = None
    saved_report = await get_saved_report(sim_id)
    if saved_report:
        try:
            report_data = _json.loads(saved_report)
            report_summary = report_data.get("executive_summary")
        except Exception:
            pass

    return {
        "simulation_id": sim_id,
        "mode": (
            "demo"
            if sim_data.get("user_id") is None and total_rounds == 3
            else "standard"
        ),
        "company": {
            "name": sim_data["company_name"],
            "culture": sim_data["company_culture"],
        },
        "crisis_scenario": sim_data["crisis_scenario"],
        "crisis_description": sim_data.get("crisis_description"),
        "total_rounds": total_rounds,
        "agents": agents_info,
        "rounds": rounds,
        "metrics_history": metrics_history,
        "report_summary": report_summary,
    }
