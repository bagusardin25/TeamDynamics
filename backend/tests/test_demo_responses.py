from __future__ import annotations

import pytest

from data.round_agenda import get_current_phase
from models.llm import AgentLLMResponse
from services.demo_responses import get_demo_agent_response


EXPECTED_ACTIONS_BY_PHASE = {
    "debate": {"propose_solution", "support_proposal", "oppose_proposal"},
    "execution": {"report_progress", "raise_alarm", "support_colleague", "blame"},
    "resolution": {"reflect", "commit_to_stay", "resign_threat", "acknowledge_team"},
}


def test_demo_responses_cover_every_agent_and_round_with_valid_actions():
    responses = []

    for round_num in range(1, 4):
        phase_id = get_current_phase(round_num, 3)["id"]

        for exchange_num in range(1, 3):
            for agent_name in ("Alex", "Sam", "Jordan"):
                response = get_demo_agent_response(
                    {"name": agent_name},
                    round_num,
                    exchange_num,
                )
                parsed = AgentLLMResponse.model_validate(response)

                assert parsed.action in EXPECTED_ACTIONS_BY_PHASE[phase_id]
                responses.append(parsed.public_message)

    assert len(responses) == 18
    assert len(set(responses)) == 18


def test_demo_response_is_returned_as_an_independent_copy():
    first = get_demo_agent_response({"name": "Alex"}, 1, 2)
    first["state_changes"]["stress"] = 999

    second = get_demo_agent_response({"name": "Alex"}, 1, 2)

    assert second["state_changes"]["stress"] != 999


@pytest.mark.parametrize(
    ("agent", "round_num", "exchange_num"),
    [
        ({"name": "Unknown"}, 1, 1),
        ({"name": "Alex"}, 4, 1),
        ({"name": "Alex"}, 1, 3),
    ],
)
def test_demo_response_rejects_unknown_fixture(
    agent,
    round_num,
    exchange_num,
):
    with pytest.raises(ValueError, match="No scripted demo response"):
        get_demo_agent_response(agent, round_num, exchange_num)
