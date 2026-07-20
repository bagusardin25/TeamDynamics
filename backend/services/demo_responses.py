"""Deterministic agent dialogue for the public Quick Demo.

The public demo intentionally avoids every external model call. It still runs
through the real simulation, state, decision, persistence, and WebSocket
pipelines; only the agent response source is replaced by these local fixtures.
"""

from __future__ import annotations

from copy import deepcopy


_SCRIPTED_RESPONSES: dict[int, dict[str, dict]] = {
    1: {
        "Alex": {
            "public_message": (
                "Freeze every production write now. I want backup integrity "
                "verified, the latest clean snapshot restored into isolation, "
                "and a recovery timeline before anyone starts assigning blame."
            ),
            "internal_thought": (
                "This is the failure I have always dreaded. If I stay precise, "
                "the team might avoid turning panic into a second incident."
            ),
            "state_changes": {
                "morale": -6,
                "stress": 12,
                "loyalty": 1,
                "productivity": -4,
            },
            "memory_update": (
                "Took command of recovery with a freeze, backup verification, "
                "and isolated restore plan."
            ),
            "action": "propose_solution",
            "action_detail": (
                "Freeze writes, verify backups, restore the latest clean "
                "snapshot in isolation, then publish a recovery timeline."
            ),
        },
        "Sam": {
            "public_message": (
                "I support that plan. I can compare the snapshot against the "
                "replication logs and build a checksum report so we know exactly "
                "what is recoverable before we touch production."
            ),
            "internal_thought": (
                "I am terrified of making this worse, but a concrete validation "
                "task is where I can contribute without pretending to be senior."
            ),
            "state_changes": {
                "morale": -3,
                "stress": 10,
                "loyalty": 3,
                "productivity": -2,
            },
            "memory_update": (
                "Backed the recovery plan and volunteered to validate snapshots "
                "against replication logs."
            ),
            "action": "support_proposal",
            "action_detail": (
                "Validate snapshot consistency with replication logs and "
                "document any missing transactions."
            ),
        },
        "Jordan": {
            "public_message": (
                "Agreed. While engineering validates recovery, I will open a "
                "thirty-minute incident update cadence and prepare a transparent "
                "customer notice that distinguishes confirmed facts from risks."
            ),
            "internal_thought": (
                "The worst communication mistake would be false certainty. The "
                "team needs space to recover while customers still hear the truth."
            ),
            "state_changes": {
                "morale": -2,
                "stress": 6,
                "loyalty": 4,
                "productivity": -1,
            },
            "memory_update": (
                "Committed to a factual incident-update cadence and customer "
                "communications alongside the technical recovery."
            ),
            "action": "support_proposal",
            "action_detail": (
                "Run stakeholder updates every thirty minutes and prepare a "
                "fact-checked customer notice."
            ),
        },
    },
    2: {
        "Alex": {
            "public_message": (
                "The clean snapshot is restored in staging and core tables pass "
                "integrity checks. We are replaying the final transaction window "
                "now; production stays read-only until two people sign off."
            ),
            "internal_thought": (
                "There is finally a path forward, but fatigue makes shortcuts "
                "dangerous. The dual sign-off is not negotiable."
            ),
            "state_changes": {
                "morale": 3,
                "stress": 3,
                "loyalty": 2,
                "productivity": 6,
            },
            "memory_update": (
                "Restored the clean snapshot in staging and required dual "
                "verification before reopening production."
            ),
            "action": "report_progress",
            "action_detail": (
                "Snapshot restored in staging; integrity checks passed and "
                "transaction replay is underway."
            ),
        },
        "Sam": {
            "public_message": (
                "I found a seventeen-minute gap between the snapshot and the "
                "replication log. Most writes can be reconstructed, but eleven "
                "customer updates need manual review before we claim full recovery."
            ),
            "internal_thought": (
                "Raising this could disappoint everyone, yet hiding a gap would "
                "turn a recoverable incident into a trust failure."
            ),
            "state_changes": {
                "morale": -2,
                "stress": 7,
                "loyalty": 3,
                "productivity": -1,
            },
            "memory_update": (
                "Discovered and disclosed a seventeen-minute replication gap "
                "requiring manual review of eleven updates."
            ),
            "action": "raise_alarm",
            "action_detail": (
                "A seventeen-minute replication gap leaves eleven customer "
                "updates requiring manual verification."
            ),
        },
        "Jordan": {
            "public_message": (
                "That gap goes into the next update exactly as stated. I will "
                "pair with you on the eleven affected records and contact those "
                "customers directly instead of burying the uncertainty."
            ),
            "internal_thought": (
                "Protecting a junior teammate for surfacing bad news is part of "
                "protecting the company. Candor has to be rewarded now."
            ),
            "state_changes": {
                "morale": 4,
                "stress": 2,
                "loyalty": 6,
                "productivity": 3,
            },
            "memory_update": (
                "Supported disclosure of the replication gap and took ownership "
                "of outreach for affected customers."
            ),
            "action": "support_colleague",
            "action_detail": (
                "Help verify the affected records and communicate the gap "
                "directly to impacted customers."
            ),
        },
    },
    3: {
        "Alex": {
            "public_message": (
                "Production is stable and the missing updates are reconciled. "
                "Our recovery worked, but the absence of tested restore drills "
                "made this harder than it had to be. I own fixing that."
            ),
            "internal_thought": (
                "Relief is arriving with anger and exhaustion. Accountability "
                "means changing the system, not finding someone to punish."
            ),
            "state_changes": {
                "morale": 8,
                "stress": -12,
                "loyalty": 5,
                "productivity": 4,
            },
            "memory_update": (
                "Committed to a blameless postmortem, tested restores, and clear "
                "recovery ownership after production stabilized."
            ),
            "action": "reflect",
            "action_detail": (
                "Run a blameless postmortem and add automated restore drills "
                "with named recovery owners."
            ),
        },
        "Sam": {
            "public_message": (
                "I am staying. This was brutal, but being trusted to surface the "
                "gap showed me that honesty matters here. I want to help automate "
                "the checks we had to perform by hand."
            ),
            "internal_thought": (
                "I made it through without being dismissed or blamed. Turning "
                "today's manual work into safeguards feels worth committing to."
            ),
            "state_changes": {
                "morale": 10,
                "stress": -9,
                "loyalty": 9,
                "productivity": 5,
            },
            "memory_update": (
                "Chose to stay and volunteered to automate snapshot and "
                "replication consistency checks."
            ),
            "action": "commit_to_stay",
            "action_detail": (
                "Automate snapshot and replication validation as a follow-up "
                "reliability project."
            ),
        },
        "Jordan": {
            "public_message": (
                "The team recovered the service without hiding uncertainty or "
                "sacrificing each other. Customers now have a precise account of "
                "what happened, and the remediation owners and dates are public."
            ),
            "internal_thought": (
                "The incident hurt, but the way people protected truth and each "
                "other is the strongest evidence that this team can improve."
            ),
            "state_changes": {
                "morale": 10,
                "stress": -8,
                "loyalty": 7,
                "productivity": 4,
            },
            "memory_update": (
                "Recognized the team's candor and published customer-facing "
                "remediation ownership and dates."
            ),
            "action": "acknowledge_team",
            "action_detail": (
                "Publish the incident summary, remediation owners, and target "
                "dates while recognizing the team's work."
            ),
        },
    },
}


_FOLLOW_UP_RESPONSES: dict[int, dict[str, dict]] = {
    1: {
        "Alex": {
            "public_message": (
                "Sam, add the checksum report as a hard gate. Jordan, publish "
                "the first update now with the recovery steps and the known "
                "unknowns. We reconvene in twenty minutes with evidence."
            ),
            "internal_thought": (
                "The plan is stronger now that validation and communication "
                "have explicit owners. I need to keep urgency from becoming chaos."
            ),
            "state_changes": {
                "morale": 2,
                "stress": -1,
                "loyalty": 2,
                "productivity": 2,
            },
            "memory_update": (
                "Converted the recovery proposal into owned validation and "
                "communication checkpoints."
            ),
            "action": "support_proposal",
            "action_detail": (
                "Make checksum validation and a factual customer update explicit "
                "gates in the recovery plan."
            ),
        },
        "Sam": {
            "public_message": (
                "Understood. I have split the validation into schema, row-count, "
                "and transaction checks, and I will flag every mismatch instead "
                "of trying to repair anything silently."
            ),
            "internal_thought": (
                "Clear gates make the task less frightening. I can be useful if "
                "I make uncertainty visible rather than rushing past it."
            ),
            "state_changes": {
                "morale": 3,
                "stress": 1,
                "loyalty": 3,
                "productivity": 2,
            },
            "memory_update": (
                "Defined three validation layers and committed to reporting all "
                "mismatches before repair."
            ),
            "action": "support_proposal",
            "action_detail": (
                "Run schema, row-count, and transaction validation as separate "
                "recovery gates."
            ),
        },
        "Jordan": {
            "public_message": (
                "The first update is drafted: service unavailable, recovery in "
                "progress, data-loss scope still being verified, and another "
                "update in thirty minutes. No promises we cannot prove."
            ),
            "internal_thought": (
                "Engineering has a credible plan now. My responsibility is to "
                "turn that plan into trust without overstating certainty."
            ),
            "state_changes": {
                "morale": 2,
                "stress": -1,
                "loyalty": 3,
                "productivity": 2,
            },
            "memory_update": (
                "Prepared the first incident notice with verified facts and a "
                "specific update time."
            ),
            "action": "support_proposal",
            "action_detail": (
                "Publish a fact-based incident notice with a thirty-minute "
                "update commitment."
            ),
        },
    },
    2: {
        "Alex": {
            "public_message": (
                "Good catch on the seventeen-minute gap. Stop the production "
                "cutover. I will pair on reconstructing those eleven updates, "
                "and the dual sign-off remains in place."
            ),
            "internal_thought": (
                "This setback costs time, but rewarding the alarm is essential. "
                "The team must learn that inconvenient evidence changes the plan."
            ),
            "state_changes": {
                "morale": 3,
                "stress": 2,
                "loyalty": 4,
                "productivity": 3,
            },
            "memory_update": (
                "Paused cutover after the replication gap and joined the manual "
                "reconstruction effort."
            ),
            "action": "support_colleague",
            "action_detail": (
                "Pair on reconstructing the eleven affected updates before "
                "approving production cutover."
            ),
        },
        "Sam": {
            "public_message": (
                "Nine of the eleven updates now reconcile against customer-side "
                "records. Two still conflict, so I have isolated them for manual "
                "confirmation instead of forcing a value."
            ),
            "internal_thought": (
                "The team responded to the warning with help, not blame. I can "
                "stay methodical even while the clock keeps moving."
            ),
            "state_changes": {
                "morale": 5,
                "stress": -2,
                "loyalty": 4,
                "productivity": 4,
            },
            "memory_update": (
                "Reconciled nine affected updates and isolated two conflicts for "
                "manual confirmation."
            ),
            "action": "report_progress",
            "action_detail": (
                "Nine updates are reconciled; two conflicts remain isolated for "
                "manual confirmation."
            ),
        },
        "Jordan": {
            "public_message": (
                "Both affected customers have acknowledged our outreach and are "
                "checking their source records. The public status page now says "
                "recovery is progressing with a limited reconciliation step."
            ),
            "internal_thought": (
                "Specific disclosure is working better than vague reassurance. "
                "Customers can tolerate uncertainty when they see ownership."
            ),
            "state_changes": {
                "morale": 4,
                "stress": -2,
                "loyalty": 4,
                "productivity": 3,
            },
            "memory_update": (
                "Secured customer cooperation on the final conflicts and updated "
                "the public recovery status."
            ),
            "action": "report_progress",
            "action_detail": (
                "Customers are validating the two conflicts while the status "
                "page communicates the reconciliation step."
            ),
        },
    },
    3: {
        "Alex": {
            "public_message": (
                "I want to recognize both of you: the recovery succeeded because "
                "the gap was surfaced and communicated, not hidden. Restore "
                "drills and dual verification become scheduled work this week."
            ),
            "internal_thought": (
                "The team earned trust under pressure. My follow-through after "
                "the incident will determine whether this becomes real learning."
            ),
            "state_changes": {
                "morale": 6,
                "stress": -7,
                "loyalty": 4,
                "productivity": 3,
            },
            "memory_update": (
                "Closed the incident by recognizing candor and scheduling restore "
                "drills with dual verification."
            ),
            "action": "acknowledge_team",
            "action_detail": (
                "Recognize the team's candor and schedule recurring restore "
                "drills with dual verification."
            ),
        },
        "Sam": {
            "public_message": (
                "My biggest lesson is that raising a problem early saved more "
                "time than silently fixing around it. I will turn the checksum "
                "work into an automated recovery test with visible failures."
            ),
            "internal_thought": (
                "I leave the incident more confident, but only because the team "
                "made honesty safer than pretending everything was fine."
            ),
            "state_changes": {
                "morale": 6,
                "stress": -6,
                "loyalty": 5,
                "productivity": 4,
            },
            "memory_update": (
                "Committed to converting manual checks into an automated recovery "
                "test with visible failures."
            ),
            "action": "reflect",
            "action_detail": (
                "Automate the checksum workflow and make every validation failure "
                "visible during restore drills."
            ),
        },
        "Jordan": {
            "public_message": (
                "The final customer update includes what failed, what was "
                "recovered, and the owners and dates for every safeguard. I am "
                "committed to keeping that transparency after the war room closes."
            ),
            "internal_thought": (
                "Trust held because communication matched the evidence. The same "
                "standard must continue when there is no crisis forcing it."
            ),
            "state_changes": {
                "morale": 6,
                "stress": -5,
                "loyalty": 5,
                "productivity": 3,
            },
            "memory_update": (
                "Published the final customer update and committed to ongoing "
                "transparent remediation tracking."
            ),
            "action": "commit_to_stay",
            "action_detail": (
                "Maintain public remediation ownership and progress updates after "
                "the incident."
            ),
        },
    },
}


def get_demo_agent_response(
    agent: dict,
    round_num: int,
    exchange_num: int = 1,
) -> dict:
    """Return one independent scripted response for a demo agent turn."""
    agent_name = agent.get("name")

    try:
        responses = {
            1: _SCRIPTED_RESPONSES,
            2: _FOLLOW_UP_RESPONSES,
        }
        response = responses[exchange_num][round_num][agent_name]
    except (KeyError, TypeError) as exc:
        raise ValueError(
            "No scripted demo response for "
            f"agent={agent_name!r}, round={round_num}, exchange={exchange_num}"
        ) from exc

    return deepcopy(response)
