from routers.websocket import _public_round_error_message, _runtime_metadata


def test_demo_round_error_hides_provider_details():
    message = _public_round_error_message(
        {"mode": "demo"},
        RuntimeError("provider rejected secret sk-test-key"),
    )

    assert message == "GPT-5.6 could not complete this round. Retrying..."
    assert "provider" not in message
    assert "sk-test-key" not in message


def test_standard_round_error_keeps_existing_diagnostic_message():
    message = _public_round_error_message(
        {"mode": "standard"},
        RuntimeError("provider unavailable"),
    )

    assert message == "Round error: provider unavailable. Retrying..."


def test_runtime_metadata_uses_websocket_field_names():
    assert _runtime_metadata(
        {"mode": "demo", "runtime_model": "gpt-5.6"}
    ) == {
        "mode": "demo",
        "runtimeModel": "gpt-5.6",
    }
