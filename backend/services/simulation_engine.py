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
    StateChanges, SimulationStatus, InterventionType, InterventionRequest,
    InterventionCategory, InterventionTarget, InterventionTargetKind,
    SimulationControl,
)
from models.agent import apply_state_changes, check_critical_events, apply_intervention, compute_initial_state
from models.database import (
    save_simulation, update_simulation_status, get_simulation,
    save_agent, update_agent_state, get_agents,
    save_message, get_messages,
    update_agent_memory, get_agent_memory,
    save_world_state as db_save_world_state,
    get_world_state as db_get_world_state,
    save_metrics_history as db_save_metrics_history,
    get_metrics_history as db_get_metrics_history,
)
from services.llm_service import generate_agent_response
from services.demo_responses import get_demo_agent_response
from services.interventions import (
    apply_intervention_preview,
    build_demo_acknowledgement,
    build_intervention_preview,
    can_undo_intervention,
    public_intervention_receipt,
)
from services.demo_simulation import (
    build_demo_world_state,
    get_demo_round_event,
    wait_for_demo_typing_state,
)
from services.decision_engine import (
    get_tracker, get_tracker_with_restore, persist_tracker,
    process_agent_action, determine_outcome,
    build_outcome_message, cleanup_tracker,
)
from services import state_manager
from data.presets import CRISIS_SCENARIOS
from data.round_agenda import get_round_agenda
from data.world_state import (
    WorldState, create_world_state, tick_world_state,
    get_hierarchy_description, get_hidden_agenda,
    roll_random_event, apply_random_event_to_world,
    apply_resignation_to_world, cleanup_events,
    get_fired_events, set_fired_events,
)

logger = logging.getLogger(__name__)

# In-memory store for active simulation state (for WebSocket streaming)
_active_simulations: dict[str, dict] = {}

# In-memory world states per simulation
_world_states: dict[str, WorldState] = {}

# In-memory metrics history per simulation (for timeline charts)
_metrics_history: dict[str, list[dict]] = {}


async def create_simulation(
    request: CreateSimulationRequest,
    user_id: str | None = None,
    *,
    mode: str = "standard",
    runtime_model: str | None = None,
    strict_llm: bool = False,
) -> str:
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
        "mode": mode,
        "runtime_model": runtime_model,
        "strict_llm": strict_llm,
        "websockets": [],
        'interventions': [],
        'pending_intervention_id': None,
        'step_remaining': 0,
    }

    # Initialize world state for this simulation
    world = (
        build_demo_world_state()
        if mode == "demo"
        else create_world_state(crisis_scenario, request.params.duration_weeks)
    )
    _world_states[sim_id] = world

    # Persist initial world state to DB
    try:
        await db_save_world_state(sim_id, world.to_dict(), [])
    except Exception as e:
        logger.warning(f"Failed to persist initial world state for {sim_id}: {e}")

    # Sync to Redis (shared cache for horizontal scaling)
    await _sync_sim_to_redis(sim_id)

    return sim_id


def _serialize_sim_state(state: dict) -> dict:
    """Serialize a simulation state dict for Redis/JSON storage.
    Converts AgentFullState Pydantic models to plain dicts.
    Strips non-serializable fields (websockets)."""
    agents_data = []
    for a in state.get("agents", []):
        if hasattr(a, "model_dump"):
            d = a.model_dump(by_alias=True)
            d["initials"] = a.initials or a.compute_initials()
            d["has_resigned"] = a.has_resigned
            d["resigned_week"] = a.resigned_week
            agents_data.append(d)
        else:
            agents_data.append(a)  # Already a dict

    status = state.get("status")
    if hasattr(status, "value"):
        status = status.value

    return {
        "id": state["id"],
        "status": status,
        "current_round": state["current_round"],
        "total_rounds": state["total_rounds"],
        "company": state["company"],
        "crisis_scenario": state.get("crisis_scenario", ""),
        "crisis_description": state.get("crisis_description"),
        "agents": agents_data,
        "messages": state.get("messages", []),
        "pacing": state.get("pacing", "normal"),
        "mode": state.get("mode", "standard"),
        "runtime_model": state.get("runtime_model"),
        "strict_llm": state.get("strict_llm", False),
        'interventions': state.get('interventions', []),
        'pending_intervention_id': state.get('pending_intervention_id'),
        'step_remaining': state.get('step_remaining', 0),
    }


async def _sync_sim_to_redis(sim_id: str):
    """Sync current simulation state to Redis shared cache."""
    state = _active_simulations.get(sim_id)
    if not state:
        return
    try:
        serialized = _serialize_sim_state(state)
        await state_manager.set_sim_state(sim_id, serialized)
    except Exception as e:
        logger.debug(f"Redis sync failed for sim {sim_id}: {e}")


def _recover_interventions(messages: list[dict]) -> list[dict]:
    '''Recover public audit receipts embedded in intervention messages.'''
    recovered: list[dict] = []
    seen: set[str] = set()
    for message in messages:
        changes = message.get('state_changes') or {}
        receipt = changes.get('_intervention') if isinstance(changes, dict) else None
        if not isinstance(receipt, dict) or not receipt.get('id'):
            continue
        if receipt['id'] in seen:
            recovered = [item for item in recovered if item.get('id') != receipt['id']]
        recovered.append(dict(receipt))
        seen.add(receipt['id'])
    return recovered


async def get_simulation_state(sim_id: str) -> dict | None:
    """Get the current simulation state.
    Resolution order: local cache → Redis → PostgreSQL."""
    # Layer 1: Process-local cache (fast)
    if sim_id in _active_simulations:
        return _active_simulations[sim_id]

    # Layer 2: Redis shared cache (cross-worker)
    redis_state = await state_manager.get_sim_state(sim_id)
    if redis_state:
        # Reconstruct Pydantic models from the serialized state
        state = await _reconstruct_sim_state(redis_state)
        if state:
            _active_simulations[sim_id] = state
            # Also restore world state, tracker, metrics if not cached
            if sim_id not in _world_states:
                await _restore_world_state(sim_id, redis_state)
            if sim_id not in _metrics_history:
                await _restore_metrics_history(sim_id)
            return state

    # Layer 3: PostgreSQL (source of truth)
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

    interventions = _recover_interventions(msgs)
    pending = next(
        (
            item.get('id')
            for item in reversed(interventions)
            if item.get('status') == 'applied'
            and item.get('response_status') == 'pending'
        ),
        None,
    )

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
        "mode": "standard",
        "runtime_model": None,
        "strict_llm": False,
        "websockets": [],
        'interventions': interventions,
        'pending_intervention_id': pending,
        'step_remaining': 0,
    }

    _active_simulations[sim_id] = state

    # Also restore world state, decision tracker, and metrics if not cached
    if sim_id not in _world_states:
        await _restore_world_state(sim_id, sim_data)
    if sim_id not in _metrics_history:
        await _restore_metrics_history(sim_id)

    # Sync to Redis for other workers
    await _sync_sim_to_redis(sim_id)

    return state


async def _reconstruct_sim_state(data: dict) -> dict | None:
    """Reconstruct a full simulation state from serialized Redis data."""
    try:
        agents = []
        for a in data.get("agents", []):
            personality_data = a.get("personality", {})
            agent = AgentFullState(
                id=a["id"],
                name=a["name"],
                role=a["role"],
                type=a["type"],
                color=a.get("color"),
                personality=PersonalityTraits(**personality_data),
                state=AgentState(
                    morale=a.get("state", {}).get("morale", 70),
                    stress=a.get("state", {}).get("stress", 30),
                    loyalty=a.get("state", {}).get("loyalty", 70),
                    productivity=a.get("state", {}).get("productivity", 75),
                ),
                has_resigned=a.get("has_resigned", False),
                resigned_week=a.get("resigned_week"),
                motivation=a.get("motivation"),
                expertise=a.get("expertise"),
                model=a.get("model"),
            )
            agent.initials = a.get("initials") or agent.compute_initials()
            agents.append(agent)

        status_val = data.get("status", "idle")
        try:
            status = SimulationStatus(status_val)
        except ValueError:
            status = SimulationStatus.IDLE

        return {
            "id": data["id"],
            "status": status,
            "current_round": data.get("current_round", 0),
            "total_rounds": data.get("total_rounds", 12),
            "company": data.get("company", {}),
            "crisis_scenario": data.get("crisis_scenario", ""),
            "crisis_description": data.get("crisis_description"),
            "agents": agents,
            "messages": data.get("messages", []),
            "pacing": data.get("pacing", "normal"),
            "mode": data.get("mode", "standard"),
            "runtime_model": data.get("runtime_model"),
            "strict_llm": data.get("strict_llm", False),
            "websockets": [],
            'interventions': data.get('interventions', []),
            'pending_intervention_id': data.get('pending_intervention_id'),
            'step_remaining': data.get('step_remaining', 0),
        }
    except Exception as e:
        logger.warning(f"Failed to reconstruct sim state from Redis: {e}")
        return None


async def _restore_world_state(sim_id: str, sim_data: dict):
    """Restore world state from DB, or create a fresh one."""
    saved = await db_get_world_state(sim_id)
    if saved:
        _world_states[sim_id] = WorldState.from_dict(saved)
        # Restore fired events
        fired_json = saved.get("fired_events_json", "[]")
        if fired_json:
            import json as _json
            try:
                set_fired_events(sim_id, _json.loads(fired_json))
            except Exception:
                pass
        logger.info(f"🔄 Restored world state for simulation {sim_id} from DB")
    else:
        crisis_scenario = sim_data.get("crisis_scenario", "rnd1")
        total_rounds = sim_data.get("total_rounds", 12)
        _world_states[sim_id] = (
            build_demo_world_state()
            if sim_data.get("mode") == "demo"
            else create_world_state(crisis_scenario, total_rounds)
        )


async def _restore_metrics_history(sim_id: str):
    """Restore metrics history from DB."""
    saved_json = await db_get_metrics_history(sim_id)
    if saved_json:
        try:
            _metrics_history[sim_id] = json.loads(saved_json)
            logger.info(f"🔄 Restored metrics history for simulation {sim_id} from DB")
        except Exception:
            _metrics_history[sim_id] = []
    else:
        _metrics_history[sim_id] = []


async def _persist_round_state(sim_id: str):
    """Persist all in-memory state to DB and sync to Redis after each round."""
    try:
        # Persist world state + fired events to DB
        world = _world_states.get(sim_id)
        if world:
            fired = get_fired_events(sim_id)
            await db_save_world_state(sim_id, world.to_dict(), fired)
            # Sync world state to Redis
            await state_manager.set_world(sim_id, {**world.to_dict(), "fired_events": fired})

        # Persist decision tracker to DB + Redis
        await persist_tracker(sim_id)

        # Persist metrics history to DB + Redis
        history = _metrics_history.get(sim_id, [])
        if history:
            await db_save_metrics_history(sim_id, json.dumps(history))
            await state_manager.set_metrics(sim_id, history)

        # Sync full simulation state to Redis
        await _sync_sim_to_redis(sim_id)
    except Exception as e:
        logger.warning(f"Failed to persist round state for {sim_id}: {e}")

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


async def _base_resolve_agent_response(
    *,
    state: dict,
    agent: dict,
    round_num: int,
    exchange_num: int,
    llm_request: dict,
) -> dict:
    """Resolve a scripted demo turn or preserve the configured LLM path."""
    if state.get("mode") == "demo":
        logger.info(
            "Agent %s -> scripted demo response for round %s, exchange %s",
            agent["name"],
            round_num,
            exchange_num,
        )
        return get_demo_agent_response(agent, round_num, exchange_num)

    return await generate_agent_response(**llm_request)


def _pending_intervention(state: dict) -> dict | None:
    pending_id = state.get('pending_intervention_id')
    if not pending_id:
        return None
    return next(
        (
            record
            for record in state.get('interventions', [])
            if record.get('id') == pending_id
            and record.get('status') == 'applied'
            and record.get('response_status') == 'pending'
        ),
        None,
    )


def _attach_acknowledged_receipt(state: dict, changes: dict) -> dict:
    acknowledged_id = state.pop('_last_acknowledged_intervention', None)
    if not acknowledged_id:
        return changes
    record = next(
        (
            item
            for item in state.get('interventions', [])
            if item.get('id') == acknowledged_id
        ),
        None,
    )
    if record:
        changes['_intervention'] = public_intervention_receipt(record, state)
    return changes


async def _resolve_agent_response(
    *,
    state: dict,
    agent: dict,
    round_num: int,
    exchange_num: int,
    llm_request: dict,
) -> dict:
    record = _pending_intervention(state)
    request_with_context = dict(llm_request)
    if record and state.get('mode') != 'demo':
        request_with_context['intervention'] = (
            record['command']
            + ' (target: '
            + record['target']['label']
            + ')'
        )

    response = await _base_resolve_agent_response(
        state=state,
        agent=agent,
        round_num=round_num,
        exchange_num=exchange_num,
        llm_request=request_with_context,
    )
    if not record:
        return response

    acknowledgement = build_demo_acknowledgement(
        record,
        agent.get('name', 'The next agent'),
    )
    response = dict(response)
    response['public_message'] = (
        acknowledgement
        + ' '
        + response.get('public_message', '')
    ).strip()
    record['response_status'] = 'acknowledged'
    record['acknowledged_by'] = agent.get('name')
    state['pending_intervention_id'] = None
    state['_last_acknowledged_intervention'] = record['id']
    return response


def _resolve_round_event(
    *,
    state: dict,
    sim_id: str,
    current_round: int,
    crisis_scenario: str,
):
    """Use the coherent scripted event for demos and randomness elsewhere."""
    if state.get("mode") == "demo":
        return get_demo_round_event(current_round)
    return roll_random_event(sim_id, current_round, crisis_scenario)


async def _wait_for_agent_boundary(state: dict) -> None:
    while (
        _simulation_status_value(state) == SimulationStatus.PAUSED.value
        and state.get('step_remaining', 0) <= 0
    ):
        await asyncio.sleep(0.1)


async def run_simulation_round(sim_id: str, ws_broadcast=None) -> list[dict]:
    state_at_boundary = await get_simulation_state(sim_id)
    if (
        state_at_boundary
        and _simulation_status_value(state_at_boundary)
        == SimulationStatus.PAUSED.value
        and state_at_boundary.get('step_remaining', 0) <= 0
    ):
        return []
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
    # ── Get or restore decision tracker ────────────────────────────
    tracker = await get_tracker_with_restore(sim_id)
    decision_context = tracker.get_decision_summary()
    action_consequences = tracker.get_action_consequences_summary()

    # ── Get or create world state ─────────────────────────────────
    if sim_id not in _world_states:
        await _restore_world_state(sim_id, state)
    world = _world_states[sim_id]

    # Tick world state (deadline approaches, budget burns, etc.)
    if current_round > 1:
        tick_world_state(world)

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

    # ── Roll for random event ─────────────────────────────────────
    random_event = _resolve_round_event(
        state=state,
        sim_id=sim_id,
        current_round=current_round,
        crisis_scenario=crisis_scenario,
    )
    if random_event:
        apply_random_event_to_world(world, random_event)
        event_msg_content = f"🎲 UNEXPECTED EVENT: {random_event.name}\n{random_event.description}"
        event_msg_id = await save_message(
            sim_id, current_round, None, None, "system",
            event_msg_content, timestamp=datetime.now(timezone.utc).isoformat(),
        )
        event_msg = {
            "id": event_msg_id,
            "round": current_round,
            "agent_id": None,
            "agent_name": None,
            "type": "system",
            "content": event_msg_content,
            "thought": None,
            "state_changes": None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        state["messages"].append(event_msg)
        new_messages.append(event_msg)
        if ws_broadcast:
            await ws_broadcast(sim_id, event_msg)

        # Apply morale/stress effects to all active agents
        if random_event.morale_effect or random_event.stress_effect:
            event_changes = StateChanges(
                morale=random_event.morale_effect,
                stress=random_event.stress_effect,
            )
            for agent in state["agents"]:
                if not agent.has_resigned:
                    apply_state_changes(agent, event_changes)
                    await update_agent_state(
                        sim_id, agent.id,
                        agent.state.morale, agent.state.stress,
                        agent.state.loyalty, agent.state.productivity,
                        agent.has_resigned, agent.resigned_week,
                    )

    # ── Each agent responds ───────────────────────────────────────
    exchange_count = 2 if state.get("mode") == "demo" else 1
    agent_turns = [
        (exchange_num, agent)
        for exchange_num in range(1, exchange_count + 1)
        for agent in state["agents"]
    ]
    for exchange_num, agent in agent_turns:
        await _wait_for_agent_boundary(state)
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
            await wait_for_demo_typing_state(state.get("mode", "standard"))

        # Build conversation history for context (expanded window for better coherence)
        conv_history = [
            {
                "type": m.get("type", "public"),
                "agent_name": m.get("agent_name", "System"),
                "content": m.get("content", ""),
            }
            for m in state["messages"][-20:]
        ]

        # ── Fetch agent memory ────────────────────────────────────
        try:
            raw_memory = await get_agent_memory(sim_id, agent.id)
            memory_list = json.loads(raw_memory) if raw_memory else []
            # Format as readable text (last 8 memories for richer context)
            memory_text = "\n".join(
                f"- Week {m.get('round', '?')}: {m.get('memory', '')}"
                for m in memory_list[-8:]
            ) if memory_list else ""
        except Exception:
            memory_text = ""
            memory_list = []

        # ── Call LLM ──────────────────────────────────────────────
        llm_request = {
            "agent": agent_dict,
            "company": company,
            "crisis_description": crisis,
            "round_num": current_round,
            "total_rounds": state["total_rounds"],
            "conversation_history": conv_history,
            "memory": memory_text,
            "agenda": agenda,
            "decision_context": decision_context,
            "world_state_text": world.to_prompt_text(),
            "hierarchy_desc": get_hierarchy_description(agent.role),
            "hidden_agenda": get_hidden_agenda(agent.id),
            "action_consequences": action_consequences,
            "strict_llm": state.get("strict_llm", False),
        }
        llm_response = await _resolve_agent_response(
            state=state,
            agent=agent_dict,
            round_num=current_round,
            exchange_num=exchange_num,
            llm_request=llm_request,
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
            sim_id, current_round, agent_display_name, agent.role,
            action, action_detail, world=world,
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
            state_changes=_attach_acknowledged_receipt(state, changes_dict),
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
                # Resignation affects world state
                apply_resignation_to_world(world, len(state["agents"]))

        if state.get('step_remaining', 0) > 0:
            state['step_remaining'] -= 1
            if state['step_remaining'] == 0:
                state['status'] = SimulationStatus.PAUSED
                await update_simulation_status(
                    sim_id,
                    SimulationStatus.PAUSED.value,
                    state.get('current_round', 0),
                )
                await _sync_sim_to_redis(sim_id)

        # Pacing delay between agent responses
        pacing_delay = {"slow": 3.0, "normal": 1.5, "fast": 0.5}
        await asyncio.sleep(pacing_delay.get(state.get("pacing", "normal"), 1.5))

    # Record metrics snapshot for this round
    record_metrics_snapshot(sim_id, current_round, state["agents"])

    # ── Persist all in-memory state to DB ──────────────────────────
    await _persist_round_state(sim_id)

    # ── Check simulation end conditions ───────────────────────────

    # Check if all agents resigned → immediate end
    active_agents = [a for a in state["agents"] if not a.has_resigned]
    if not active_agents:
        state["status"] = SimulationStatus.COMPLETED
        await update_simulation_status(sim_id, "completed", current_round)

        outcome = determine_outcome(sim_id, state["agents"], state["total_rounds"], current_round, world)
        outcome_msg = build_outcome_message(outcome, world)

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
        cleanup_events(sim_id)
        # Final persist before cleanup of in-memory world state
        await _persist_round_state(sim_id)
        _world_states.pop(sim_id, None)
        return new_messages

    # Check if simulation reached final round
    if current_round >= state["total_rounds"]:
        state["status"] = SimulationStatus.COMPLETED
        await update_simulation_status(sim_id, "completed", current_round)

        # ── Determine and broadcast outcome ───────────────────────
        outcome = determine_outcome(sim_id, state["agents"], state["total_rounds"], current_round, world)
        outcome_msg = build_outcome_message(outcome, world)

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
        cleanup_events(sim_id)
        # Final persist before cleanup of in-memory world state
        await _persist_round_state(sim_id)
        _world_states.pop(sim_id, None)

    return new_messages


async def _legacy_process_intervention(sim_id: str, intervention_type: InterventionType,
                                custom_message: str | None = None,
                                ws_broadcast=None) -> dict:
    """Process a God Mode intervention."""
    state = await get_simulation_state(sim_id)
    if not state:
        raise ValueError(f"Simulation {sim_id} not found")

    current_round = state["current_round"]

    # Build announcement
    announcements = {
        InterventionType.BONUS: "GOD MODE: Management announced a surprise bonus for the entire team.",
        InterventionType.PIZZA: "GOD MODE: Management scheduled a team reset to boost morale.",
        InterventionType.CANCEL_OVERTIME: "GOD MODE: Management cancelled mandatory overtime effective immediately.",
    }
    announcement = announcements.get(
        intervention_type,
        f"GOD MODE: {custom_message or 'A new management directive has been issued.'}"
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


def _simulation_status_value(state: dict) -> str:
    status = state.get('status', SimulationStatus.IDLE)
    return status.value if hasattr(status, 'value') else str(status)


def _ensure_intervention_allowed(state: dict) -> None:
    if _simulation_status_value(state) == SimulationStatus.COMPLETED.value:
        raise ValueError('Completed simulations cannot be changed')


async def _intervention_world(sim_id: str, state: dict) -> WorldState:
    if sim_id not in _world_states:
        await _restore_world_state(sim_id, state)
    return _world_states[sim_id]


def get_public_interventions(state: dict) -> list[dict]:
    return [
        public_intervention_receipt(record, state)
        for record in state.get('interventions', [])
    ]


async def preview_intervention(
    sim_id: str,
    request: InterventionRequest,
) -> dict:
    state = await get_simulation_state(sim_id)
    if not state:
        raise ValueError('Simulation not found')
    _ensure_intervention_allowed(state)
    world = await _intervention_world(sim_id, state)
    return build_intervention_preview(state, world, request)


def _legacy_intervention_request(
    intervention_type: InterventionType,
    custom_message: str | None,
) -> InterventionRequest:
    category = {
        InterventionType.BONUS: InterventionCategory.RESOURCES,
        InterventionType.PIZZA: InterventionCategory.PEOPLE,
        InterventionType.CANCEL_OVERTIME: InterventionCategory.TIME_SCOPE,
        InterventionType.CUSTOM: InterventionCategory.PEOPLE,
    }[intervention_type]
    return InterventionRequest(
        type=intervention_type,
        custom_message=(
            custom_message or 'A new management directive has been issued.'
            if intervention_type == InterventionType.CUSTOM
            else None
        ),
        category=category,
        target=InterventionTarget(kind=InterventionTargetKind.ALL_TEAM),
        confirmed=True,
    )


async def _persist_intervention_state(
    sim_id: str,
    state: dict,
    world: WorldState,
) -> None:
    for agent in state.get('agents', []):
        await update_agent_state(
            sim_id,
            agent.id,
            agent.state.morale,
            agent.state.stress,
            agent.state.loyalty,
            agent.state.productivity,
            agent.has_resigned,
            agent.resigned_week,
        )
    await db_save_world_state(
        sim_id,
        world.to_dict(),
        get_fired_events(sim_id),
    )
    await state_manager.set_world(
        sim_id,
        {
            **world.to_dict(),
            'fired_events': get_fired_events(sim_id),
        },
    )
    await _sync_sim_to_redis(sim_id)


async def _save_intervention_message(
    sim_id: str,
    state: dict,
    record: dict,
    content: str,
    ws_broadcast=None,
) -> dict:
    receipt = public_intervention_receipt(record, state)
    changes = {'_intervention': receipt}
    timestamp = datetime.now(timezone.utc).isoformat()
    msg_id = await save_message(
        sim_id,
        state.get('current_round', 0),
        None,
        None,
        'system',
        content,
        state_changes=changes,
        timestamp=timestamp,
    )
    message = {
        'id': msg_id,
        'round': state.get('current_round', 0),
        'agent_id': None,
        'agent_name': None,
        'type': 'system',
        'content': content,
        'thought': None,
        'state_changes': changes,
        'timestamp': timestamp,
        'event': {
            'kind': 'intervention',
            'title': 'Management Intervention',
            'summary': content,
            'severity': 'warning',
            'effects': _intervention_event_effects(
                receipt.get('actual_effects', []),
            ),
        },
    }
    state.setdefault('messages', []).append(message)
    if ws_broadcast:
        await ws_broadcast(sim_id, message)
    return message


def _intervention_event_effects(effects: list[dict]) -> list[dict]:
    '''Map receipt effects to the compact typed event presentation contract.'''
    negative_metrics = {'stress', 'technical_debt'}
    presented = []
    for effect in effects:
        delta = effect.get('delta', 0)
        sign = '+' if delta > 0 else ''
        unit = '%' if effect.get('unit') == '%' else ' step'
        improves_state = (
            delta < 0
            if effect.get('key') in negative_metrics
            else delta > 0
        )
        tone = 'neutral' if delta == 0 else (
            'positive' if improves_state else 'negative'
        )
        presented.append({
            'label': (
                effect.get('scope_label', effect.get('scope', 'Target'))
                + ' · '
                + effect.get('label', effect.get('key', 'Effect'))
            ),
            'value': f'{sign}{delta}{unit}',
            'tone': tone,
        })
    return presented


async def process_intervention(
    sim_id: str,
    intervention_type: InterventionType | None = None,
    custom_message: str | None = None,
    ws_broadcast=None,
    *,
    request: InterventionRequest | None = None,
) -> dict:
    '''Apply a backend-authoritative preview and return its public receipt.'''
    state = await get_simulation_state(sim_id)
    if not state:
        raise ValueError('Simulation not found')
    _ensure_intervention_allowed(state)

    legacy = request is None
    if request is None:
        request = _legacy_intervention_request(
            intervention_type or InterventionType.CUSTOM,
            custom_message,
        )

    world = await _intervention_world(sim_id, state)
    preview = build_intervention_preview(state, world, request)
    if legacy:
        request.preview_token = preview['preview_token']
    if request.preview_token != preview['preview_token']:
        raise ValueError('Intervention preview is stale; preview again')
    if preview['confirmation_required'] and not request.confirmed:
        raise ValueError('This intervention requires explicit confirmation')

    record = apply_intervention_preview(state, world, preview)
    content = (
        'Management intervention applied: '
        + record['command']
        + ' — Target: '
        + record['target']['label']
        + '.'
    )
    await _persist_intervention_state(sim_id, state, world)
    await _save_intervention_message(
        sim_id,
        state,
        record,
        content,
        ws_broadcast,
    )
    await _sync_sim_to_redis(sim_id)
    return public_intervention_receipt(record, state)


async def undo_intervention(
    sim_id: str,
    intervention_id: str,
    ws_broadcast=None,
) -> dict:
    state = await get_simulation_state(sim_id)
    if not state:
        raise ValueError('Simulation not found')
    _ensure_intervention_allowed(state)
    record = next(
        (
            item
            for item in state.get('interventions', [])
            if item.get('id') == intervention_id
        ),
        None,
    )
    if not record or not can_undo_intervention(state, record):
        raise ValueError('Intervention can no longer be undone')

    world = await _intervention_world(sim_id, state)
    rollback = record.get('rollback', {})
    agents_by_id = {
        agent.id: agent
        for agent in state.get('agents', [])
    }
    for agent_id, snapshot in rollback.get('agents', {}).items():
        agent = agents_by_id.get(agent_id)
        if agent:
            agent.state = AgentState(**snapshot)
    for key, value in rollback.get('world', {}).items():
        setattr(world, key, value)

    record['status'] = 'undone'
    state['pending_intervention_id'] = None
    await _persist_intervention_state(sim_id, state, world)
    await _save_intervention_message(
        sim_id,
        state,
        record,
        'Management intervention undone: ' + record['command'] + '.',
        ws_broadcast,
    )
    await _sync_sim_to_redis(sim_id)
    return public_intervention_receipt(record, state)


async def control_simulation(
    sim_id: str,
    action: SimulationControl,
) -> dict:
    state = await get_simulation_state(sim_id)
    if not state:
        raise ValueError('Simulation not found')
    _ensure_intervention_allowed(state)

    if action == SimulationControl.PAUSE:
        state['status'] = SimulationStatus.PAUSED
        state['step_remaining'] = 0
    elif action == SimulationControl.STEP:
        state['status'] = SimulationStatus.RUNNING
        state['step_remaining'] = 1
    else:
        state['status'] = SimulationStatus.RUNNING
        state['step_remaining'] = 0

    await update_simulation_status(
        sim_id,
        state['status'].value,
        state.get('current_round', 0),
    )
    await _sync_sim_to_redis(sim_id)
    return {
        'status': state['status'].value,
        'step_remaining': state['step_remaining'],
    }


def compute_metrics(agents: list[AgentFullState]) -> dict:
    """Compute aggregate simulation metrics with enhanced data."""
    active = [a for a in agents if not a.has_resigned]
    if not active:
        return {
            "avgMorale": 0, "avgStress": 0, "productivity": 0,
            "resignations": len(agents), "avgLoyalty": 0, "teamCohesion": 0,
        }

    avg_morale = sum(a.state.morale for a in active) // len(active)
    avg_stress = sum(a.state.stress for a in active) // len(active)
    productivity = sum(a.state.productivity for a in active) // len(active)
    avg_loyalty = sum(a.state.loyalty for a in active) // len(active)
    resignations = sum(1 for a in agents if a.has_resigned)

    # Team cohesion: composite of loyalty, morale, and inverted stress dispersion
    morale_values = [a.state.morale for a in active]
    stress_values = [a.state.stress for a in active]
    morale_dispersion = max(morale_values) - min(morale_values) if len(morale_values) > 1 else 0
    stress_dispersion = max(stress_values) - min(stress_values) if len(stress_values) > 1 else 0
    alignment_score = max(0, 100 - (morale_dispersion + stress_dispersion) // 2)
    team_cohesion = (avg_loyalty + avg_morale + alignment_score) // 3

    return {
        "avgMorale": avg_morale,
        "avgStress": avg_stress,
        "productivity": productivity,
        "resignations": resignations,
        "avgLoyalty": avg_loyalty,
        "teamCohesion": team_cohesion,
    }


def record_metrics_snapshot(sim_id: str, round_num: int, agents: list[AgentFullState]):
    """Record a metrics snapshot for the timeline chart."""
    if sim_id not in _metrics_history:
        _metrics_history[sim_id] = []
    metrics = compute_metrics(agents)
    _metrics_history[sim_id].append({
        "round": round_num,
        "morale": metrics["avgMorale"],
        "stress": metrics["avgStress"],
        "productivity": metrics["productivity"],
        "loyalty": metrics["avgLoyalty"],
        "cohesion": metrics["teamCohesion"],
    })


def get_metrics_history(sim_id: str) -> list[dict]:
    """Get the metrics history timeline for a simulation."""
    return _metrics_history.get(sim_id, [])
