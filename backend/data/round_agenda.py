"""
Round Agenda System — defines the simulation phases and per-round agendas
that drive conversations toward concrete decisions and outcomes.
"""

from __future__ import annotations


# ── Simulation Phases ─────────────────────────────────────────────────
# Each simulation is divided into phases based on progression percentage.
# Phases define the *purpose* of each round so conversations aren't aimless.

SIMULATION_PHASES = [
    {
        "id": "shock",
        "name": "Crisis Impact",
        "range": (0.0, 0.15),       # First ~15% of rounds
        "description": "The crisis just hit. Team members react emotionally and assess the damage.",
        "agenda": (
            "The crisis has just been announced. React authentically based on your personality. "
            "Share your IMMEDIATE emotional reaction, then state what you think the biggest risk is. "
            "If you have relevant expertise, briefly mention it."
        ),
        "expected_actions": ["express_concern", "assess_situation", "rally_team"],
        "tone": "reactive, emotional, uncertain",
    },
    {
        "id": "debate",
        "name": "Strategy Debate",
        "range": (0.15, 0.35),       # ~15-35%
        "description": "Team members propose competing solutions and argue their merits.",
        "agenda": (
            "The team needs a concrete plan. You MUST either: "
            "(1) PROPOSE a specific solution with clear steps, or "
            "(2) SUPPORT or OPPOSE a proposal someone already made, explaining WHY. "
            "Do NOT just talk about feelings — push for a DECISION. "
            "Reference what was said in previous weeks."
        ),
        "expected_actions": ["propose_solution", "support_proposal", "oppose_proposal"],
        "tone": "argumentative, strategic, opinionated",
    },
    {
        "id": "decision",
        "name": "Decision Point",
        "range": (0.35, 0.50),       # ~35-50%
        "description": "The team must converge on a decision. Fence-sitters must pick a side.",
        "agenda": (
            "It's time to DECIDE. The team cannot keep debating forever. "
            "You MUST clearly state your position: what should the team do? "
            "If enough people agree on a plan, it becomes the team's decision. "
            "If you disagree with the majority, say so — but acknowledge the group's direction. "
            "Be concrete: WHO does WHAT by WHEN?"
        ),
        "expected_actions": ["support_proposal", "oppose_proposal", "negotiate", "escalate"],
        "tone": "decisive, urgent, committed",
    },
    {
        "id": "execution",
        "name": "Execution & Adaptation",
        "range": (0.50, 0.75),       # ~50-75%
        "description": "The team executes their decision and deals with consequences.",
        "agenda": (
            "The team is now executing the agreed plan (or dealing with the lack of one). "
            "Report on your progress and any obstacles you're facing. "
            "If the plan is working, say so. If it's failing, raise the alarm. "
            "React to how OTHER team members are handling their part. "
            "If someone is struggling, decide: help them or blame them?"
        ),
        "expected_actions": ["report_progress", "raise_alarm", "support_colleague", "blame"],
        "tone": "focused, stressed, accountability-driven",
    },
    {
        "id": "resolution",
        "name": "Resolution & Reflection",
        "range": (0.75, 1.0),        # ~75-100%
        "description": "The crisis nears resolution. Team reflects and decides their future.",
        "agenda": (
            "The situation is reaching its conclusion. Reflect on what happened: "
            "Was the team's approach right? Would you do it differently? "
            "Be honest about your state — are you staying or leaving? "
            "If morale is low, say what it would take for you to stay. "
            "If things went well, acknowledge the team's effort."
        ),
        "expected_actions": ["reflect", "commit_to_stay", "resign_threat", "acknowledge_team"],
        "tone": "reflective, honest, forward-looking",
    },
]


# ── Crisis-Specific Agenda Modifiers ──────────────────────────────────
# These inject crisis-specific discussion points into each phase.

CRISIS_AGENDA_MODIFIERS = {
    "rnd1": {  # Mandatory Weekend Coding
        "shock": "How does mandatory weekend work affect your personal life and mental health?",
        "debate": "Should the team push back collectively, or comply and negotiate for comp time?",
        "decision": "Will the team accept weekends, negotiate a counter-offer, or refuse?",
        "execution": "How is weekend work actually going? Is the deadline getting closer or is burnout killing velocity?",
        "resolution": "Was the sacrifice worth it? What boundaries need to be set going forward?",
    },
    "rnd2": {  # 30% Layoffs
        "shock": "Who might be cut? Are YOU at risk? How do you feel about having to choose who stays?",
        "debate": "What criteria should be used for layoffs? Performance? Seniority? Role criticality?",
        "decision": "Has management shared the list? How does the team react to the names?",
        "execution": "How does the team function with fewer people? Is the workload sustainable?",
        "resolution": "Has trust been restored? Are survivors committed or just waiting to leave?",
    },
    "rnd3": {  # CEO Resigns
        "shock": "What does this mean for the company's direction? Are projects still funded?",
        "debate": "Should the team keep working as normal, or start looking for exits?",
        "decision": "Does the team commit to staying through the transition, or is it every person for themselves?",
        "execution": "How is the power vacuum affecting daily work? Who is actually in charge?",
        "resolution": "Has a new leader emerged? Is there clarity on the company's future?",
    },
    "rnd4": {  # Database Deleted
        "shock": "How bad is the data loss? Is there a backup? Who is responsible?",
        "debate": "What's the recovery plan? Do we tell customers now or try to fix it first?",
        "decision": "Who leads the recovery effort? How do we split the work? Do we pull an all-nighter?",
        "execution": "How is the recovery going? Are there setbacks? Is the team holding together under pressure?",
        "resolution": "Was the data recovered? What post-mortem actions are needed? Who takes accountability?",
    },
}


# ── Available Actions ─────────────────────────────────────────────────

AVAILABLE_ACTIONS = {
    "propose_solution":   "Propose a concrete solution to the crisis",
    "support_proposal":   "Support and build on another team member's proposal",
    "oppose_proposal":    "Disagree with a proposal and explain why",
    "negotiate":          "Seek a compromise between competing proposals",
    "escalate":           "Escalate the issue to management / leadership",
    "rally_team":         "Try to boost team morale and unity",
    "express_concern":    "Voice concerns about the current situation",
    "assess_situation":   "Analyze the situation objectively using expertise",
    "report_progress":    "Report on progress of the current plan",
    "raise_alarm":        "Sound the alarm that something is going wrong",
    "support_colleague":  "Help or defend a struggling team member",
    "blame":              "Point fingers at who caused the problem",
    "resign_threat":      "Threaten or hint at resignation",
    "commit_to_stay":     "Express commitment to staying and fighting through",
    "reflect":            "Reflect on what went well and what didn't",
    "acknowledge_team":   "Acknowledge and appreciate the team's efforts",
    "do_nothing":         "Stay passive and avoid taking a position",
}


def get_current_phase(round_num: int, total_rounds: int) -> dict:
    """Get the current simulation phase based on round progression."""
    progress = round_num / total_rounds if total_rounds > 0 else 0

    for phase in SIMULATION_PHASES:
        lo, hi = phase["range"]
        if lo <= progress < hi:
            return phase

    # Default to last phase if at 100%
    return SIMULATION_PHASES[-1]


def get_round_agenda(
    round_num: int,
    total_rounds: int,
    crisis_scenario: str | None = None,
) -> dict:
    """
    Build the full agenda context for a given round.

    Returns dict with:
      - phase_name, phase_description, agenda, tone
      - crisis_modifier (extra discussion point)
      - expected_actions (list of action IDs)
      - available_action_descriptions (dict of id→description for the expected actions)
    """
    phase = get_current_phase(round_num, total_rounds)
    phase_id = phase["id"]

    # Crisis-specific modifier
    crisis_modifier = ""
    if crisis_scenario and crisis_scenario in CRISIS_AGENDA_MODIFIERS:
        crisis_modifier = CRISIS_AGENDA_MODIFIERS[crisis_scenario].get(phase_id, "")

    # Build action descriptions for expected actions
    expected = phase["expected_actions"]
    action_descs = {a: AVAILABLE_ACTIONS.get(a, a) for a in expected}

    return {
        "phase_id": phase_id,
        "phase_name": phase["name"],
        "phase_description": phase["description"],
        "agenda": phase["agenda"],
        "tone": phase["tone"],
        "crisis_modifier": crisis_modifier,
        "expected_actions": expected,
        "available_action_descriptions": action_descs,
    }
