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
                "Freeze every production write now. Restore the latest clean "
                "snapshot into isolation and, if core checks pass, target a "
                "read-only production reopening within sixty minutes."
            ),
            "internal_thought": (
                "This is every lead's nightmare. A fast recovery window may "
                "contain the damage, but urgency cannot become recklessness."
            ),
            "state_changes": {
                "morale": -6,
                "stress": 12,
                "loyalty": 1,
                "productivity": -4,
            },
            "memory_update": (
                "Proposed a rapid isolated restore with a sixty-minute target "
                "for reopening production in read-only mode."
            ),
            "action": "propose_solution",
            "action_detail": (
                "Freeze writes, restore the latest clean snapshot in isolation, "
                "and target read-only reopening within sixty minutes."
            ),
        },
        "Sam": {
            "public_message": (
                "I support freezing writes and restoring in isolation, but I "
                "want schema, row-count, and transaction checks before cutover. "
                "A fast restore is useless if it preserves corrupted data."
            ),
            "internal_thought": (
                "Challenging the timeline is intimidating, so I will anchor the "
                "concern in checks the team can verify."
            ),
            "state_changes": {
                "morale": -3,
                "stress": 10,
                "loyalty": 3,
                "productivity": -2,
            },
            "memory_update": (
                "Supported the isolated restore while requiring explicit "
                "integrity checks before production cutover."
            ),
            "action": "support_proposal",
            "action_detail": (
                "Keep the isolated restore, but require schema, row-count, and "
                "transaction validation before cutover."
            ),
        },
        "Jordan": {
            "public_message": (
                "I oppose committing to a sixty-minute reopening before the "
                "validation is complete. Customers need an update now, and "
                "production should reopen only after checksum evidence and "
                "two-person sign-off."
            ),
            "internal_thought": (
                "Speed matters, but a deadline we cannot defend creates a second "
                "failure in customer trust."
            ),
            "state_changes": {
                "morale": -4,
                "stress": 8,
                "loyalty": 4,
                "productivity": -1,
            },
            "memory_update": (
                "Challenged the fixed reopening deadline and required evidence, "
                "dual sign-off, and immediate customer communication."
            ),
            "action": "oppose_proposal",
            "action_detail": (
                "Reject a fixed reopening deadline until checksum validation and "
                "two-person sign-off are complete."
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
                "Production is stable and the missing updates are reconciled, "
                "but the client escalation means technical recovery is not enough. "
                "I will lead a verified recovery briefing and own the restore drills."
            ),
            "internal_thought": (
                "The service is back, but trust is still at risk. Accountability "
                "now means giving the client evidence and changing the system."
            ),
            "state_changes": {
                "morale": 8,
                "stress": -12,
                "loyalty": 5,
                "productivity": 4,
            },
            "memory_update": (
                "Responded to the client escalation with a verified briefing, "
                "tested restores, and clear recovery ownership."
            ),
            "action": "reflect",
            "action_detail": (
                "Give the client a verified recovery briefing and add automated "
                "restore drills with named owners."
            ),
        },
        "Sam": {
            "public_message": (
                "I can provide the checksum and replay evidence the client "
                "requested. I am staying, and I want to automate these checks so "
                "the next recovery packet is generated instead of assembled by hand."
            ),
            "internal_thought": (
                "The evidence I raised is now central to retaining the client. "
                "Turning it into a safeguard feels worth committing to."
            ),
            "state_changes": {
                "morale": 10,
                "stress": -9,
                "loyalty": 9,
                "productivity": 5,
            },
            "memory_update": (
                "Chose to stay, supplied the client evidence, and volunteered "
                "to automate snapshot and replication checks."
            ),
            "action": "commit_to_stay",
            "action_detail": (
                "Package the client evidence and automate snapshot and "
                "replication validation."
            ),
        },
        "Jordan": {
            "public_message": (
                "I am contacting the client with the verified timeline, the two "
                "reconciled records, and named safeguard owners. I will ask them "
                "to pause the exit decision for a joint recovery review."
            ),
            "internal_thought": (
                "A generic apology will not retain this account. The client needs "
                "specific evidence, ownership, and a forum to challenge us."
            ),
            "state_changes": {
                "morale": 10,
                "stress": -8,
                "loyalty": 7,
                "productivity": 4,
            },
            "memory_update": (
                "Answered the client escalation with verified evidence, named "
                "owners, and a joint recovery review."
            ),
            "action": "acknowledge_team",
            "action_detail": (
                "Request a client recovery review backed by verified evidence, "
                "remediation owners, and target dates."
            ),
        },
    },
}


_FOLLOW_UP_RESPONSES: dict[int, dict[str, dict]] = {
    1: {
        "Alex": {
            "public_message": (
                "Fair challenge. I am revising the plan: freeze writes, restore "
                "in isolation, make the checksum a hard gate, and require dual "
                "sign-off. Jordan owns thirty-minute updates; there is no fixed "
                "cutover time without evidence."
            ),
            "internal_thought": (
                "The first plan overvalued speed. Revising it publicly shows that "
                "evidence outranks hierarchy in this war room."
            ),
            "state_changes": {
                "morale": 2,
                "stress": -1,
                "loyalty": 2,
                "productivity": 2,
            },
            "memory_update": (
                "Replaced the fixed reopening target with checksum validation, "
                "dual sign-off, and owned communication checkpoints."
            ),
            "action": "propose_solution",
            "action_detail": (
                "Freeze writes, restore in isolation, require checksum validation "
                "and dual sign-off, and publish verified updates every thirty minutes."
            ),
        },
        "Sam": {
            "public_message": (
                "I support the revised plan. I have split validation into schema, "
                "row-count, and transaction checks, and every mismatch will block "
                "cutover until it is explained."
            ),
            "internal_thought": (
                "The team changed course when challenged. That makes it safer to "
                "keep uncertainty visible instead of rushing past it."
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
                "Support the revised plan with schema, row-count, and transaction "
                "validation as blocking recovery gates."
            ),
        },
        "Jordan": {
            "public_message": (
                "I support the revised plan. The first update says service is "
                "unavailable, recovery is in progress, and data-loss scope is "
                "still being verified. No reopening promise we cannot prove."
            ),
            "internal_thought": (
                "The technical plan now matches the communication standard. We "
                "can move quickly without manufacturing certainty."
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
                "Support the evidence-gated recovery plan and publish verified "
                "customer updates every thirty minutes."
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
                "The client's recovery packet now has dual sign-off and every "
                "claim links to evidence. I want to recognize both of you: the "
                "gap was surfaced, challenged, and resolved instead of hidden."
            ),
            "internal_thought": (
                "The team earned the chance to rebuild client trust. My follow-through "
                "will determine whether today's promises become operating controls."
            ),
            "state_changes": {
                "morale": 6,
                "stress": -7,
                "loyalty": 4,
                "productivity": 3,
            },
            "memory_update": (
                "Closed the response by recognizing candor and delivering a "
                "dual-signed evidence packet to the client."
            ),
            "action": "acknowledge_team",
            "action_detail": (
                "Recognize the team's candor and deliver a dual-signed client "
                "recovery packet."
            ),
        },
        "Sam": {
            "public_message": (
                "The client can now inspect the checksum, replay window, and "
                "manual confirmations in one audit trail. I will turn that trail "
                "into an automated recovery test with visible failures."
            ),
            "internal_thought": (
                "Evidence changed both the cutover and the client conversation. "
                "The automation should make that honesty repeatable."
            ),
            "state_changes": {
                "morale": 6,
                "stress": -6,
                "loyalty": 5,
                "productivity": 4,
            },
            "memory_update": (
                "Delivered the client audit trail and committed to automating "
                "recovery evidence with visible failures."
            ),
            "action": "reflect",
            "action_detail": (
                "Automate the client-facing recovery evidence and expose every "
                "validation failure during restore drills."
            ),
        },
        "Jordan": {
            "public_message": (
                "The client accepted a recovery review tomorrow and paused the "
                "exit decision. The final update includes what failed, what was "
                "recovered, and the owner and date for every safeguard."
            ),
            "internal_thought": (
                "We have not regained trust yet, but evidence earned another "
                "conversation. The same standard must continue after the war room."
            ),
            "state_changes": {
                "morale": 6,
                "stress": -5,
                "loyalty": 5,
                "productivity": 3,
            },
            "memory_update": (
                "Secured a client recovery review and published transparent "
                "remediation ownership and dates."
            ),
            "action": "commit_to_stay",
            "action_detail": (
                "Run the client recovery review and maintain transparent "
                "remediation progress after the incident."
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
