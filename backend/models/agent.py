"""
Agent state machine — handles state updates, critical event detection,
and intervention processing.
"""

from __future__ import annotations
from models.schemas import AgentFullState, StateChanges, InterventionType


def clamp(value: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, value))


def apply_state_changes(agent: AgentFullState, changes: StateChanges) -> AgentFullState:
    """Apply delta state changes to an agent, clamping to 0-100."""
    if agent.has_resigned:
        return agent

    if changes.morale is not None:
        agent.state.morale = clamp(agent.state.morale + changes.morale)
    if changes.stress is not None:
        agent.state.stress = clamp(agent.state.stress + changes.stress)
    if changes.loyalty is not None:
        agent.state.loyalty = clamp(agent.state.loyalty + changes.loyalty)
    if changes.productivity is not None:
        agent.state.productivity = clamp(agent.state.productivity + changes.productivity)

    # Derived effects
    # High stress reduces productivity
    if agent.state.stress > 80:
        agent.state.productivity = clamp(agent.state.productivity - 5)
    # Low morale reduces loyalty
    if agent.state.morale < 30:
        agent.state.loyalty = clamp(agent.state.loyalty - 3)

    return agent


def check_critical_events(agent: AgentFullState, current_round: int) -> str | None:
    """
    Check if the agent triggers a critical event.
    Returns a description string or None.
    """
    if agent.has_resigned:
        return None

    # Resignation: morale critically low + loyalty low
    if agent.state.morale <= 15 and agent.state.loyalty <= 25:
        agent.has_resigned = True
        agent.resigned_week = current_round
        return f"{agent.name} ({agent.role}) has submitted their resignation in Week {current_round}. Morale: {agent.state.morale}%, Loyalty: {agent.state.loyalty}%."

    # Burnout: stress critically high
    if agent.state.stress >= 95:
        agent.state.productivity = clamp(agent.state.productivity - 20)
        return f"{agent.name} ({agent.role}) has hit critical burnout. Stress: {agent.state.stress}%. Productivity has crashed."

    # Warning: approaching danger zone
    if agent.state.morale <= 25 and not agent.has_resigned:
        return f"⚠️ {agent.name} is approaching resignation threshold. Morale: {agent.state.morale}%."

    return None


def apply_intervention(agent: AgentFullState, intervention_type: InterventionType) -> StateChanges:
    """
    Calculate the state changes from a God Mode intervention.
    Returns the changes to apply.
    """
    if intervention_type == InterventionType.BONUS:
        return StateChanges(morale=15, stress=-5, loyalty=10, productivity=5)
    elif intervention_type == InterventionType.PIZZA:
        return StateChanges(morale=8, stress=-10, loyalty=5, productivity=3)
    elif intervention_type == InterventionType.CANCEL_OVERTIME:
        return StateChanges(morale=20, stress=-25, loyalty=15, productivity=-10)
    else:
        # Custom interventions get moderate positive effects
        return StateChanges(morale=10, stress=-8, loyalty=5, productivity=0)


def compute_initial_state(personality: dict) -> dict:
    """
    Compute initial agent state based on personality traits.
    Agents with low stress tolerance start more stressed, etc.
    """
    stress_tolerance = personality.get("stressTolerance", personality.get("stress_tolerance", 50))
    empathy = personality.get("empathy", 50)
    ambition = personality.get("ambition", 50)

    morale = clamp(60 + (empathy - 50) // 5)
    stress = clamp(40 - (stress_tolerance - 50) // 3)
    loyalty = clamp(65 + (100 - ambition) // 10)
    productivity = clamp(70 + ambition // 10)

    return {
        "morale": morale,
        "stress": stress,
        "loyalty": loyalty,
        "productivity": productivity,
    }
