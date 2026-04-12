"""
Agent state machine — handles personality-weighted state updates,
critical event detection, and intervention processing.

KEY CHANGE: State changes are now modulated by personality traits,
so agents with different profiles respond differently to the same pressures.
"""

from __future__ import annotations
from models.schemas import AgentFullState, StateChanges, InterventionType


def clamp(value: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, value))


def _get_personality_multipliers(personality: dict) -> dict:
    """
    Compute personality-based multipliers for state change absorption.
    Returns a dict of multipliers that scale how much each stat changes.
    """
    stress_tolerance = personality.get("stressTolerance", personality.get("stress_tolerance", 50))
    empathy = personality.get("empathy", 50)
    ambition = personality.get("ambition", 50)
    agreeableness = personality.get("agreeableness", 50)
    assertiveness = personality.get("assertiveness", 50)

    # Stress multiplier: high tolerance = absorbs less stress
    # Range: 0.4 (very resilient, tolerance=100) to 1.6 (very fragile, tolerance=0)
    stress_mult = 1.6 - (stress_tolerance / 100) * 1.2

    # Morale resilience: high empathy + agreeableness = morale drops less from negativity
    # but also gains more from positive events
    morale_sensitivity = 0.7 + ((empathy + agreeableness) / 200) * 0.6

    # Productivity resilience: high ambition = productivity drops less
    # Range: 0.5 (very ambitious) to 1.2 (low ambition)
    productivity_mult = 1.2 - (ambition / 100) * 0.7

    # Loyalty stability: high agreeableness = loyalty changes less dramatically
    # Low assertiveness also means loyalty is more stable (less likely to rebel)
    loyalty_stability = 0.6 + ((agreeableness + (100 - assertiveness)) / 200) * 0.8

    return {
        "stress": round(stress_mult, 2),
        "morale": round(morale_sensitivity, 2),
        "productivity": round(productivity_mult, 2),
        "loyalty": round(loyalty_stability, 2),
    }


def apply_state_changes(agent: AgentFullState, changes: StateChanges) -> AgentFullState:
    """
    Apply delta state changes to an agent with personality-based weighting.
    Agents with different personalities absorb stress, morale hits, etc. differently.
    """
    if agent.has_resigned:
        return agent

    personality = agent.personality.model_dump(by_alias=True)
    mults = _get_personality_multipliers(personality)
    stress_tolerance = personality.get("stressTolerance", personality.get("stress_tolerance", 50))

    # Apply weighted changes
    if changes.morale is not None:
        # For negative morale changes, resilient agents lose less
        # For positive changes, empathetic agents gain more
        weighted = changes.morale
        if changes.morale < 0:
            weighted = int(changes.morale * mults["morale"])
        else:
            weighted = int(changes.morale * (2.0 - mults["morale"]))  # inverse for gains
        agent.state.morale = clamp(agent.state.morale + weighted)

    if changes.stress is not None:
        # Positive stress changes (stress increase) are multiplied by stress multiplier
        # Negative changes (stress relief) are amplified for high-tolerance agents
        weighted = changes.stress
        if changes.stress > 0:
            weighted = int(changes.stress * mults["stress"])
        else:
            # Stress relief is more effective for resilient people
            relief_mult = 1.0 + (stress_tolerance / 100) * 0.5
            weighted = int(changes.stress * relief_mult)
        agent.state.stress = clamp(agent.state.stress + weighted)

    if changes.loyalty is not None:
        weighted = int(changes.loyalty * mults["loyalty"])
        agent.state.loyalty = clamp(agent.state.loyalty + weighted)

    if changes.productivity is not None:
        weighted = changes.productivity
        if changes.productivity < 0:
            weighted = int(changes.productivity * mults["productivity"])
        else:
            weighted = changes.productivity  # Gains are unmodified
        agent.state.productivity = clamp(agent.state.productivity + weighted)

    # ── Natural recovery per round ────────────────────────────────
    # Agents naturally recover a small amount based on stress tolerance
    natural_stress_recovery = int(stress_tolerance / 100 * 4)  # 0–4 per round
    agent.state.stress = clamp(agent.state.stress - natural_stress_recovery)

    # Empathetic agents' morale stabilizes slightly toward baseline
    empathy = personality.get("empathy", 50)
    if empathy > 60 and agent.state.morale < 50:
        morale_recovery = int((empathy - 50) / 50 * 3)  # 0–3 per round
        agent.state.morale = clamp(agent.state.morale + morale_recovery)

    # ── Derived effects (reduced severity) ────────────────────────
    # High stress reduces productivity, but less for ambitious people
    if agent.state.stress > 80:
        penalty = int(3 * mults["productivity"])
        agent.state.productivity = clamp(agent.state.productivity - penalty)

    # Low morale reduces loyalty, but less for agreeable people
    if agent.state.morale < 30:
        penalty = int(2 * mults["loyalty"])
        agent.state.loyalty = clamp(agent.state.loyalty - penalty)

    return agent


def check_critical_events(agent: AgentFullState, current_round: int) -> str | None:
    """
    Check if the agent triggers a critical event.
    Thresholds are now personality-aware — resilient agents hold on longer.
    """
    if agent.has_resigned:
        return None

    personality = agent.personality.model_dump(by_alias=True)
    stress_tolerance = personality.get("stressTolerance", personality.get("stress_tolerance", 50))
    agreeableness = personality.get("agreeableness", 50)

    # Resignation threshold scales with personality
    # High agreeableness = holds on longer (more tolerant of bad conditions)
    morale_threshold = max(10, 15 - int(agreeableness / 25))  # 10–15
    loyalty_threshold = max(15, 25 - int(agreeableness / 20))  # 15–25

    if agent.state.morale <= morale_threshold and agent.state.loyalty <= loyalty_threshold:
        agent.has_resigned = True
        agent.resigned_week = current_round
        return (
            f"📩 {agent.name} ({agent.role}) has submitted their resignation in Week {current_round}. "
            f"Morale: {agent.state.morale}%, Loyalty: {agent.state.loyalty}%."
        )

    # Burnout threshold: high stress tolerance = higher burnout threshold
    burnout_threshold = 90 + int(stress_tolerance / 20)  # 90–95
    burnout_threshold = min(burnout_threshold, 98)

    if agent.state.stress >= burnout_threshold:
        penalty = int(15 * (1.5 - stress_tolerance / 100))  # 7–15
        agent.state.productivity = clamp(agent.state.productivity - penalty)
        return (
            f"🔥 {agent.name} ({agent.role}) has hit critical burnout. "
            f"Stress: {agent.state.stress}%. Productivity has dropped significantly."
        )

    # Warning: approaching danger zone
    warning_threshold = morale_threshold + 12  # ~22-27
    if agent.state.morale <= warning_threshold and not agent.has_resigned:
        return f"⚠️ {agent.name} is under severe pressure. Morale: {agent.state.morale}%."

    return None


def apply_intervention(agent: AgentFullState, intervention_type: InterventionType) -> StateChanges:
    """
    Calculate the state changes from a God Mode intervention.
    Effect intensity varies by personality — cynical agents benefit less.
    """
    personality = agent.personality.model_dump(by_alias=True)
    agreeableness = personality.get("agreeableness", 50)
    empathy = personality.get("empathy", 50)

    # Base effectiveness multiplier: cynical agents (low agreeableness) are less affected
    # Range: 0.5 (very cynical) to 1.3 (very receptive)
    effectiveness = 0.5 + (agreeableness / 100) * 0.8

    if intervention_type == InterventionType.BONUS:
        return StateChanges(
            morale=int(15 * effectiveness),
            stress=int(-5 * effectiveness),
            loyalty=int(10 * effectiveness),
            productivity=int(5 * effectiveness),
        )
    elif intervention_type == InterventionType.PIZZA:
        return StateChanges(
            morale=int(8 * effectiveness),
            stress=int(-10 * effectiveness),
            loyalty=int(5 * effectiveness),
            productivity=int(3 * effectiveness),
        )
    elif intervention_type == InterventionType.CANCEL_OVERTIME:
        return StateChanges(
            morale=int(20 * effectiveness),
            stress=int(-25 * effectiveness),
            loyalty=int(15 * effectiveness),
            productivity=int(-10 * (2.0 - effectiveness)),  # More productive people lose more
        )
    else:
        # Custom interventions
        return StateChanges(
            morale=int(10 * effectiveness),
            stress=int(-8 * effectiveness),
            loyalty=int(5 * effectiveness),
            productivity=0,
        )


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
