"""
Decision Engine — tracks proposals, votes with hierarchy-weighted influence,
processes action consequences on the world state, and determines outcomes.

v2: Added power hierarchy weighting, action-consequence coupling, and
    world-state-aware outcome determination.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from data.world_state import (
    WorldState, get_role_influence, apply_action_to_world,
    apply_decision_to_world,
)

logger = logging.getLogger(__name__)


# ── Outcome definitions ───────────────────────────────────────────────

@dataclass
class SimulationOutcome:
    id: str
    emoji: str
    title: str
    description: str


OUTCOMES = {
    "team_triumph": SimulationOutcome(
        id="team_triumph",
        emoji="🏆",
        title="Team Triumph",
        description="The team united under pressure, made decisive choices, and overcame the crisis together. Morale held strong and no one was left behind.",
    ),
    "negotiated_settlement": SimulationOutcome(
        id="negotiated_settlement",
        emoji="🤝",
        title="Negotiated Settlement",
        description="Through heated debate and compromise, the team reached an agreement that most members could live with. Not everyone is happy, but the team survived.",
    ),
    "pyrrhic_victory": SimulationOutcome(
        id="pyrrhic_victory",
        emoji="⚡",
        title="Pyrrhic Victory",
        description="The crisis was addressed, but at a significant human cost. Key team members burned out or left, and the remaining team carries the scars.",
    ),
    "team_fracture": SimulationOutcome(
        id="team_fracture",
        emoji="💔",
        title="Team Fracture",
        description="The crisis exposed deep fault lines. The team splintered into factions, and too many members walked away. Recovery will be long and uncertain.",
    ),
    "total_collapse": SimulationOutcome(
        id="total_collapse",
        emoji="🔥",
        title="Total Collapse",
        description="The team disintegrated under the weight of the crisis. Everyone resigned or burned out. There is no team left to rebuild.",
    ),
    "stalemate": SimulationOutcome(
        id="stalemate",
        emoji="⏳",
        title="Stalemate",
        description="Weeks of discussion produced no clear decisions. The team talked in circles while the crisis deepened, unable to commit to any course of action.",
    ),
}


# ── Decision Tracker (per-simulation, in-memory) ─────────────────────

@dataclass
class Proposal:
    proposer: str            # agent name
    proposer_role: str       # agent role (for hierarchy weight)
    summary: str             # short description
    round_proposed: int
    supporters: list[str] = field(default_factory=list)
    supporter_roles: list[str] = field(default_factory=list)
    opponents: list[str] = field(default_factory=list)
    opponent_roles: list[str] = field(default_factory=list)

    @property
    def weighted_support(self) -> float:
        """Calculate hierarchy-weighted support score."""
        score = get_role_influence(self.proposer_role)  # Proposer counts
        for role in self.supporter_roles:
            score += get_role_influence(role)
        for role in self.opponent_roles:
            score -= get_role_influence(role)
        return score

    @property
    def net_support(self) -> int:
        """Simple head-count support (backward compatible)."""
        return len(self.supporters) - len(self.opponents)


@dataclass
class DecisionTracker:
    proposals: list[Proposal] = field(default_factory=list)
    decided_proposal: Proposal | None = None
    escalation_count: int = 0
    resign_threats: list[str] = field(default_factory=list)
    action_log: list[dict] = field(default_factory=list)

    def add_action(self, round_num: int, agent_name: str, agent_role: str,
                   action: str, detail: str = ""):
        self.action_log.append({
            "round": round_num,
            "agent": agent_name,
            "role": agent_role,
            "action": action,
            "detail": detail,
        })

    def get_leading_proposal(self) -> Proposal | None:
        """Return the proposal with the most weighted support, or None."""
        if not self.proposals:
            return None
        ranked = sorted(self.proposals, key=lambda p: p.weighted_support, reverse=True)
        if ranked[0].weighted_support > 0:
            return ranked[0]
        return None

    def get_decision_summary(self) -> str:
        """Human-readable summary of the current decision state."""
        if self.decided_proposal:
            p = self.decided_proposal
            return (
                f"DECIDED: \"{p.summary}\" (proposed by {p.proposer}, "
                f"supported by {', '.join(p.supporters) or 'none'}, "
                f"opposed by {', '.join(p.opponents) or 'none'})"
            )

        leading = self.get_leading_proposal()
        if leading:
            influence_note = ""
            proposer_influence = get_role_influence(leading.proposer_role)
            if proposer_influence >= 2.0:
                influence_note = f" — {leading.proposer}'s seniority gives this extra weight"
            return (
                f"LEADING PROPOSAL: \"{leading.summary}\" by {leading.proposer} "
                f"(weighted influence: {leading.weighted_support:.1f}){influence_note}"
            )

        if self.proposals:
            return f"OPEN DEBATE: {len(self.proposals)} proposals on the table, no consensus yet."

        return "NO PROPOSALS YET: The team hasn't proposed any concrete solutions."

    def get_action_consequences_summary(self) -> str:
        """Summarize what concrete actions have produced consequences."""
        if not self.action_log:
            return ""
        recent = self.action_log[-6:]
        lines = []
        for entry in recent:
            if entry["action"] not in ("do_nothing", "reflect", "assess_situation"):
                lines.append(
                    f"- {entry['agent']}: {entry['action']}"
                    + (f" — \"{entry['detail']}\"" if entry.get("detail") else "")
                )
        return "\n".join(lines) if lines else ""


# In-memory store of trackers by sim_id
_decision_trackers: dict[str, DecisionTracker] = {}


def get_tracker(sim_id: str) -> DecisionTracker:
    """Get or create a decision tracker for a simulation."""
    if sim_id not in _decision_trackers:
        _decision_trackers[sim_id] = DecisionTracker()
    return _decision_trackers[sim_id]


def process_agent_action(
    sim_id: str,
    round_num: int,
    agent_name: str,
    agent_role: str,
    action: str,
    detail: str = "",
    world: WorldState | None = None,
) -> str | None:
    """
    Process an agent's action, apply world consequences, and return
    a system message if a significant event occurred.
    """
    tracker = get_tracker(sim_id)
    tracker.add_action(round_num, agent_name, agent_role, action, detail)
    system_msg = None

    # ── Apply action consequences to world state ──────────────────
    world_changes = {}
    if world:
        world_changes = apply_action_to_world(world, action)
        if world_changes:
            logger.info(f"Action '{action}' by {agent_name} → world changes: {world_changes}")

    # ── Process specific actions ──────────────────────────────────
    if action == "propose_solution" and detail:
        tracker.proposals.append(Proposal(
            proposer=agent_name,
            proposer_role=agent_role,
            summary=detail,
            round_proposed=round_num,
        ))
        influence = get_role_influence(agent_role)
        weight_note = ""
        if influence >= 2.0:
            weight_note = f" (carries senior authority, influence weight: {influence:.1f})"
        elif influence <= 0.7:
            weight_note = " (junior voice — needs senior backing to pass)"
        system_msg = f"📋 {agent_name} has proposed: \"{detail}\"{weight_note}"

    elif action == "support_proposal":
        leading = tracker.get_leading_proposal()
        target = leading or (tracker.proposals[-1] if tracker.proposals else None)
        if target and agent_name not in target.supporters:
            target.supporters.append(agent_name)
            target.supporter_roles.append(agent_role)
            if agent_name in target.opponents:
                idx = target.opponents.index(agent_name)
                target.opponents.pop(idx)
                target.opponent_roles.pop(idx)

    elif action == "oppose_proposal":
        leading = tracker.get_leading_proposal()
        target = leading or (tracker.proposals[-1] if tracker.proposals else None)
        if target and agent_name not in target.opponents:
            target.opponents.append(agent_name)
            target.opponent_roles.append(agent_role)
            if agent_name in target.supporters:
                idx = target.supporters.index(agent_name)
                target.supporters.pop(idx)
                target.supporter_roles.pop(idx)
            # If a senior person opposes, it's notable
            if get_role_influence(agent_role) >= 2.0:
                system_msg = f"❌ {agent_name} (senior authority) opposes the current proposal."

    elif action == "escalate":
        tracker.escalation_count += 1
        if tracker.escalation_count >= 2:
            system_msg = "⬆️ Multiple team members have escalated to management. Leadership is now involved."

    elif action == "resign_threat":
        if agent_name not in tracker.resign_threats:
            tracker.resign_threats.append(agent_name)
            system_msg = f"⚠️ {agent_name} has hinted at resignation."

    elif action == "blame":
        system_msg = f"👉 {agent_name} is pointing fingers. Team tension is rising."

    # ── Check for decision (hierarchy-weighted threshold) ─────────
    if not tracker.decided_proposal:
        for proposal in tracker.proposals:
            # Weighted threshold: need 3.0+ weighted influence
            # (e.g., 1 Tech Lead + 1 Junior = 2.0 + 0.7 = 2.7, not enough)
            # (e.g., 1 Tech Lead + 1 Senior = 2.0 + 1.5 = 3.5, passes)
            if proposal.weighted_support >= 3.0:
                tracker.decided_proposal = proposal
                system_msg = (
                    f"✅ TEAM DECISION REACHED: \"{proposal.summary}\" "
                    f"(proposed by {proposal.proposer}, "
                    f"supported by {', '.join(proposal.supporters)}, "
                    f"weighted influence: {proposal.weighted_support:.1f})"
                )
                # Apply decision consequences to world
                if world:
                    apply_decision_to_world(world)
                break

    # ── Add world change note to system message ───────────────────
    if world_changes and not system_msg:
        change_parts = []
        for k, v in world_changes.items():
            label = k.replace("_", " ").title()
            sign = "+" if v > 0 else ""
            change_parts.append(f"{label}: {sign}{v}%")
        if change_parts:
            system_msg = f"📉 Impact of {agent_name}'s action: {', '.join(change_parts)}"

    return system_msg


def determine_outcome(
    sim_id: str,
    agents: list,
    total_rounds: int,
    current_round: int,
    world: WorldState | None = None,
) -> SimulationOutcome:
    """
    Determine the simulation outcome based on final agent states AND world state.
    """
    tracker = get_tracker(sim_id)

    active_agents = [a for a in agents if not a.has_resigned]
    resigned_count = sum(1 for a in agents if a.has_resigned)
    total_agents = len(agents)

    # Total collapse
    if not active_agents:
        return OUTCOMES["total_collapse"]

    avg_morale = sum(a.state.morale for a in active_agents) / len(active_agents)

    has_decision = tracker.decided_proposal is not None
    has_proposals = len(tracker.proposals) > 0

    # World state factors
    world_healthy = True
    if world:
        world_healthy = (
            world.budget_remaining > 20
            and world.customer_satisfaction > 30
            and world.company_reputation > 25
        )

    # Team fracture: >50% resigned or avg morale < 20
    if resigned_count > total_agents / 2 or avg_morale < 20:
        return OUTCOMES["team_fracture"]

    # Stalemate: no proposals and world is deteriorating
    if not has_proposals and current_round >= total_rounds:
        return OUTCOMES["stalemate"]

    # Team triumph: high morale, no resignations, decision, healthy world
    if avg_morale > 55 and resigned_count == 0 and has_decision and world_healthy:
        return OUTCOMES["team_triumph"]

    # Negotiated settlement: decision reached, acceptable state
    if has_decision and avg_morale > 35:
        return OUTCOMES["negotiated_settlement"]

    # Pyrrhic victory: some resolution but with casualties or world damage
    if (has_decision or has_proposals) and (resigned_count > 0 or not world_healthy):
        return OUTCOMES["pyrrhic_victory"]

    # Default fallbacks
    if avg_morale > 40:
        return OUTCOMES["negotiated_settlement"]

    return OUTCOMES["stalemate"]


def build_outcome_message(outcome: SimulationOutcome, world: WorldState | None = None) -> str:
    """Build the dramatic ending system message with world state summary."""
    msg = (
        f"\n{'='*50}\n"
        f"{outcome.emoji}  SIMULATION OUTCOME: {outcome.title.upper()}\n"
        f"{'='*50}\n\n"
        f"{outcome.description}\n"
    )

    if world:
        msg += (
            f"\n📊 FINAL WORLD STATE:\n"
            f"  Budget: {world.budget_remaining}% | "
            f"Customer Satisfaction: {world.customer_satisfaction}% | "
            f"Reputation: {world.company_reputation}% | "
            f"Team Capacity: {world.team_capacity}% | "
            f"Technical Debt: {world.technical_debt}%\n"
        )

    return msg


def cleanup_tracker(sim_id: str):
    """Remove the tracker when simulation is done (free memory)."""
    _decision_trackers.pop(sim_id, None)
