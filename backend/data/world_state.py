"""
World State — concrete simulation constraints (budget, deadline, capacity,
customer satisfaction) and random events that inject unpredictability.

The world state gives agents real data to base decisions on, and random
events force adaptive behavior by changing conditions mid-simulation.
"""

from __future__ import annotations

import random
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


# ── World State (per-simulation) ──────────────────────────────────────

@dataclass
class WorldState:
    """
    Concrete, measurable constraints that ground agent decisions in reality.
    All values are 0-100 percentages except deadline_weeks_left.
    """
    budget_remaining: int = 80          # % of original budget left
    deadline_weeks_left: int = 8        # weeks until hard deadline
    team_capacity: int = 100            # % of full team capacity (affected by resignations)
    customer_satisfaction: int = 75     # % customer satisfaction score
    technical_debt: int = 30            # % technical debt burden
    company_reputation: int = 70        # % public/industry reputation score

    def to_dict(self) -> dict:
        return {
            "budget_remaining": self.budget_remaining,
            "deadline_weeks_left": self.deadline_weeks_left,
            "team_capacity": self.team_capacity,
            "customer_satisfaction": self.customer_satisfaction,
            "technical_debt": self.technical_debt,
            "company_reputation": self.company_reputation,
        }

    def to_prompt_text(self) -> str:
        """Format world state as human-readable text for LLM prompt."""
        budget_status = "CRITICAL" if self.budget_remaining < 30 else "LOW" if self.budget_remaining < 50 else "OK"
        deadline_status = "URGENT" if self.deadline_weeks_left <= 2 else "TIGHT" if self.deadline_weeks_left <= 4 else "Normal"
        capacity_status = "UNDERSTAFFED" if self.team_capacity < 60 else "REDUCED" if self.team_capacity < 80 else "Full"

        return f"""WORLD STATE (real constraints — base your decisions on THESE numbers):
- Budget Remaining: {self.budget_remaining}% [{budget_status}]
- Deadline: {self.deadline_weeks_left} weeks left [{deadline_status}]
- Team Capacity: {self.team_capacity}% [{capacity_status}]
- Customer Satisfaction: {self.customer_satisfaction}%
- Technical Debt: {self.technical_debt}%
- Company Reputation: {self.company_reputation}%
NOTE: Any proposal must be FEASIBLE given these constraints. Don't propose hiring if budget is <30%. Don't propose long timelines if deadline is <3 weeks."""


def clamp(v: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, v))


# ── Initial World State per Crisis ────────────────────────────────────

CRISIS_INITIAL_WORLD_STATE: dict[str, dict] = {
    "rnd1": {  # Mandatory Weekend Coding
        "budget_remaining": 60,
        "deadline_weeks_left": 6,
        "team_capacity": 100,
        "customer_satisfaction": 65,
        "technical_debt": 45,
        "company_reputation": 70,
    },
    "rnd2": {  # 30% Layoffs
        "budget_remaining": 35,
        "deadline_weeks_left": 12,
        "team_capacity": 100,  # Will drop as layoffs happen
        "customer_satisfaction": 70,
        "technical_debt": 30,
        "company_reputation": 55,
    },
    "rnd3": {  # CEO Resigns
        "budget_remaining": 70,
        "deadline_weeks_left": 10,
        "team_capacity": 100,
        "customer_satisfaction": 60,
        "technical_debt": 25,
        "company_reputation": 40,
    },
    "rnd4": {  # Database Deleted
        "budget_remaining": 75,
        "deadline_weeks_left": 2,  # Emergency — very tight
        "team_capacity": 100,
        "customer_satisfaction": 30,
        "technical_debt": 60,
        "company_reputation": 45,
    },
}


def create_world_state(crisis_scenario: str, total_rounds: int) -> WorldState:
    """Create initial world state based on crisis scenario."""
    defaults = CRISIS_INITIAL_WORLD_STATE.get(crisis_scenario, {})
    ws = WorldState(**defaults)
    # Set deadline relative to simulation length if not crisis-specific
    if "deadline_weeks_left" not in defaults:
        ws.deadline_weeks_left = max(2, total_rounds - 2)
    return ws


# ── Action Consequences ───────────────────────────────────────────────
# Maps agent actions to concrete world state changes

ACTION_WORLD_EFFECTS: dict[str, dict] = {
    "propose_solution": {
        # Proposing costs nothing, but shows initiative
        "company_reputation": 1,
    },
    "support_proposal": {
        # Agreement builds momentum
        "company_reputation": 1,
    },
    "oppose_proposal": {
        # Opposition slows progress but may prevent bad decisions
        "technical_debt": -1,  # Less rushed = less debt
    },
    "escalate": {
        # Escalation draws management attention — can help or hurt
        "budget_remaining": -2,          # Management involvement costs money
        "company_reputation": -1,        # Signals disorganization
    },
    "rally_team": {
        # Boosting morale has indirect benefits
        "team_capacity": 2,
        "customer_satisfaction": 1,
    },
    "blame": {
        # Finger-pointing destroys trust and reputation
        "team_capacity": -3,
        "company_reputation": -2,
    },
    "resign_threat": {
        # Threats destabilize the team
        "team_capacity": -2,
        "company_reputation": -1,
    },
    "report_progress": {
        # Transparency improves satisfaction
        "customer_satisfaction": 2,
        "company_reputation": 1,
    },
    "raise_alarm": {
        # Alarms can be constructive or destructive
        "customer_satisfaction": -1,      # Signals problems
        "technical_debt": -2,             # But addresses them early
    },
    "support_colleague": {
        "team_capacity": 2,
    },
    "negotiate": {
        "budget_remaining": -1,           # Negotiations have costs
        "customer_satisfaction": 1,
    },
}

# When a team decision is reached, these bonus effects apply
DECISION_REACHED_EFFECTS = {
    "budget_remaining": -5,              # Executing a plan costs money
    "deadline_weeks_left": 0,            # Deadline doesn't change
    "customer_satisfaction": 5,          # Having a plan reassures customers
    "company_reputation": 3,            # Decisive teams look good
    "technical_debt": 3,                # Rushed execution adds debt
}


def apply_action_to_world(world: WorldState, action: str) -> dict[str, int]:
    """
    Apply an agent's action to the world state.
    Returns the changes applied (for logging).
    """
    effects = ACTION_WORLD_EFFECTS.get(action, {})
    changes = {}
    for key, delta in effects.items():
        if hasattr(world, key):
            old = getattr(world, key)
            if key == "deadline_weeks_left":
                new = max(0, old + delta)
            else:
                new = clamp(old + delta)
            setattr(world, key, new)
            changes[key] = delta
    return changes


def apply_decision_to_world(world: WorldState) -> dict[str, int]:
    """Apply the effects of a team decision being reached."""
    changes = {}
    for key, delta in DECISION_REACHED_EFFECTS.items():
        if hasattr(world, key):
            old = getattr(world, key)
            if key == "deadline_weeks_left":
                new = max(0, old + delta)
            else:
                new = clamp(old + delta)
            setattr(world, key, new)
            changes[key] = delta
    return changes


def apply_resignation_to_world(world: WorldState, total_agents: int):
    """Reduce team capacity when someone resigns."""
    if total_agents > 0:
        capacity_loss = int(100 / total_agents)
        world.team_capacity = clamp(world.team_capacity - capacity_loss)
        world.company_reputation = clamp(world.company_reputation - 3)


def tick_world_state(world: WorldState):
    """
    Per-round world state decay — called each round to simulate time passing.
    Deadlines approach, technical debt creeps up, etc.
    """
    world.deadline_weeks_left = max(0, world.deadline_weeks_left - 1)
    world.budget_remaining = clamp(world.budget_remaining - 2)  # Burn rate
    world.technical_debt = clamp(world.technical_debt + 1)       # Creep


# ── Random Events ─────────────────────────────────────────────────────

@dataclass
class RandomEvent:
    id: str
    name: str
    description: str
    probability: float           # 0.0 to 1.0, chance per round
    world_effects: dict          # changes to world state
    morale_effect: int = 0       # applied to ALL active agents
    stress_effect: int = 0       # applied to ALL active agents
    min_round: int = 2           # Don't fire on round 1
    one_shot: bool = True        # Only fire once per simulation
    crisis_filter: list[str] | None = None  # Only trigger for these crises (None = all)


RANDOM_EVENTS = [
    # ── Negative Events ───────────────────────────────────────────
    RandomEvent(
        id="client_threatens_leave",
        name="Key Client Threatens to Leave",
        description="Your biggest client just sent an email threatening to switch to a competitor unless service quality improves immediately.",
        probability=0.15,
        world_effects={"customer_satisfaction": -10, "company_reputation": -5, "budget_remaining": -3},
        morale_effect=-5,
        stress_effect=8,
        min_round=3,
    ),
    RandomEvent(
        id="competitor_poaches",
        name="Competitor Poaching Attempt",
        description="A top competitor has reached out to several team members with lucrative job offers. The team is aware and it's fueling anxiety.",
        probability=0.12,
        world_effects={"team_capacity": -5, "company_reputation": -3},
        morale_effect=-8,
        stress_effect=6,
        min_round=4,
    ),
    RandomEvent(
        id="budget_cut_further",
        name="Additional Budget Cuts Announced",
        description="Finance has announced another round of cuts. Operating budget reduced by an additional 15%. Non-essential spending frozen.",
        probability=0.10,
        world_effects={"budget_remaining": -15},
        morale_effect=-6,
        stress_effect=5,
        min_round=3,
    ),
    RandomEvent(
        id="security_breach",
        name="Minor Security Incident Detected",
        description="The security team flagged a minor data exposure. No customer data leaked, but it requires immediate attention and disclosure.",
        probability=0.08,
        world_effects={"company_reputation": -8, "customer_satisfaction": -5, "technical_debt": 5},
        morale_effect=-3,
        stress_effect=10,
        min_round=4,
    ),
    RandomEvent(
        id="negative_press",
        name="Negative Press Coverage",
        description="A tech blog published an article titled 'Is [Company] Falling Apart?' citing anonymous employee sources. It's trending on social media.",
        probability=0.10,
        world_effects={"company_reputation": -12, "customer_satisfaction": -5},
        morale_effect=-7,
        stress_effect=5,
        min_round=5,
    ),
    # ── Positive Events ───────────────────────────────────────────
    RandomEvent(
        id="investor_confidence",
        name="Investor Shows Renewed Confidence",
        description="A key investor publicly praised the team's handling of the situation and hinted at additional funding if performance improves.",
        probability=0.12,
        world_effects={"budget_remaining": 8, "company_reputation": 5},
        morale_effect=6,
        stress_effect=-4,
        min_round=4,
    ),
    RandomEvent(
        id="customer_praise",
        name="Major Customer Sends Praise",
        description="Your top enterprise customer sent a personal note to the team, praising them for their transparency during the crisis.",
        probability=0.10,
        world_effects={"customer_satisfaction": 8, "company_reputation": 3},
        morale_effect=5,
        stress_effect=-3,
        min_round=3,
    ),
    RandomEvent(
        id="media_positive",
        name="Positive Media Coverage",
        description="A respected industry analyst wrote about how the team is handling adversity with integrity. The article is gaining traction.",
        probability=0.08,
        world_effects={"company_reputation": 10, "customer_satisfaction": 3},
        morale_effect=4,
        stress_effect=-2,
        min_round=5,
    ),
    RandomEvent(
        id="old_backup_found",
        name="Critical Resource Discovered",
        description="The team discovered an overlooked resource — an old backup, an unused budget line, or a forgotten vendor credit — that could help.",
        probability=0.10,
        world_effects={"budget_remaining": 5, "technical_debt": -5},
        morale_effect=3,
        stress_effect=-3,
        min_round=3,
        crisis_filter=["rnd4"],  # Especially relevant for DB deletion
    ),
    # ── Neutral/Mixed Events ─────────────────────────────────────
    RandomEvent(
        id="board_meeting_called",
        name="Emergency Board Meeting Called",
        description="The board has called an emergency meeting to review the situation. The team will need to prepare a status report by end of week.",
        probability=0.12,
        world_effects={"company_reputation": -2},
        morale_effect=-3,
        stress_effect=7,
        min_round=3,
    ),
    RandomEvent(
        id="new_regulation",
        name="New Industry Regulation Announced",
        description="A new compliance regulation that affects the product has been announced. It adds complexity but also creates market opportunity.",
        probability=0.08,
        world_effects={"technical_debt": 8, "customer_satisfaction": -3},
        morale_effect=-2,
        stress_effect=4,
        min_round=4,
    ),
]


# In-memory tracking of which events have fired per simulation
_fired_events: dict[str, set[str]] = {}


def roll_random_event(
    sim_id: str,
    current_round: int,
    crisis_scenario: str,
) -> RandomEvent | None:
    """
    Roll for a random event this round. Returns the event if one triggers, else None.
    At most one event fires per round.
    """
    if sim_id not in _fired_events:
        _fired_events[sim_id] = set()

    eligible = [
        e for e in RANDOM_EVENTS
        if current_round >= e.min_round
        and (not e.one_shot or e.id not in _fired_events[sim_id])
        and (e.crisis_filter is None or crisis_scenario in e.crisis_filter)
    ]

    # Shuffle to avoid bias toward events listed first
    random.shuffle(eligible)

    for event in eligible:
        if random.random() < event.probability:
            _fired_events[sim_id].add(event.id)
            return event

    return None


def apply_random_event_to_world(world: WorldState, event: RandomEvent):
    """Apply a random event's world effects."""
    for key, delta in event.world_effects.items():
        if hasattr(world, key):
            old = getattr(world, key)
            if key == "deadline_weeks_left":
                new = max(0, old + delta)
            else:
                new = clamp(old + delta)
            setattr(world, key, new)


def cleanup_events(sim_id: str):
    """Remove event tracking when simulation ends."""
    _fired_events.pop(sim_id, None)


# ── Power Hierarchy ───────────────────────────────────────────────────
# Maps role keywords to influence weight for decision-making

ROLE_HIERARCHY: dict[str, float] = {
    # C-Suite (weight 3.0)
    "ceo": 3.0, "cto": 3.0, "cfo": 3.0, "coo": 3.0, "chief": 3.0,
    # VP / Director level (weight 2.5)
    "vp": 2.5, "vice president": 2.5, "director": 2.5,
    # Lead / Manager level (weight 2.0)
    "lead": 2.0, "manager": 2.0, "head": 2.0, "principal": 2.0,
    # Senior level (weight 1.5)
    "senior": 1.5, "sr": 1.5, "staff": 1.5, "architect": 1.5,
    # Standard level (weight 1.0) — default
    # Junior / Intern (weight 0.7)
    "junior": 0.7, "jr": 0.7, "intern": 0.7, "associate": 0.8, "entry": 0.7,
}


def get_role_influence(role: str) -> float:
    """
    Determine an agent's influence weight based on their role title.
    Higher weight = more impact on team decisions.
    """
    role_lower = role.lower()
    for keyword, weight in ROLE_HIERARCHY.items():
        if keyword in role_lower:
            return weight
    return 1.0  # Default: standard level


def get_hierarchy_description(role: str) -> str:
    """Get a human-readable description of someone's position in the hierarchy."""
    influence = get_role_influence(role)
    if influence >= 3.0:
        return "EXECUTIVE — your words carry enormous weight. Your decision can override others."
    elif influence >= 2.5:
        return "SENIOR LEADERSHIP — you have significant authority. People look to you for direction."
    elif influence >= 2.0:
        return "TEAM LEAD — you have authority over your domain. Your opinion shapes the team's direction."
    elif influence >= 1.5:
        return "EXPERIENCED — your experience is respected. People value your technical judgment."
    elif influence <= 0.7:
        return "JUNIOR — you have less formal authority but your perspective still matters. You need allies to push ideas through."
    else:
        return "INDIVIDUAL CONTRIBUTOR — you have equal voice in discussions but no direct authority."


# ── Hidden Agendas ────────────────────────────────────────────────────

# Default hidden agendas mapped to agent types/roles for preset agents
PRESET_HIDDEN_AGENDAS: dict[str, str] = {
    "preset-1": (  # Alex — Tech Lead
        "You secretly want to use this crisis to push for a promotion to VP of Engineering. "
        "You're angling to look like the hero who saved the project. "
        "This colors your decisions — you prefer solutions that showcase YOUR leadership, "
        "even if they're not optimal for the team. You subtly undermine proposals that would "
        "make someone else look like the hero."
    ),
    "preset-2": (  # Sam — Junior Dev
        "You've been secretly interviewing at other companies. This crisis is making you think "
        "about leaving, but you also see it as a chance to prove yourself and get promoted fast. "
        "You want visible, impressive tasks. You avoid grunt work. "
        "Your hidden goal: build an impressive story for your resume, whether you stay or leave."
    ),
    "preset-3": (  # Jordan — Product Manager
        "You care deeply about the team, but you also have a secret: you promised a key customer "
        "a feature delivery timeline that's now impossible. You're trying to manage this quietly "
        "without anyone finding out. You steer conversations away from customer commitments "
        "and push for solutions that cover your promise, even if they add extra work for the team."
    ),
    "preset-4": (  # Casey — Senior Dev
        "You don't want more responsibility — period. You've seen what happened to the last "
        "person who stepped up (burned out and quit). Your hidden agenda is to stay under the radar, "
        "do your job well, and go home at 5pm. You subtly resist any proposal that increases "
        "your workload, even if it's the right thing. You'll support whoever keeps things calm."
    ),
}

# Generic hidden agendas for custom agents (assigned randomly)
GENERIC_HIDDEN_AGENDAS = [
    (
        "You secretly believe the company is going to fail no matter what. "
        "You're staying only to collect your paycheck while you look for exits. "
        "You appear cooperative but avoid personal risk."
    ),
    (
        "You have a personal rivalry with the most senior person on the team. "
        "You want their decisions to fail so you can position yourself as the better leader. "
        "You subtly steer conversations to highlight their mistakes."
    ),
    (
        "You have a secret deal with a manager outside this team who promised you "
        "a lateral transfer if you help the crisis blow over quietly. "
        "You push for 'safe' solutions and avoid anything that makes waves."
    ),
    (
        "You're idealistic and believe this crisis happened because management is corrupt. "
        "Your hidden goal is to push the team toward collective action against management, "
        "like refusing mandates or writing a formal complaint. You frame everything as us-vs-them."
    ),
    (
        "You're the informal information broker. You know things about colleagues' performance "
        "issues that haven't been made public. You may leak information strategically to gain "
        "influence or protect allies. You value being 'in the know' above all."
    ),
    (
        "You secretly want to start your own company. You see this crisis as validation "
        "that startups would be better run. You're mentally half-checked-out but perform "
        "just enough to not get noticed. You hoard skills and knowledge."
    ),
]


def get_hidden_agenda(agent_id: str) -> str:
    """Get a hidden agenda for an agent (preset or random)."""
    if agent_id in PRESET_HIDDEN_AGENDAS:
        return PRESET_HIDDEN_AGENDAS[agent_id]
    # Deterministic selection based on agent_id hash for consistency
    idx = hash(agent_id) % len(GENERIC_HIDDEN_AGENDAS)
    return GENERIC_HIDDEN_AGENDAS[idx]
