"""
Decision Engine — tracks proposals, votes, team decisions,
and determines simulation outcomes.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

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
    summary: str             # short description
    round_proposed: int
    supporters: list[str] = field(default_factory=list)
    opponents: list[str] = field(default_factory=list)

    @property
    def net_support(self) -> int:
        return len(self.supporters) - len(self.opponents)


@dataclass
class DecisionTracker:
    proposals: list[Proposal] = field(default_factory=list)
    decided_proposal: Proposal | None = None
    escalation_count: int = 0
    resign_threats: list[str] = field(default_factory=list)  # agent names who threatened
    action_log: list[dict] = field(default_factory=list)     # chronological action log

    def add_action(self, round_num: int, agent_name: str, action: str, detail: str = ""):
        self.action_log.append({
            "round": round_num,
            "agent": agent_name,
            "action": action,
            "detail": detail,
        })

    def get_leading_proposal(self) -> Proposal | None:
        """Return the proposal with the most net support, or None."""
        if not self.proposals:
            return None
        ranked = sorted(self.proposals, key=lambda p: p.net_support, reverse=True)
        if ranked[0].net_support > 0:
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
            return (
                f"LEADING PROPOSAL: \"{leading.summary}\" by {leading.proposer} "
                f"(+{len(leading.supporters)} support, -{len(leading.opponents)} opposition)"
            )

        if self.proposals:
            return f"OPEN DEBATE: {len(self.proposals)} proposals on the table, no consensus yet."

        return "NO PROPOSALS YET: The team hasn't proposed any concrete solutions."


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
    action: str,
    detail: str = "",
) -> str | None:
    """
    Process an agent's action and return a system message if a
    significant event occurred (e.g., decision reached).
    """
    tracker = get_tracker(sim_id)
    tracker.add_action(round_num, agent_name, action, detail)
    system_msg = None

    if action == "propose_solution" and detail:
        tracker.proposals.append(Proposal(
            proposer=agent_name,
            summary=detail,
            round_proposed=round_num,
        ))
        system_msg = f"📋 {agent_name} has proposed: \"{detail}\""

    elif action == "support_proposal":
        # Support the leading/latest proposal
        leading = tracker.get_leading_proposal()
        target = leading or (tracker.proposals[-1] if tracker.proposals else None)
        if target and agent_name not in target.supporters:
            target.supporters.append(agent_name)
            if agent_name in target.opponents:
                target.opponents.remove(agent_name)

    elif action == "oppose_proposal":
        leading = tracker.get_leading_proposal()
        target = leading or (tracker.proposals[-1] if tracker.proposals else None)
        if target and agent_name not in target.opponents:
            target.opponents.append(agent_name)
            if agent_name in target.supporters:
                target.supporters.remove(agent_name)

    elif action == "escalate":
        tracker.escalation_count += 1
        if tracker.escalation_count >= 2:
            system_msg = "⬆️ Multiple team members have escalated to management. Leadership is now involved."

    elif action == "resign_threat":
        if agent_name not in tracker.resign_threats:
            tracker.resign_threats.append(agent_name)
            system_msg = f"⚠️ {agent_name} has hinted at resignation."

    # Check if a proposal has majority support (more than half of expected team)
    if not tracker.decided_proposal:
        for proposal in tracker.proposals:
            # Include proposer in supporter count
            total_support = proposal.net_support + 1  # +1 for the proposer
            if total_support >= 3:  # Majority for typical 4-person team
                tracker.decided_proposal = proposal
                system_msg = (
                    f"✅ TEAM DECISION REACHED: \"{proposal.summary}\" "
                    f"(proposed by {proposal.proposer}, "
                    f"supported by {', '.join(proposal.supporters)})"
                )
                break

    return system_msg


def determine_outcome(
    sim_id: str,
    agents: list,
    total_rounds: int,
    current_round: int,
) -> SimulationOutcome:
    """
    Determine the simulation outcome based on final state.
    Called when the simulation ends.
    """
    tracker = get_tracker(sim_id)

    active_agents = [a for a in agents if not a.has_resigned]
    resigned_count = sum(1 for a in agents if a.has_resigned)
    total_agents = len(agents)

    # Total collapse
    if not active_agents:
        return OUTCOMES["total_collapse"]

    avg_morale = sum(a.state.morale for a in active_agents) / len(active_agents)
    avg_stress = sum(a.state.stress for a in active_agents) / len(active_agents)

    has_decision = tracker.decided_proposal is not None
    has_proposals = len(tracker.proposals) > 0

    # Team fracture: >50% resigned or avg morale < 20
    if resigned_count > total_agents / 2 or avg_morale < 20:
        return OUTCOMES["team_fracture"]

    # Stalemate: simulation ended without any proposals or decisions
    if not has_proposals and current_round >= total_rounds:
        return OUTCOMES["stalemate"]

    # Team triumph: high morale, no resignations, decision made
    if avg_morale > 60 and resigned_count == 0 and has_decision:
        return OUTCOMES["team_triumph"]

    # Negotiated settlement: decision reached, morale OK
    if has_decision and avg_morale > 35:
        return OUTCOMES["negotiated_settlement"]

    # Pyrrhic victory: some resolution but with casualties
    if (has_decision or has_proposals) and resigned_count > 0:
        return OUTCOMES["pyrrhic_victory"]

    # Default to stalemate if none matched
    if avg_morale > 40:
        return OUTCOMES["negotiated_settlement"]

    return OUTCOMES["stalemate"]


def build_outcome_message(outcome: SimulationOutcome) -> str:
    """Build the dramatic ending system message."""
    return (
        f"\n{'='*50}\n"
        f"{outcome.emoji}  SIMULATION OUTCOME: {outcome.title.upper()}\n"
        f"{'='*50}\n\n"
        f"{outcome.description}\n"
    )


def cleanup_tracker(sim_id: str):
    """Remove the tracker when simulation is done (free memory)."""
    _decision_trackers.pop(sim_id, None)
