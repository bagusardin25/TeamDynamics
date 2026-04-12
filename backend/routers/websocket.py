"""
WebSocket handler for real-time simulation streaming.
"""

from __future__ import annotations

import json
import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.simulation_engine import (
    get_simulation_state, run_simulation_round, compute_metrics,
)
from models.schemas import SimulationStatus

logger = logging.getLogger(__name__)
router = APIRouter()

# Active WebSocket connections per simulation
_ws_connections: dict[str, list[WebSocket]] = {}


async def broadcast_message(sim_id: str, message: dict):
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
    }

    dead = []
    for ws in connections:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)

    for ws in dead:
        connections.remove(ws)


@router.websocket("/ws/simulation/{sim_id}")
async def simulation_websocket(websocket: WebSocket, sim_id: str):
    """
    WebSocket endpoint for streaming simulation events.
    On connect: sends current state.
    Then runs rounds sequentially, streaming messages as they're generated.
    Supports receiving intervention commands from the client.
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

        await websocket.send_json({
            "type": "init",
            "simulation_id": sim_id,
            "agents": agents_data,
            "messages": state["messages"],
            "currentRound": state["current_round"],
            "totalRounds": state["total_rounds"],
            "metrics": compute_metrics(state["agents"]),
            "status": state["status"].value if isinstance(state["status"], SimulationStatus) else state["status"],
            "company": state["company"],
        })

        # Run simulation rounds
        async def run_rounds():
            consecutive_errors = 0
            max_consecutive_errors = 3

            while True:
                current_state = await get_simulation_state(sim_id)
                if not current_state:
                    break
                status = current_state["status"]
                if isinstance(status, SimulationStatus):
                    if status == SimulationStatus.COMPLETED:
                        break
                elif status == "completed":
                    break

                if current_state["current_round"] >= current_state["total_rounds"]:
                    break

                try:
                    await run_simulation_round(sim_id, ws_broadcast=broadcast_message)
                    consecutive_errors = 0  # Reset on success
                except Exception as e:
                    consecutive_errors += 1
                    logger.error(f"Round error in simulation {sim_id}: {e}")
                    # Notify clients about the error
                    try:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Round error: {str(e)}. Retrying..."
                        })
                    except Exception:
                        pass

                    if consecutive_errors >= max_consecutive_errors:
                        logger.error(f"Simulation {sim_id} aborted after {max_consecutive_errors} consecutive errors")
                        try:
                            await websocket.send_json({
                                "type": "error",
                                "message": "Simulation stopped due to repeated errors. Please try again."
                            })
                        except Exception:
                            pass
                        break

                    await asyncio.sleep(2.0)  # Wait before retrying
                    continue

                # Small pause between rounds
                await asyncio.sleep(1.0)

            # Send completion
            try:
                await websocket.send_json({
                    "type": "completed",
                    "simulation_id": sim_id,
                })
            except Exception:
                pass

        # Run rounds in background so we can still receive messages
        round_task = asyncio.create_task(run_rounds())

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
            logger.info(f"WebSocket disconnected for simulation {sim_id}")
        finally:
            round_task.cancel()
            try:
                await round_task
            except asyncio.CancelledError:
                pass

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if sim_id in _ws_connections and websocket in _ws_connections[sim_id]:
            _ws_connections[sim_id].remove(websocket)
