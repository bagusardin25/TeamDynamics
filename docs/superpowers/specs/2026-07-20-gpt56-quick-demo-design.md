# GPT-5.6 Existing Simulation and Quick Demo Design

**Date:** 2026-07-20  
**Branch:** `codexbuild`  
**Status:** Implemented with the mock-only amendment below

## Goal

Extend the existing TeamDynamics simulation with one explicit GPT-5.6 runtime model and add a public Quick Demo that starts a safe, preconfigured simulation without login or manual setup.

## Implementation Amendment: Mock-only Public Demo

After the first runtime attempt exposed a GPT-5.6 parameter error, the user
explicitly directed that the public demo use mock data. This amendment
supersedes every conflicting Quick Demo runtime statement later in this
document:

- `/demo` and `POST /api/simulation/demo` use `runtime_model="scripted-mock"`.
- Demo dialogue comes from deterministic local fixtures and never invokes an
  external model.
- The demo still exercises the production simulation engine, state changes,
  decision engine, persistence, WebSocket messages, and outcome calculation.
- The UI labels the experience `Scripted Mock Simulation`; it does not present
  mock dialogue as GPT-5.6 output.
- OpenAI Responses API and GPT-5.6 support remain available to non-demo,
  configured simulations. GPT-5.6 calls omit the unsupported `temperature`
  request parameter.
- A runner abort never emits a `completed` WebSocket event.

The original sections below remain as decision history. Where they conflict
with this amendment, this amendment is authoritative.

## Approved Product Decisions

1. Continue on the existing `codexbuild` branch. Do not create a branch or worktree.
2. Codex continues using the single model selected for the development session. This is independent from the model called by the deployed application.
3. The TeamDynamics Build Week path uses one application runtime model: `gpt-5.6`.
4. All demo personas use the same GPT-5.6 runtime model. Their behavior remains differentiated by the existing personality, role, memory, agenda, and world-state prompts.
5. The existing manual setup flow remains available and keeps its current per-agent custom-model capability.
6. Qwen, Gemini, and OpenRouter integrations are not removed. They are outside the judged Quick Demo path.
7. Crisis Council is excluded from this phase. It is an optional future enhancement, not another name for Quick Demo.

## User Experience

### Existing manual flow

The existing flow remains:

```text
Landing page
  -> Setup
  -> Company configuration
  -> Agent selection/customization
  -> Crisis configuration
  -> Simulation
  -> Report
```

Authenticated users can continue configuring their own simulations. This flow is not replaced by Quick Demo.

### New Quick Demo flow

The public flow is:

```text
Landing page
  -> Quick Demo
  -> Review preset
  -> Run live simulation
  -> Existing simulation screen
  -> Existing report screen
```

The Quick Demo requires:

- No login.
- No company form.
- No agent selection.
- No crisis selection.
- No credits.
- One explicit user action before an LLM-backed run starts.
- A visible GPT-5.6 label.
- A visible loading state and actionable error state.

The Quick Demo route is `/demo`. The landing page receives a visible link to this route while preserving the existing manual setup CTA.

## Demo Preset

The preset is created on the backend so public clients cannot submit arbitrary expensive simulation configurations.

### Company

- Name: `Northstar Labs`
- Culture: `A fast-moving product engineering company that values ownership, reliability, and candid communication, but is under severe delivery pressure.`

### Agents

Use the first three existing preset personas:

1. Alex — Tech Lead
2. Sam — Junior Developer
3. Jordan — Product Manager

Every demo agent explicitly sets:

```text
model = "gpt-5.6"
```

### Crisis and pacing

- Scenario: `rnd4` — Critical Database Deleted on Friday
- Duration: 3 rounds
- Pacing: fast

Three rounds keep the live demonstration short while exercising the existing world state, memory, decision, WebSocket, metrics, outcome, and report systems.

## Backend Architecture

### Demo preset factory

Create `backend/services/demo_simulation.py`.

Responsibilities:

- Own the immutable Quick Demo preset.
- Return a validated `CreateSimulationRequest`.
- Ensure the demo always has exactly three agents, three rounds, fast pacing, and the `gpt-5.6` model override.
- Contain no API keys or environment-specific values.

Public interface:

```python
def build_demo_simulation_request() -> CreateSimulationRequest:
    ...
```

### Demo creation endpoint

Add:

```text
POST /api/simulation/demo
```

The endpoint:

- Requires no authentication.
- Accepts no request body.
- Is limited to 3 requests per minute per client.
- Builds the server-owned preset.
- Calls the existing `create_simulation(...)` service with `user_id=None`.
- Marks the in-memory/Redis simulation metadata as:
  - `mode="demo"`
  - `runtime_model="gpt-5.6"`
  - `strict_llm=True`
- Returns only:

```json
{
  "id": "simulation-id",
  "status": "idle",
  "mode": "demo",
  "runtime_model": "gpt-5.6"
}
```

The endpoint does not deduct credits and does not add the simulation to an authenticated user's dashboard.

### Simulation metadata

Extend the internal `create_simulation(...)` signature with keyword-only metadata:

```python
async def create_simulation(
    request: CreateSimulationRequest,
    user_id: str | None = None,
    *,
    mode: str = "standard",
    runtime_model: str | None = None,
    strict_llm: bool = False,
) -> str:
    ...
```

Store these fields in active and Redis-serialized state. PostgreSQL schema changes are not required in this phase because demo simulations are anonymous, short-lived judge sessions. When restored only from PostgreSQL, simulations default to standard mode.

### Explicit GPT-5.6 provider behavior

The current model resolver already identifies model names beginning with `gpt-` as OpenAI. Preserve that behavior.

For `gpt-5.6` calls:

- Use the OpenAI Responses API.
- Request structured output matching the existing agent-response contract.
- Record provider, resolved model, input tokens, output tokens, and latency.
- Keep the existing budget tracker.
- Add GPT-5.6 pricing to the budget table.
- Do not silently switch a strict demo request to `gpt-4o-mini`, Qwen, Gemini, or OpenRouter.

Existing non-demo simulations retain their current fallback behavior in this phase to avoid an unrelated breaking change.

### Strict demo failures

Add an `allow_model_fallback: bool = True` option through the internal LLM dispatch path.

For demo simulations:

```text
strict_llm=True
  -> allow_model_fallback=False
  -> provider/API/schema failure raises an error
  -> WebSocket sends a visible error state
```

The demo must not present hardcoded fallback dialogue as verified GPT-5.6 output.

### Runtime trace

The WebSocket initialization payload includes:

```json
{
  "mode": "demo",
  "runtimeModel": "gpt-5.6"
}
```

This lets the existing simulation UI display the actual configured runtime model without exposing credentials or internal prompts.

## Frontend Architecture

### Quick Demo page

Create `frontend/src/app/demo/page.tsx`.

The page uses the existing design system, typography, buttons, cards, colors, and icons. It shows:

- `Live GPT-5.6 Simulation` badge.
- The seeded company.
- Three agent summaries.
- The database incident scenario.
- Three-round duration.
- `Run Quick Demo` primary action.
- `Configure My Own Simulation` link to `/setup`.

When `Run Quick Demo` is pressed:

1. Disable the action.
2. Send `POST /api/simulation/demo`.
3. On success, navigate to `/simulation?id={id}&demo=1`.
4. On failure, keep the user on `/demo` and display a concise retryable error.

The page must not create a simulation automatically on load. This prevents accidental API usage from crawlers, refreshes, or link previews.

### Existing simulation screen

Read the `demo=1` query parameter.

For demo mode:

- Show the runtime-model badge supplied by WebSocket state.
- Exit returns to `/demo` or `/`, not the authenticated dashboard.
- Preserve the existing message, metrics, intervention, outcome, and report behavior.

For standard mode, behavior remains unchanged.

### Landing page

Add a clear secondary CTA:

```text
Try Quick Demo
```

The existing setup CTA remains the primary path for users who want customization.

## Error Handling

| Failure | Expected behavior |
|---|---|
| Missing OpenAI API key | Backend returns or streams a clear configuration error; no fake agent dialogue |
| GPT-5.6 access denied | Visible model-access error; no provider substitution |
| Structured output invalid | Bounded same-model repair/retry; then visible failure |
| Daily budget exceeded | Demo stops with a budget-limit message |
| Demo rate limit exceeded | HTTP 429 with a retry message |
| Database unavailable | Demo creation fails without deducting credits |
| WebSocket interrupted | Existing bounded reconnect behavior remains |

No API key, stack trace, internal prompt, or raw provider response is sent to the frontend.

## Security and Cost Boundaries

- The public endpoint accepts no arbitrary company, agent, crisis, duration, model, or token-limit input.
- Public demo creation is rate-limited.
- Demo records use `user_id=None`.
- The demo uses only synthetic preset data.
- Uploaded documents and user-entered personal data are not part of Quick Demo.
- A hard daily LLM budget remains active.
- The frontend never receives an API key.
- Existing broader simulation ownership issues are tracked separately and are not expanded by accepting arbitrary public input.

## Testing Strategy

### Backend unit tests

Create a focused `backend/tests` suite covering:

1. Demo preset contains exactly three agents and three rounds.
2. Every demo agent resolves to OpenAI `gpt-5.6`.
3. Demo endpoint requires no authentication and passes `user_id=None`.
4. Demo endpoint applies mode, runtime model, and strict-LLM metadata.
5. Strict dispatch does not invoke the cheap-model fallback.
6. Standard dispatch keeps existing fallback behavior.
7. GPT-5.6 structured output is converted to the existing agent response dictionary.
8. Usage tracking receives the actual provider/model/token counts.

Network calls are replaced with fakes. Unit tests must not spend OpenAI credits.

### Frontend and integration verification

- TypeScript production build succeeds.
- Lint the new/modified Quick Demo files.
- Browser smoke: landing CTA opens `/demo`.
- Browser smoke: `/demo` does not call the backend before the user clicks.
- Browser smoke: successful creation navigates to the existing simulation route.
- Browser smoke: API failure displays a retryable error.
- Live API probe is optional and must be run only after the correct OpenAI project/key and model access are confirmed.

## Documentation and Build Week Evidence

Update:

- `BUILD_WEEK_CHANGELOG.md`
- `README.md`
- `backend/.env.example`
- `OPENAI_BUILD_WEEK_AUDIT.md` only if implementation evidence changes an audit conclusion

Document:

- Baseline commit `30f938f`.
- Work completed on 20 July 2026 and later.
- Codex's development role.
- GPT-5.6's application-runtime role.
- Exact demo URL.
- Test commands and results.
- Known limitations.

## Out of Scope

- New Git branch or worktree.
- Crisis Council orchestration.
- Multi-model Sol/Terra/Luna routing.
- Removing Qwen, Gemini, or OpenRouter.
- Rewriting the existing manual setup wizard.
- User-uploaded data in Quick Demo.
- A full repository-wide lint cleanup.
- Scientific claims that the simulation predicts real employee behavior.
- Full authentication/ownership redesign for every existing endpoint.

## Acceptance Criteria

The phase is complete only when:

1. Work remains on `codexbuild`.
2. The existing manual setup flow still builds.
3. `POST /api/simulation/demo` creates a fixed anonymous simulation without login or credits.
4. The Quick Demo uses exactly three agents, three rounds, and `gpt-5.6`.
5. Strict demo failures never masquerade as valid GPT-5.6 dialogue.
6. `/demo` starts only after a user click and routes into the existing simulation UI.
7. The active runtime model is visible to the user.
8. Focused backend tests pass without network calls.
9. The frontend production build passes.
10. Build Week documentation clearly separates old and new work.

