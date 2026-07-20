# TeamDynamics — OpenAI Build Week Deep Audit

**Audit date:** 19 July 2026  
**Project:** TeamDynamics  
**Active branch during audit:** `codexbuild`  
**Target event:** [OpenAI Build Week](https://openai.com/id-ID/build-week/)  
**Recommended category:** **Work and Productivity**

## 1. Executive Summary

TeamDynamics has a strong foundation for OpenAI Build Week:

- Multi-agent team simulation.
- Crisis scenarios and mutable world state.
- FastAPI backend with authentication and PostgreSQL.
- Real-time simulation through WebSocket.
- Reports, replay, comparison, intervention, and export surfaces.
- Public Vercel frontend and Railway backend.
- Existing LLM budget and rate-limit infrastructure.

However, the current project is **not yet submission-ready**. The most important risks are not visual polish; they are competition eligibility, explicit GPT-5.6 usage, judge accessibility, security, and proof that meaningful work was completed during the official submission period.

The highest-value direction is to turn TeamDynamics into:

> **TeamDynamics Crisis Council — a counterfactual decision lab for engineering managers.**

Instead of claiming to predict employee burnout, the product should help managers rehearse high-stakes decisions using a council of AI specialists, expose disagreements and assumptions, require a human decision, and compare the chosen strategy against a baseline.

## 2. Build Week Requirements and Eligibility

### Important dates

- Submission period starts: **13 July 2026, 09:00 Pacific Time**.
- Submission deadline: **21 July 2026, 17:00 Pacific Time**.
- Deadline in Jakarta: **22 July 2026, 07:00 WIB**.
- Judging begins: 22 July 2026.

Official references:

- [OpenAI Build Week overview](https://openai.com/id-ID/build-week/)
- [Devpost challenge page](https://openai.devpost.com/)
- [Official rules](https://openai.devpost.com/rules)

### Existing-project rule

Existing projects are allowed only if they are meaningfully extended using Codex and/or GPT-5.6 after the submission period starts. Only new work will be evaluated.

The submission must clearly distinguish prior and new work using evidence such as:

- Dated Git commits.
- Timestamped Codex sessions.
- A Build Week changelog.
- Documentation of key engineering and product decisions.

### Current eligibility gap

The active `codexbuild` branch pointed to commit `30f938f`, originally created before the Build Week submission period. The audit found no commit in any active branch after the official start time.

Several Agent Society/Qwen commits remain recoverable from Git reflog:

| Commit | Existing work |
|---|---|
| `ea351ea` | Coordinator and specialist Agent Society workflow |
| `5c721f4` | Agent Society frontend |
| `e8d5db6` | Orchestrator fixes |
| `821b4ad` | Deployment continuation handoff |

These commits were created before the submission period began. Their architecture and concepts can be reused, but recovering or cherry-picking them unchanged is not sufficient evidence of new Build Week work.

### Submission artifacts still required

- Working project using GPT-5.6.
- Public YouTube demo with audio, less than three minutes.
- Repository URL.
- Relevant license for a public repository, or a private repository shared with the judging addresses.
- README with setup instructions and sample data.
- Explanation of how Codex and GPT-5.6 were used.
- Codex `/feedback` session ID for the primary implementation thread.
- Demo instance or test account that judges can use without rebuilding the project.

## 3. Current Readiness Score

The following is an internal estimate, not an official judging score.

| Area | Current assessment | Estimate |
|---|---|---:|
| Stage 1 eligibility | No qualifying commit and no GPT-5.6 integration on the active branch | 1/5 |
| Technical implementation | Strong foundation, but provider configuration and validation are unreliable | 2.5/5 |
| Product design | Complete feature surface, but judge flow has significant friction | 3/5 |
| Potential impact | Real problem, but current claims are too broad and insufficiently validated | 2.5/5 |
| Quality of idea | Multi-agent simulation is interesting but needs a visible differentiator | 3/5 |
| Submission readiness | README, license, video, session ID, and judge demo are incomplete | 1/5 |

Submitting the current state creates a high risk of failing the Stage 1 pass/fail eligibility review.

## 4. Verified Technical Baseline

The following results were recorded during the 19 July 2026 audit:

| Check | Result |
|---|---|
| Clean frontend production build | Passed; 18 routes generated |
| Python compile check | Passed |
| `pip check` | Passed |
| Frontend lint | Failed with 30 errors and 36 warnings |
| Backend pytest | No tests collected |
| Public frontend | Responded successfully |
| Railway backend health | Reported healthy |
| Public demo report endpoint | Returned `Simulation not found` |
| Git working tree after audit | Clean |

The build initially encountered Google Fonts network restrictions and stale generated `.next` development types. A clean build after removing generated `.next` output succeeded. This was build-environment friction rather than a source compilation failure.

## 5. AI and Model Integration Findings

### 5.1 No explicit GPT-5.6 integration

The current OpenAI implementation uses Chat Completions and JSON mode:

- [`backend/services/llm_service.py`](backend/services/llm_service.py)
- Default model documented in the repository: `gpt-4o-mini`.
- Response format: `{"type": "json_object"}`.

For Build Week, migrate the new workflow to:

- OpenAI Responses API.
- GPT-5.6 models.
- Strict Structured Outputs.
- Explicit tool definitions.
- Traceable model routing.
- Persisted token, cost, latency, retry, and fallback metadata.

### 5.2 Provider resolution can report a false-ready state

The local environment identified `qwen` as the active provider, but the dispatcher only handles `gemini` and `openrouter` explicitly. Other provider strings fall through to the OpenAI call path.

Consequences:

- Health output can identify one provider while calls use another implementation.
- A Qwen configuration can silently attempt OpenAI.
- A missing or invalid key may only become visible after a simulation starts.

Required improvement:

- Use an explicit provider enum.
- Reject unsupported provider names during startup.
- Expose the resolved provider and model in health diagnostics.
- Add a lightweight startup/model probe.
- Never report healthy model readiness before a real configuration validation.

### 5.3 Silent fallback hides failures

When model calls fail, the service can return a plausible hardcoded team response. This makes a failed API call look like valid simulation behavior.

For the Build Week demo:

- Mark fallback output visibly in traces.
- Separate degraded-mode output from model output.
- Record the original error category.
- Fail the demo clearly when all required model calls fail.
- Do not include fallback output in evaluation results as successful model output.

### 5.4 Output validation is permissive

The response validator clamps numeric fields, but an invalid action is logged and still allowed.

Replace permissive JSON cleanup with strict schemas that:

- Reject unknown action types.
- Validate required fields and ranges.
- Require evidence/assumption fields.
- Require specialist recommendations to reference current world-state facts.
- Retry invalid output with a bounded repair strategy.

## 6. Recommended GPT-5.6 Architecture

OpenAI currently positions:

- `gpt-5.6` / Sol for complex reasoning and high-value work.
- `gpt-5.6-terra` for balanced intelligence and cost.
- `gpt-5.6-luna` for cost-sensitive, high-volume workloads.

Reference: [OpenAI model documentation](https://developers.openai.com/api/docs/models)

### Recommended Crisis Council flow

1. **Coordinator — Terra**
   - Converts a crisis into decisions, constraints, and success criteria.
   - Selects the required specialist roles.

2. **Three independent specialists — Luna**
   - People and organizational risk.
   - Delivery and technical risk.
   - Financial and customer risk.

3. **Conflict detector**
   - Finds incompatible assumptions, recommendations, and resource demands.

4. **Negotiator — Terra**
   - Produces two compromise strategies.
   - Explains which trade-offs remain unresolved.

5. **Critic — Sol**
   - Challenges feasibility, fairness, safety, and reversibility.
   - Produces a pre-mortem and rollback conditions.

6. **Human approval gate**
   - The manager selects, modifies, or rejects the proposed strategy.

7. **Counterfactual comparison**
   - Runs the council decision against a baseline or alternative decision.
   - Shows differences in simulated outcome, assumptions, cost, and uncertainty.

### Model-routing rationale

Using Sol for every persona would increase cost without demonstrating good engineering judgment. A Luna → Terra → Sol hierarchy shows deliberate model selection and lets the strongest model focus on the final high-value critique.

## 7. Product and UX Findings

### 7.1 No frictionless judge path

The primary CTA enters the setup flow, but authentication is required before completing the core experience. The existing demo-report path did not resolve to a usable simulation.

Add a public `/demo` flow with:

- No account creation.
- One seeded company.
- One concise crisis.
- Three specialists.
- Three rounds.
- Target runtime below 60–90 seconds.
- A pre-generated fallback snapshot if the live run exceeds the demo time budget.
- A visible “Run live with GPT-5.6” indicator.

### 7.2 Default simulation is too long for judging

The setup defaults to 12 weeks. API-call estimation is approximately:

```text
selected agents × duration weeks
```

This does not include coordinator, critic, negotiation, retries, report generation, or counterfactual runs. It can make the real call count and demo duration significantly higher.

Use two modes:

- **Judge Demo:** three rounds with bounded output and timeout.
- **Full Analysis:** longer, asynchronous run with progress and resume support.

### 7.3 Audience positioning is inconsistent

Current messaging alternates between:

- Engineering teams.
- Startup founders.
- HR leaders.
- General managers.

For Build Week, use one narrow audience:

> Engineering managers rehearsing high-stakes team decisions before acting on a real team.

### 7.4 Current claims create trust risk

Claims such as “predict burnout” or “exact breaking point” imply scientific or psychological prediction.

Reframe the product as:

> A decision-rehearsal and scenario-exploration tool using synthetic or composite personas.

The UI and README should state:

- Results are simulated possibilities, not employee diagnoses.
- Personas are synthetic or explicitly authorized.
- Outputs contain uncertainty.
- Decisions remain with a human.
- Model-generated causal explanations are hypotheses, not verified facts.

### 7.5 Visual-audit limitation

A complete screenshot-based and WCAG audit could not be performed because the in-app browser session was unavailable. UX findings in this document are based on source code, routes, runtime HTTP behavior, and product-flow inspection rather than pixel-level comparison.

## 8. Security and Privacy Findings

### 8.1 Simulation resources lack ownership checks

Several routes do not visibly require authentication or simulation ownership:

- Status.
- Report generation.
- Intervention.
- Comparison.
- Replay.

Reference: [`backend/routers/simulation.py`](backend/routers/simulation.py)

An identifier should not be treated as authorization.

Required controls:

- Require the simulation owner for private routes.
- Use signed, expiring tokens for intentionally shared reports.
- Prevent a public share token from granting intervention permissions.
- Add authorization regression tests.

### 8.2 WebSocket accepts before authentication

The simulation WebSocket accepts connections before validating viewer identity or ownership:

- [`backend/routers/websocket.py`](backend/routers/websocket.py)

This channel can expose team state and messages and can receive intervention commands.

Required controls:

- Authenticate before registering the connection.
- Check simulation ownership or signed viewer scope.
- Separate read-only viewer and intervention permissions.
- Apply connection and message rate limits.

### 8.3 Document analysis lacks access controls

The document-analysis route accepts files up to 10 MB without visible authentication or rate limiting:

- [`backend/routers/document.py`](backend/routers/document.py)

Business documents may contain confidential or personal data.

Required controls:

- Authentication and rate limits.
- MIME and file-signature validation.
- Content-length and extracted-text limits.
- Clear data-processing notice.
- PII redaction where appropriate.
- Retention and deletion policy.

## 9. Cost and Reliability Findings

### 9.1 Backend pricing table is outdated

The current budget table mainly covers GPT-4o/Gemini and falls back to a generic price:

- [`backend/services/llm_budget.py`](backend/services/llm_budget.py)

Current GPT-5.6 output pricing can be much higher than that fallback. For example, the Sol output price is 15 times the existing generic `$2 / MTok` assumption.

### 9.2 Frontend estimator is not token-aware

The setup page estimates:

```text
API calls × $0.0005
```

Reference: [`frontend/src/app/setup/page.tsx`](frontend/src/app/setup/page.tsx)

This ignores:

- Model tier.
- Input and output tokens.
- Context growth across rounds.
- Coordinator, critic, and negotiation calls.
- Retries.
- Report generation.
- Counterfactual baseline.

Replace it with:

- Per-model pricing.
- Estimated input/output token ranges.
- Best/expected/worst cost.
- A hard maximum budget.
- Runtime cancellation when the maximum is reached.

## 10. Testing and Evaluation Findings

### 10.1 No backend test suite is collected

Running `pytest -q` did not collect tests. The core simulation, authorization, provider routing, budget enforcement, and response validation therefore lack a trustworthy regression gate.

### 10.2 Frontend lint fails

The frontend reported 30 errors and 36 warnings. Examples included:

- Impure `Math.random()` usage during render.
- Ref access during render.
- State updates inside effects.
- Broad `any` usage.

Not all lint problems must be fixed before submission, but every error affecting the demo, report, setup, replay, and dashboard flow should be resolved.

### 10.3 TestSprite evidence is inconsistent

The README claims 35 automated tests. The stored report has conflicting executed-test totals and summary tables. Individual status entries and coverage totals do not fully agree.

One example test only asserts:

```python
assert current_url is not None
```

Reference: [`testsprite_tests/TC007_Start_a_first_simulation_from_the_landing_page_CTA.py`](testsprite_tests/TC007_Start_a_first_simulation_from_the_landing_page_CTA.py)

This assertion does not prove that a simulation started.

### 10.4 Recommended golden scenarios

Create a small, evidence-heavy suite:

1. GPT-5.6 model and provider are resolved correctly.
2. Every council output passes the strict schema.
3. A seeded demo completes under the target time.
4. Unauthorized users cannot view or alter simulations.
5. A share token grants report access but not intervention access.
6. Model failure is surfaced and does not masquerade as real output.
7. Budget caps stop new calls.
8. Counterfactual comparison produces traceable differences.

Metrics to expose:

- Schema-valid response rate.
- Completion rate.
- P50/P95 latency.
- Input/output tokens.
- Estimated cost.
- Retry and fallback rate.
- Specialist recommendation diversity.
- Human modifications before approval.

## 11. Repository and Submission Documentation

### 11.1 Licensing

The repository is public, but [`README.md`](README.md) states:

> This project is proprietary. All rights reserved.

The repository does not contain a relevant license file.

Before submission, choose one:

- Add a license appropriate to the owner's intended distribution, or
- Make the repository private and share it with the required judging addresses.

### 11.2 README improvements

The Build Week README should include:

1. Problem and narrow target audience.
2. A 30-second quick demo path.
3. Architecture diagram.
4. GPT-5.6 model-routing explanation.
5. Responses API and Structured Outputs usage.
6. Before Build Week versus new work.
7. How Codex accelerated implementation.
8. Key decisions made by the human.
9. Local setup and seeded sample data.
10. Test and evaluation commands.
11. Security and privacy boundaries.
12. Known limitations.
13. Live demo and video links.

Avoid claims such as “production ready” until lint, authentication, model readiness, and regression gates support that statement.

## 12. Prioritized Improvement Plan

### P0 — Must complete before submission

| Improvement | Acceptance criteria |
|---|---|
| Establish Build Week baseline | Baseline tag, qualifying dated commits, and `BUILD_WEEK_CHANGELOG.md` |
| Add GPT-5.6 workflow | New core flow uses Responses API and reports the actual GPT-5.6 model |
| Build a public judge demo | `/demo` works without registration and finishes in under 90 seconds |
| Fix provider resolution | Unsupported providers fail at startup; health reports resolved provider/model |
| Protect simulation routes | Ownership or signed-share checks cover HTTP and WebSocket paths |
| Add a valid repository-sharing strategy | License present or private repo shared with judges |
| Create reliable smoke tests | Demo, schema, auth, provider, and deployment checks pass |
| Prepare submission evidence | README, Codex session ID, video, sample data, and live URL |

### P1 — Strongly recommended

| Improvement | Why it matters |
|---|---|
| Crisis Council and conflict view | Makes the multi-agent system visibly novel |
| Counterfactual baseline | Demonstrates measurable value beyond role-play |
| Trace and cost panel | Makes GPT-5.6 usage inspectable by judges |
| Human approval gate | Clarifies that the tool supports rather than replaces decisions |
| Product claim reframing | Improves trust and reduces ethical overclaiming |
| Repair demo-path lint errors | Reduces failure risk during judging |

### P2 — After submission if time remains

- Break up large frontend and service files.
- Add complete CI gates.
- Add screenshot-based responsive and accessibility QA.
- Introduce durable simulation-job persistence and resume.
- Expand observability and production incident diagnostics.
- Add organization-level roles, retention controls, and audit logs.

## 13. Recommended Execution Schedule

### 19–20 July: eligibility and vertical slice

- Create the Build Week baseline and branch.
- Recover only useful Agent Society concepts.
- Implement the new GPT-5.6 Crisis Council path.
- Add strict schemas and provider diagnostics.
- Build the public seeded demo.
- Fix critical ownership and WebSocket authorization.

### 20–21 July: proof and quality

- Add golden scenarios and production smoke tests.
- Add trace, cost, and counterfactual views.
- Repair lint errors on the demo path.
- Write the English Build Week README.
- Verify the exact deployed commit.

### 21 July: submission

- Record a video no longer than 2 minutes 40 seconds.
- Show the problem, live demo, visible GPT-5.6 trace, human decision, and counterfactual result.
- Explain the use of Codex.
- Add the `/feedback` session ID.
- Submit by approximately **22 July, 04:00 WIB**, preserving a three-hour buffer.

## 14. Final Recommendation

Do not spend the remaining Build Week time performing a broad redesign or adding many unrelated features.

The strongest submission is a narrow, complete vertical slice:

1. One engineering-team crisis.
2. Three independent specialists.
3. One visible conflict.
4. One negotiated recommendation.
5. One high-quality critic pass.
6. One human decision.
7. One counterfactual comparison.
8. One transparent model/cost trace.

This direction preserves TeamDynamics' existing strengths while creating meaningful new GPT-5.6 work that can be explained clearly, demonstrated in under three minutes, and evaluated against every judging criterion.

