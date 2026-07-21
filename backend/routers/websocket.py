"""
WebSocket handler for real-time simulation streaming.

v2: Simulation runs as independent background task — survives
    WebSocket disconnects. Clients are pure viewers/subscribers.
"""

from __future__ import annotations

import json
import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.simulation_engine import (
    get_simulation_state, run_simulation_round, compute_metrics,
    get_metrics_history, get_public_interventions,
)
from services.decision_engine import get_tracker
from models.schemas import SimulationStatus
from services.simulation_events import enrich_system_message

logger = logging.getLogger(__name__)
router = APIRouter()

from services import state_manager

# Active WebSocket connections per simulation
_ws_connections: dict[str, list[WebSocket]] = {}

# Background simulation tasks — survive WebSocket disconnects
_simulation_tasks: dict[str, asyncio.Task] = {}


def _runtime_metadata(state: dict) -> dict:
    """Return public runtime metadata using the frontend field names."""
    return {
        "mode": state.get("mode", "standard"),
        "runtimeModel": state.get("runtime_model"),
    }


def _public_round_error_message(state: dict, error: Exception) -> str:
    """Hide provider details for the anonymous demo while preserving standard diagnostics."""
    if state.get("mode") == "demo":
        return "Quick Demo could not complete this round. Retrying..."
    return f"Round error: {str(error)}. Retrying..."


def _get_world_state_data(sim_id: str) -> dict | None:
    """Get world state data for a simulation."""
    from services.simulation_engine import _world_states
    world = _world_states.get(sim_id)
    if not world:
        return None
    return {
        "budgetRemaining": world.budget_remaining,
        "customerSatisfaction": world.customer_satisfaction,
        "companyReputation": world.company_reputation,
        "teamCapacity": world.team_capacity,
        "technicalDebt": world.technical_debt,
        "deadlineWeeksLeft": world.deadline_weeks_left,
    }


def _get_decision_status(sim_id: str) -> dict:
    """Get decision tracking status for a simulation."""
    tracker = get_tracker(sim_id)
    leading = tracker.get_leading_proposal()
    return {
        "proposalCount": len(tracker.proposals),
        "hasDecision": tracker.decided_proposal is not None,
        "decidedProposal": tracker.decided_proposal.summary if tracker.decided_proposal else None,
        "leadingProposal": leading.summary if leading else None,
        "leadingSupport": round(leading.weighted_support, 1) if leading else 0,
        "escalationCount": tracker.escalation_count,
        "resignThreats": len(tracker.resign_threats),
    }


async def broadcast_message(sim_id: str, message: dict):
    message = enrich_system_message(message)
    """Broadcast a message to all connected WebSocket clients for a simulation."""
    connections = _ws_connections.get(sim_id, [])
    state = await get_simulation_state(sim_id)

    # Build agent states for the update
    agents_data = []
    if state:
        for a in state["agents"]:
            agents_data.append({
                "id": a.id,
                "name": f"{a.name} ({a.role})",
                "morale": a.state.morale,
                "stress": a.state.stress,
                "loyalty": a.state.loyalty,
                "productivity": a.state.productivity,
                "initials": a.initials or a.compute_initials(),
                "has_resigned": a.has_resigned,
            })

    metrics = compute_metrics(state["agents"]) if state else {}

    payload = {
        "type": "message",
        "data": message,
        "agents": agents_data,
        "metrics": metrics,
        "currentRound": state["current_round"] if state else 0,
        "totalRounds": state["total_rounds"] if state else 0,
        "status": state["status"].value if state and isinstance(state["status"], SimulationStatus) else "running",
        "worldState": _get_world_state_data(sim_id),
        "decisionStatus": _get_decision_status(sim_id),
        'interventions': get_public_interventions(state) if state else [],
        'control': {
            'status': (
                state['status'].value
                if state and isinstance(state['status'], SimulationStatus)
                else state.get('status', 'running') if state else 'running'
            ),
            'step_remaining': state.get('step_remaining', 0) if state else 0,
        },
    }

    dead = []
    for ws in connections:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)

    for ws in dead:
        connections.remove(ws)

    # Publish to Redis pub/sub for cross-worker broadcasting
    await state_manager.publish_ws_message(sim_id, payload)


async def broadcast_control_state(sim_id: str) -> None:
    '''Broadcast pause, resume, or step state without fabricating a message.'''
    state = await get_simulation_state(sim_id)
    if not state:
        return

    status = state.get('status', SimulationStatus.RUNNING)
    status_value = status.value if isinstance(status, SimulationStatus) else status
    payload = {
        'type': 'control',
        'control': {
            'status': status_value,
            'step_remaining': state.get('step_remaining', 0),
        },
        'interventions': get_public_interventions(state),
    }

    connections = _ws_connections.get(sim_id, [])
    dead = []
    for websocket in connections:
        try:
            await websocket.send_json(payload)
        except Exception:
            dead.append(websocket)
    for websocket in dead:
        connections.remove(websocket)

    await state_manager.publish_ws_message(sim_id, payload)


async def _run_simulation_background(sim_id: str):
    """
    Background task that runs all simulation rounds independently.
    Survives WebSocket disconnects — clients can reconnect and resume viewing.
    """
    consecutive_errors = 0
    max_consecutive_errors = 3

    try:
        while True:
            current_state = await get_simulation_state(sim_id)
            if not current_state:
                break
            status = current_state["status"]
            if (
                status == SimulationStatus.PAUSED
                or status == SimulationStatus.PAUSED.value
            ):
                await asyncio.sleep(0.1)
                continue
            if isinstance(status, SimulationStatus):
                if status == SimulationStatus.COMPLETED:
                    break
            elif status == "completed":
                break

            if current_state["current_round"] >= current_state["total_rounds"]:
                break

            try:
                await run_simulation_round(sim_id, ws_broadcast=broadcast_message)
                consecutive_errors = 0
            except Exception as e:
                consecutive_errors += 1
                logger.error(f"Round error in simulation {sim_id}: {e}")
                # Notify connected clients about the error
                connections = _ws_connections.get(sim_id, [])
                dead = []
                for ws in connections:
                    try:
                        await ws.send_json({
                            "type": "error",
                            "message": _public_round_error_message(current_state, e),
                        })
                    except Exception:
                        dead.append(ws)
                for ws in dead:
                    connections.remove(ws)

                if consecutive_errors >= max_consecutive_errors:
                    logger.error(f"Simulation {sim_id} aborted after {max_consecutive_errors} consecutive errors")
                    for ws in _ws_connections.get(sim_id, []):
                        try:
                            await ws.send_json({
                                "type": "error",
                                "message": "Simulation stopped due to repeated errors. Please try again."
                            })
                        except Exception:
                            pass
                    return

                await asyncio.sleep(2.0)
                continue

            await asyncio.sleep(1.0)

        # Only an engine-confirmed completed state may produce a completed
        # WebSocket event. Exhausted rounds can also result from a failed round.
        state = await get_simulation_state(sim_id)
        if not state:
            return

        completion_status = state["status"]
        if isinstance(completion_status, SimulationStatus):
            completion_status = completion_status.value
        if completion_status != SimulationStatus.COMPLETED.value:
            logger.warning(
                "Simulation %s stopped without a completed state; suppressing completion event",
                sim_id,
            )
            return

        metrics_history = get_metrics_history(sim_id)

        # Build outcome data from the last system message
        outcome_data = None
        if state:
            for msg in reversed(state.get("messages", [])):
                changes = msg.get("state_changes") or {}
                structured = (
                    changes.get("outcome")
                    if isinstance(changes, dict)
                    else None
                )
                if isinstance(structured, dict) and structured.get("title"):
                    outcome_data = structured
                    break
                content = msg.get("content", "")
                if "SIMULATION OUTCOME:" in content:
                    # Parse outcome from the message
                    lines = content.strip().split("\n")
                    title_line = ""
                    description = ""
                    emoji = ""
                    world_state_lines = []
                    in_world = False
                    for line in lines:
                        if "SIMULATION OUTCOME:" in line:
                            title_line = line.split("SIMULATION OUTCOME:")[-1].strip()
                            # Extract emoji (first character before the title)
                            parts = line.split("SIMULATION OUTCOME:")
                            prefix = parts[0].strip().replace("=", "").strip()
                            emoji = prefix if prefix else "📊"
                        elif "FINAL WORLD STATE:" in line:
                            in_world = True
                        elif in_world and line.strip():
                            world_state_lines.append(line.strip())
                        elif line.strip() and "=" not in line and "FINAL WORLD" not in line and title_line:
                            description += line.strip() + " "

                    outcome_data = {
                        "emoji": emoji,
                        "title": title_line,
                        "description": description.strip(),
                    }
                    break

        connections = _ws_connections.get(sim_id, [])
        dead = []
        for ws in connections:
            try:
                await ws.send_json({
                    "type": "completed",
                    "simulation_id": sim_id,
                    "outcome": outcome_data,
                    "metricsHistory": metrics_history,
                    "metrics": compute_metrics(state["agents"]) if state else {},
                    'interventions': get_public_interventions(state) if state else [],
                    'control': {
                        'status': 'completed',
                        'step_remaining': 0,
                    },
                })
            except Exception:
                dead.append(ws)
        for ws in dead:
            connections.remove(ws)

    except asyncio.CancelledError:
        logger.info(f"Simulation task {sim_id} was cancelled")
    except Exception as e:
        logger.error(f"Background simulation {sim_id} crashed: {e}")
    finally:
        _simulation_tasks.pop(sim_id, None)
        logger.info(f"Background simulation task for {sim_id} finished")


def _ensure_simulation_running(sim_id: str):
    """Start the background simulation task if not already running."""
    if sim_id in _simulation_tasks:
        task = _simulation_tasks[sim_id]
        if not task.done():
            return  # Already running
    # Start new background task
    task = asyncio.create_task(_run_simulation_background(sim_id))
    _simulation_tasks[sim_id] = task
    logger.info(f"Started background simulation task for {sim_id}")


# Per-WebSocket Redis subscriber tasks
_redis_subscriber_tasks: dict[int, asyncio.Task] = {}


async def _subscribe_redis_messages(sim_id: str, websocket: WebSocket):
    """Subscribe to Redis pub/sub and forward messages to a specific WebSocket.
    This enables cross-worker broadcasting when running multiple instances."""
    if not state_manager.is_available():
        return  # No Redis — no cross-worker broadcasting needed

    try:
        async for payload in state_manager.subscribe_ws_messages(sim_id):
            # Only forward if this message didn't originate from our own broadcast
            # (our own broadcast already sent directly to local connections)
            try:
                await websocket.send_json(payload)
            except Exception:
                break  # WebSocket disconnected
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.debug(f"Redis subscriber for sim {sim_id} stopped: {e}")


@router.websocket("/ws/simulation/{sim_id}")
async def simulation_websocket(websocket: WebSocket, sim_id: str):
    """
    WebSocket endpoint for streaming simulation events.
    On connect: sends current state, ensures simulation is running in background.
    Clients are pure viewers — disconnecting does NOT stop the simulation.
    """
    await websocket.accept()

    # Register connection
    if sim_id not in _ws_connections:
        _ws_connections[sim_id] = []
    _ws_connections[sim_id].append(websocket)

    try:
        state = await get_simulation_state(sim_id)
        if not state:
            await websocket.send_json({"type": "error", "message": "Simulation not found"})
            await websocket.close(code=1000, reason="Simulation not found")
            return

        # Send initial state
        agents_data = [
            {
                "id": a.id,
                "name": f"{a.name} ({a.role})",
                "morale": a.state.morale,
                "stress": a.state.stress,
                "loyalty": a.state.loyalty,
                "productivity": a.state.productivity,
                "initials": a.initials or a.compute_initials(),
                "has_resigned": a.has_resigned,
            }
            for a in state["agents"]
        ]

        current_status = state["status"].value if isinstance(state["status"], SimulationStatus) else state["status"]

        await websocket.send_json({
            "type": "init",
            "simulation_id": sim_id,
            "agents": agents_data,
            "messages": state["messages"],
            "currentRound": state["current_round"],
            "totalRounds": state["total_rounds"],
            "metrics": compute_metrics(state["agents"]),
            "status": current_status,
            "company": state["company"],
            **_runtime_metadata(state),
            "worldState": _get_world_state_data(sim_id),
            "decisionStatus": _get_decision_status(sim_id),
            "metricsHistory": get_metrics_history(sim_id),
            'interventions': get_public_interventions(state),
            'control': {
                'status': current_status,
                'step_remaining': state.get('step_remaining', 0),
            },
        })

        # Start background simulation if not yet running and not completed
        if current_status not in ("completed",):
            _ensure_simulation_running(sim_id)

        # Start Redis pub/sub subscriber for cross-worker messages
        subscriber_task = None
        if state_manager.is_available():
            subscriber_task = asyncio.create_task(
                _subscribe_redis_messages(sim_id, websocket)
            )
            _redis_subscriber_tasks[id(websocket)] = subscriber_task

        # Listen for client messages (interventions, controls)
        try:
            while True:
                data = await websocket.receive_text()
                msg = json.loads(data)

                if msg.get("type") == "intervene":
                    from models.schemas import InterventionType
                    from services.simulation_engine import process_intervention
                    intervention_type = InterventionType(msg.get("intervention_type", "custom"))
                    custom_msg = msg.get("custom_message")
                    await process_intervention(
                        sim_id, intervention_type, custom_msg,
                        ws_broadcast=broadcast_message,
                    )

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for simulation {sim_id} — simulation continues in background")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Cancel Redis subscriber task
        task = _redis_subscriber_tasks.pop(id(websocket), None)
        if task and not task.done():
            task.cancel()

        if sim_id in _ws_connections and websocket in _ws_connections[sim_id]:
            _ws_connections[sim_id].remove(websocket)
