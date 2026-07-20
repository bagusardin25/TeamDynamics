# OpenAI Build Week Change Log

This document separates TeamDynamics' pre-existing work from work completed during the OpenAI Build Week submission period.

## Baseline

- Baseline commit: `30f938f`
- Baseline commit date: 2026-05-10
- Active implementation branch: `codexbuild`
- Existing before Build Week:
  - Authenticated manual simulation setup
  - Preset and custom agents
  - Crisis scenarios and mutable world state
  - WebSocket simulation streaming
  - Interventions, reports, replay, comparison, and dashboard
  - OpenAI, Gemini, and OpenRouter provider paths
  - LLM budget and rate-limit infrastructure

## Work Completed During Build Week

### 2026-07-20

- Documented the repository and submission-readiness audit in `OPENAI_BUILD_WEEK_AUDIT.md`.
- Added OpenAI GPT-5.6 support through the Responses API with strict Pydantic output parsing.
- Omitted the unsupported `temperature` parameter for GPT-5.6 requests.
- Added a public, rate-limited `/api/simulation/demo` endpoint and `/demo` experience.
- Added deterministic mock responses for the public Quick Demo: three fixed agents across three rounds with no external model request or API cost.
- Kept the real simulation engine, state mutations, decision tracking, persistence, WebSocket streaming, and outcome calculation active for the demo.
- Fixed the background runner so an aborted simulation cannot emit a false `completed` event.
- Preserved configured model providers for authenticated custom simulations; mock-only behavior is scoped to `mode="demo"`.
- Recorded the implementation scope in `docs/superpowers/specs/2026-07-20-gpt56-quick-demo-design.md`.

## Remaining Build Week Work

The following items remain incomplete until verification evidence is recorded:

- Add focused backend tests and frontend smoke verification.
- Deploy and verify the exact Build Week commit.

