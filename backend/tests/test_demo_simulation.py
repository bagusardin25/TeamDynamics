from services.demo_simulation import DEMO_RUNTIME_MODEL, build_demo_simulation_request


def test_demo_request_is_fixed_and_short():
    request = build_demo_simulation_request()

    assert request.company.name == "Northstar Labs"
    assert request.crisis.scenario.value == "rnd4"
    assert request.params.duration_weeks == 3
    assert request.params.pacing.value == "normal"
    assert len(request.agents) == 3


def test_demo_agents_all_use_scripted_mock():
    request = build_demo_simulation_request()

    assert DEMO_RUNTIME_MODEL == "scripted-mock"
    assert {agent.model for agent in request.agents} == {DEMO_RUNTIME_MODEL}
    assert [agent.name for agent in request.agents] == ["Alex", "Sam", "Jordan"]
