"""
Simulation Engine — the core orchestrator that runs simulation rounds,
manages agent interactions, and coordinates with the LLM service.

v2: Integrated with Decision Engine, Memory System, Round Agenda,
    and Outcome System for strategic realism.
"""

from __future__ import annotations

import uuid
import json
import asyncio
import logging
from datetime import datetime, timezone

from models.schemas import (
    CreateSimulationRequest, AgentFullState, AgentState, PersonalityTraits,
    StateChanges, SimulationStatus, InterventionType,
)
from models.agent import apply_state_changes, check_critical_events, apply_intervention, compute_initial_state
from models.database import (
    save_simulation, update_simulation_status, get_simulation,
    save_agent, update_agent_state, get_agents,
    save_message, get_messages,
    update_agent_memory, get_agent_memory,
)
from services.llm_service import generate_agent_response
from services.decision_engine import (
    get_tracker, process_agent_action, determine_outcome,
    build_outcome_message, cleanup_tracker,
)
from data.presets import CRISIS_SCENARIOS
from data.round_agenda import get_round_agenda

logger = logging.getLogger(__name__)

# In-memory store for active simulation state (for WebSocket streaming)
# The DB is the source of truth, but we cache here for fast access during a run.
_active_simulations: dict[str, dict] = {}


async def create_simulation(request: CreateSimulationRequest, user_id: str | None = None) -> str:
    """Create a new simulation and return its ID."""
    sim_id = str(uuid.uuid4())[:8]

    crisis_scenario = request.crisis.scenario.value
    crisis_desc = request.crisis.custom_description
    if not crisis_desc and crisis_scenario in CRISIS_SCENARIOS:
        crisis_desc = CRISIS_SCENARIOS[crisis_scenario]["description"]

    # Save to DB
    await save_simulation(
        sim_id=sim_id,
        company_name=request.company.name,
        company_culture=request.company.culture,
        crisis_scenario=crisis_scenario,
        crisis_description=crisis_desc,
        total_rounds=request.params.duration_weeks,
        pacing=request.params.pacing.value,
        user_id=user_id,
    )

    # Initialize agents
    agents_cache = []
    for agent_config in request.agents:
        personality_dict = agent_config.personality.model_dump(by_alias=True)
        initial_state = compute_initial_state(personality_dict)

        await save_agent(
            sim_id=sim_id,
            agent_id=agent_config.id,
            name=agent_config.name,
            role=agent_config.role,
            agent_type=agent_config.type,
            color=agent_config.color,
            personality=personality_dict,
            **initial_state,
        )

        agent_full = AgentFullState(
            id=agent_config.id,
            name=agent_config.name,
            role=agent_config.role,
            type=agent_config.type,
            color=agent_config.color,
            personality=agent_config.personality,
            state=AgentState(**initial_state),
            motivation=agent_config.motivation,
            expertise=agent_config.expertise,
            model=agent_config.model,
        )
        agent_full.initials = agent_full.compute_initials()
        agents_cache.append(agent_full)

    # Cache in memory for fast access
    _active_simulations[sim_id] = {
        "id": sim_id,
        "status": SimulationStatus.IDLE,
        "current_round": 0,
        "total_rounds": request.params.duration_weeks,
        "company": {"name": request.company.name, "culture": request.company.culture},
        "crisis_scenario": crisis_scenario,
        "crisis_description": crisis_desc,
        "agents": agents_cache,
        "messages": [],
        "pacing": request.params.pacing.value,
        "websockets": [],
    }

    return sim_id


async def get_simulation_state(sim_id: str) -> dict | None:
    """Get the current simulation state."""
    # Try in-memory cache first
    if sim_id in _active_simulations:
        return _active_simulations[sim_id]

    # Fall back to DB
    sim_data = await get_simulation(sim_id)
    if not sim_data:
        return None

    agents_db = await get_agents(sim_id)
    messages_db = await get_messages(sim_id)

    agents = []
    for a in agents_db:
        personality = json.loads(a["personality_json"])
        agent = AgentFullState(
            id=a["id"],
            name=a["name"],
            role=a["role"],
            type=a["type"],
            color=a.get("color"),
            personality=PersonalityTraits(**personality),
            state=AgentState(
                morale=a["morale"],
                stress=a["stress"],
                loyalty=a["loyalty"],
                productivity=a["productivity"],
            ),
            has_resigned=bool(a["has_resigned"]),
            resigned_week=a.get("resigned_week"),
        )
        agent.initials = agent.compute_initials()
        agents.append(agent)

    msgs = []
    for m in messages_db:
        sc = json.loads(m["state_changes_json"]) if m.get("state_changes_json") else None
        msgs.append({
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

    state = {
        "id": sim_id,
        "status": SimulationStatus(sim_data["status"]),
        "current_round": sim_data["current_round"],
        "total_rounds": sim_data["total_rounds"],
        "company": {"name": sim_data["company_name"], "culture": sim_data["company_culture"]},
        "crisis_scenario": sim_data["crisis_scenario"],
        "crisis_description": sim_data.get("crisis_description"),
        "agents": agents,
        "messages": msgs,
        "pacing": sim_data.get("pacing", "normal"),
        "websockets": [],
    }

    _active_simulations[sim_id] = state
    return state

async def _broadcast_typing(sim_id: str, agent: AgentFullState, ws_broadcast):
    """Broadcast a typing indicator for the given agent to all WebSocket clients."""
    from routers.websocket import _ws_connections
    connections = _ws_connections.get(sim_id, [])
    payload = {
        "type": "typing_start",
        "agent_name": f"{agent.name} ({agent.role})",
        "agent_id": agent.id,
    }
    dead = []
    for ws in connections:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connections.remove(ws)


async def run_simulation_round(sim_id: str, ws_broadcast=None) -> list[dict]:
    """
    Run a single simulation round. Each agent responds sequentially.
    Now includes: agenda injection, memory system, decision tracking, and outcome system.
    Returns list of new messages produced this round.
    """
    state = await get_simulation_state(sim_id)
    if not state:
        raise ValueError(f"Simulation {sim_id} not found")

    current_round = state["current_round"] + 1
    state["current_round"] = current_round
    state["status"] = SimulationStatus.RUNNING

    await update_simulation_status(sim_id, "running", current_round)

    new_messages = []
    company = state["company"]
    crisis = state.get("crisis_description", "Unknown crisis")
    crisis_scenario = state.get("crisis_scenario", "")

    # ── Get round agenda ──────────────────────────────────────────
    agenda = get_round_agenda(current_round, state["total_rounds"], crisis_scenario)

    # ── Get decision context ──────────────────────────────────────
    tracker = get_tracker(sim_id)
    decision_context = tracker.get_decision_summary()

    # ── Phase announcement (broadcast at phase transitions) ───────
    if current_round == 1:
        # Crisis announcement
        announcement = CRISIS_SCENARIOS.get(crisis_scenario, {}).get("announcement", f"🚨 Crisis: {crisis}")

        msg_id = await save_message(
            sim_id, current_round, None, None, "system",
            announcement, timestamp=datetime.now(timezone.utc).isoformat(),
        )
        system_msg = {
            "id": msg_id,
            "round": current_round,
            "agent_id": None,
            "agent_name": None,
            "type": "system",
            "content": announcement,
            "thought": None,
            "state_changes": None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        state["messages"].append(system_msg)
        new_messages.append(system_msg)

        if ws_broadcast:
            await ws_broadcast(sim_id, system_msg)

    # Phase transition announcement
    prev_agenda = get_round_agenda(max(1, current_round - 1), state["total_rounds"], crisis_scenario)
    if current_round > 1 and agenda["phase_id"] != prev_agenda["phase_id"]:
        phase_msg_content = f"📊 Phase Shift → {agenda['phase_name']}: {agenda['phase_description']}"
        phase_msg_id = await save_message(
            sim_id, current_round, None, None, "system",
            phase_msg_content, timestamp=datetime.now(timezone.utc).isoformat(),
        )
        phase_msg = {
            "id": phase_msg_id,
            "round": current_round,
            "agent_id": None,
            "agent_name": None,
            "type": "system",
            "content": phase_msg_content,
            "thought": None,
            "state_changes": None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        state["messages"].append(phase_msg)
        new_messages.append(phase_msg)
        if ws_broadcast:
            await ws_broadcast(sim_id, phase_msg)

    # ── Each agent responds ───────────────────────────────────────
    for agent in state["agents"]:
        if agent.has_resigned:
            continue

        # Build agent dict for LLM
        agent_dict = {
            "name": agent.name,
            "role": agent.role,
            "type": agent.type,
            "personality": agent.personality.model_dump(by_alias=True),
            "state": agent.state.model_dump(),
            "motivation": getattr(agent, "motivation", None) or "",
            "expertise": getattr(agent, "expertise", None) or "",
            "model": getattr(agent, "model", None),
        }

        # Broadcast typing indicator before LLM call
        if ws_broadcast:
            await _broadcast_typing(sim_id, agent, ws_broadcast)

        # Build conversation history for context
        conv_history = [
            {
                "type": m.get("type", "public"),
                "agent_name": m.get("agent_name", "System"),
                "content": m.get("content", ""),
            }
            for m in state["messages"][-15:]
        ]

        # ── Fetch agent memory ────────────────────────────────────
        try:
            raw_memory = await get_agent_memory(sim_id, agent.id)
            memory_list = json.loads(raw_memory) if raw_memory else []
            # Format as readable text (last 5 memories)
            memory_text = "\n".join(
                f"- Week {m.get('round', '?')}: {m.get('memory', '')}"
                for m in memory_list[-5:]
            ) if memory_list else ""
        except Exception:
            memory_text = ""
            memory_list = []

        # ── Call LLM ──────────────────────────────────────────────
        llm_response = await generate_agent_response(
            agent=agent_dict,
            company=company,
            crisis_description=crisis,
            round_num=current_round,
            total_rounds=state["total_rounds"],
            conversation_history=conv_history,
            memory=memory_text,
            agenda=agenda,
            decision_context=decision_context,
        )

        # ── Extract data ──────────────────────────────────────────
        public_msg = llm_response.get("public_message", "*stays silent*")
        internal_thought = llm_response.get("internal_thought", "...")
        raw_changes = llm_response.get("state_changes", {})
        memory_update = llm_response.get("memory_update", "")
        action = llm_response.get("action", "do_nothing")
        action_detail = llm_response.get("action_detail", "")

        state_changes = StateChanges(
            morale=raw_changes.get("morale", 0),
            stress=raw_changes.get("stress", 0),
            loyalty=raw_changes.get("loyalty", 0),
            productivity=raw_changes.get("productivity", 0),
        )

        # ── Apply state changes ───────────────────────────────────
        apply_state_changes(agent, state_changes)

        # ── Update DB agent state ─────────────────────────────────
        await update_agent_state(
            sim_id, agent.id,
            agent.state.morale, agent.state.stress,
            agent.state.loyalty, agent.state.productivity,
            agent.has_resigned, agent.resigned_week,
        )

        # ── Save memory ──────────────────────────────────────────
        if memory_update:
            memory_list.append({
                "round": current_round,
                "memory": memory_update,
            })
            # Keep only last 8 memories to prevent unbounded growth
            memory_list = memory_list[-8:]
            try:
                await update_agent_memory(sim_id, agent.id, json.dumps(memory_list))
            except Exception as e:
                logger.warning(f"Failed to save memory for {agent.name}: {e}")

        # ── Process action through Decision Engine ────────────────
        agent_display_name = f"{agent.name} ({agent.role})"
        decision_msg = process_agent_action(
            sim_id, current_round, agent_display_name, action, action_detail,
        )

        # ── Save public message ───────────────────────────────────
        changes_dict = {
            "morale": state_changes.morale,
            "stress": state_changes.stress,
            "loyalty": state_changes.loyalty,
            "productivity": state_changes.productivity,
        }

        msg_id = await save_message(
            sim_id, current_round, agent.id, agent_display_name,
            "public", public_msg, thought=internal_thought,
            state_changes=changes_dict,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

        agent_msg = {
            "id": msg_id,
            "round": current_round,
            "agent_id": agent.id,
            "agent_name": agent_display_name,
            "type": "public",
            "content": public_msg,
            "thought": internal_thought,
            "state_changes": changes_dict,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        state["messages"].append(agent_msg)
        new_messages.append(agent_msg)

        if ws_broadcast:
            await ws_broadcast(sim_id, agent_msg)

        # ── Broadcast decision engine events ──────────────────────
        if decision_msg:
            dec_msg_id = await save_message(
                sim_id, current_round, None, None, "system",
                decision_msg, timestamp=datetime.now(timezone.utc).isoformat(),
            )
            dec_sys_msg = {
                "id": dec_msg_id,
                "round": current_round,
                "agent_id": None,
                "agent_name": None,
                "type": "system",
                "content": decision_msg,
                "thought": None,
                "state_changes": None,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            state["messages"].append(dec_sys_msg)
            new_messages.append(dec_sys_msg)
            if ws_broadcast:
                await ws_broadcast(sim_id, dec_sys_msg)

            # Update decision context for next agent in this round
            decision_context = tracker.get_decision_summary()

        # ── Check for critical events ─────────────────────────────
        critical = check_critical_events(agent, current_round)
        if critical:
            crit_msg_id = await save_message(
                sim_id, current_round, agent.id, agent_display_name,
                "system", critical,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            crit_msg = {
                "id": crit_msg_id,
                "round": current_round,
                "agent_id": agent.id,
                "agent_name": agent_display_name,
                "type": "system",
                "content": critical,
                "thought": None,
                "state_changes": None,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            state["messages"].append(crit_msg)
            new_messages.append(crit_msg)

            if ws_broadcast:
                await ws_broadcast(sim_id, crit_msg)

            # Update DB if resigned
            if agent.has_resigned:
                await update_agent_state(
                    sim_id, agent.id,
                    agent.state.morale, agent.state.stress,
                    agent.state.loyalty, agent.state.productivity,
                    True, agent.resigned_week,
                )

        # Pacing delay between agent responses
        pacing_delay = {"slow": 3.0, "normal": 1.5, "fast": 0.5}
        await asyncio.sleep(pacing_delay.get(state.get("pacing", "normal"), 1.5))

    # ── Check simulation end conditions ───────────────────────────

    # Check if all agents resigned → immediate end
    active_agents = [a for a in state["agents"] if not a.has_resigned]
    if not active_agents:
        state["status"] = SimulationStatus.COMPLETED
        await update_simulation_status(sim_id, "completed", current_round)

        outcome = determine_outcome(sim_id, state["agents"], state["total_rounds"], current_round)
        outcome_msg = build_outcome_message(outcome)

        end_msg_id = await save_message(
            sim_id, current_round, None, None, "system",
            outcome_msg, timestamp=datetime.now(timezone.utc).isoformat(),
        )
        end_msg = {
            "id": end_msg_id, "round": current_round,
            "agent_id": None, "agent_name": None,
            "type": "system",
            "content": outcome_msg,
            "thought": None, "state_changes": None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        state["messages"].append(end_msg)
        new_messages.append(end_msg)
        if ws_broadcast:
            await ws_broadcast(sim_id, end_msg)

        cleanup_tracker(sim_id)
        return new_messages

    # Check if simulation reached final round
    if current_round >= state["total_rounds"]:
        state["status"] = SimulationStatus.COMPLETED
        await update_simulation_status(sim_id, "completed", current_round)

        # ── Determine and broadcast outcome ───────────────────────
        outcome = determine_outcome(sim_id, state["agents"], state["total_rounds"], current_round)
        outcome_msg = build_outcome_message(outcome)

        end_msg_id = await save_message(
            sim_id, current_round, None, None, "system",
            outcome_msg, timestamp=datetime.now(timezone.utc).isoformat(),
        )
        end_msg = {
            "id": end_msg_id, "round": current_round,
            "agent_id": None, "agent_name": None,
            "type": "system",
            "content": outcome_msg,
            "thought": None, "state_changes": None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        state["messages"].append(end_msg)
        new_messages.append(end_msg)
        if ws_broadcast:
            await ws_broadcast(sim_id, end_msg)

        cleanup_tracker(sim_id)

    return new_messages


async def process_intervention(sim_id: str, intervention_type: InterventionType,
                                custom_message: str | None = None,
                                ws_broadcast=None) -> dict:
    """Process a God Mode intervention."""
    state = await get_simulation_state(sim_id)
    if not state:
        raise ValueError(f"Simulation {sim_id} not found")

    current_round = state["current_round"]

    # Build announcement
    announcements = {
        InterventionType.BONUS: "💰 Management has announced a surprise bonus for the entire team!",
        InterventionType.PIZZA: "🍕 The company is throwing a team pizza party to boost morale!",
        InterventionType.CANCEL_OVERTIME: "🎉 Management has cancelled all mandatory overtime effective immediately!",
    }
    announcement = announcements.get(
        intervention_type,
        f"📢 Management Announcement: {custom_message or 'A new directive has been issued.'}"
    )

    # Save system message
    msg_id = await save_message(
        sim_id, current_round, None, None, "system",
        announcement, timestamp=datetime.now(timezone.utc).isoformat(),
    )
    sys_msg = {
        "id": msg_id, "round": current_round,
        "agent_id": None, "agent_name": None, "type": "system",
        "content": announcement, "thought": None, "state_changes": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    state["messages"].append(sys_msg)

    if ws_broadcast:
        await ws_broadcast(sim_id, sys_msg)

    # Apply intervention to all active agents
    for agent in state["agents"]:
        if agent.has_resigned:
            continue
        changes = apply_intervention(agent, intervention_type)
        apply_state_changes(agent, changes)
        await update_agent_state(
            sim_id, agent.id,
            agent.state.morale, agent.state.stress,
            agent.state.loyalty, agent.state.productivity,
        )

    return sys_msg


def compute_metrics(agents: list[AgentFullState]) -> dict:
    """Compute aggregate simulation metrics."""
    active = [a for a in agents if not a.has_resigned]
    if not active:
        return {"avgMorale": 0, "avgStress": 0, "productivity": 0, "resignations": len(agents)}

    avg_morale = sum(a.state.morale for a in active) // len(active)
    avg_stress = sum(a.state.stress for a in active) // len(active)
    productivity = sum(a.state.productivity for a in active) // len(active)
    resignations = sum(1 for a in agents if a.has_resigned)

    return {
        "avgMorale": avg_morale,
        "avgStress": avg_stress,
        "productivity": productivity,
        "resignations": resignations,
    }
