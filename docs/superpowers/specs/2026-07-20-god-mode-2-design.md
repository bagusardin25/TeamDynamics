# God Mode 2.0 Design

## Scope

Implement Wave 2 from `SIMULATION_UX_AUDIT.md` without changing the simulation page's three-column layout. The existing bottom intervention region remains in place and becomes a backend-authoritative Observe/Intervene console.

## Product contract

- The console opens in **Observe** mode.
- Entering **Intervene** pauses simulation progression at the next safe agent boundary.
- Every intervention identifies a target and category.
- Preset and custom commands show a deterministic preview computed from current state.
- Commands that affect people, project resources, deadlines, or incidents require explicit confirmation.
- Applying an intervention creates a receipt containing target, category, command, preview, actual effects, timestamp, response state, and undo state.
- Undo is available only for the latest reversible intervention, while the simulation is paused, before an agent acknowledges it, and in the same round.
- The next eligible agent turn acknowledges an applied intervention.
- Scripted demo commands use curated acknowledgements. Free-form wording does not branch the demo story and is labelled as category-based metric behavior.
- Standard simulations pass the intervention context into the next eligible LLM turn.
- Applied intervention receipts remain visible in the console and are included with the completed outcome.

## Architecture

### Backend domain

Create `backend/services/interventions.py` as the single source of truth for:

- target and category validation;
- deterministic effect planning;
- preview generation;
- state application and rollback snapshots;
- safe-undo eligibility;
- public receipt serialization;
- deterministic demo acknowledgement copy.

The active simulation state stores `interventions`, `pending_intervention_id`, and `step_remaining`. These fields are serialized through Redis. Intervention receipts are also embedded in the system message `state_changes_json` so PostgreSQL reconstruction can recover the audit trail without a new migration.

### API and runtime

Extend the existing intervention API with:

- `POST /api/simulation/{id}/interventions/preview`;
- enriched `POST /api/simulation/{id}/intervene`;
- `POST /api/simulation/{id}/interventions/{intervention_id}/undo`;
- `POST /api/simulation/{id}/control` for pause, resume, and one-agent step.

The existing WebSocket intervention message remains compatible by defaulting legacy calls to an all-team target and the preset category.

The simulation loop checks paused state before each agent exchange. A one-step command permits one full agent exchange, including its decision and critical events, then returns to paused state.

### Frontend

Extend `useSimulationSocket` to expose:

- intervention history;
- preview, apply, and undo mutations;
- pause, resume, and step controls;
- mutation error and pending state.

The existing `InterventionPanel` keeps the same page region. Observe mode shows simulation controls and recent receipts. Intervene mode adds target, category, command, preview, confirmation, and apply controls. Preset actions populate the form instead of applying immediately.

### Outcome integration

The completion payload includes public intervention receipts. `OutcomeSummaryCard` lists applied, non-undone interventions and their actual effects. This is intentionally limited to traceability; the broader causal-outcome redesign remains Wave 3.

## Data contract

```ts
type InterventionTargetKind = "all_team" | "agent" | "project" | "decision_process";
type InterventionCategory = "people" | "time_scope" | "resources" | "policy" | "incident";
type InterventionStatus = "applied" | "undone";
type InterventionResponseStatus = "pending" | "acknowledged" | "metrics_only";

interface InterventionEffect {
  scope: string;
  key: string;
  label: string;
  before: number | null;
  delta: number;
  after: number | null;
  unit: "%" | "step";
}

interface InterventionReceipt {
  id: string;
  type: "bonus" | "pizza" | "cancel_overtime" | "custom";
  command: string;
  category: InterventionCategory;
  target: {
    kind: InterventionTargetKind;
    id?: string;
    label: string;
  };
  preview_effects: InterventionEffect[];
  actual_effects: InterventionEffect[];
  applied_round: number;
  applied_at: string;
  status: InterventionStatus;
  response_status: InterventionResponseStatus;
  acknowledged_by?: string;
  confirmation_required: boolean;
  can_undo: boolean;
  semantics: "preset" | "category_based";
}
```

## Deterministic behavior

- Preset actions retain their existing personality-adjusted agent effects.
- Custom actions do not parse free-form semantics. Their effects come only from category and target.
- All-team and agent targets alter selected agent state.
- Project targets alter world-state fields using a fixed category map.
- Decision-process targets record a no-direct-metric-change receipt and prime the next agent acknowledgement.
- Preview uses the same planner as apply, including bounds, so preview and actual effects are directly comparable unless concurrent state changes occur before apply.

## Error handling

- Invalid agent targets return `422`.
- Completed simulations reject preview, apply, undo, and control mutations with `409`.
- Apply requires the current preview token; stale previews are rejected with `409`.
- Undo returns `409` when a later turn, a later intervention, an acknowledgement, or an unpaused simulation has invalidated it.
- Frontend keeps the form open and shows the API error without discarding user input.

## Accessibility

- Observe/Intervene and simulation controls use real buttons with pressed/expanded state.
- Target and category controls have visible labels.
- Preview and receipt summaries use text labels in addition to color.
- Mutation status uses a polite live region.
- Existing page structure and focus order are preserved.

## Verification

- Backend unit tests cover preview/apply parity, target scoping, confirmation, safe undo, persistence reconstruction, pause/step, and acknowledgement.
- Frontend unit tests cover request validation and required console controls/copy.
- Existing simulation, replay, and report suites remain green.
- Browser QA covers desktop and 390 × 844 mobile: Observe → Intervene → preview → confirm → receipt → undo, plus pause/step and demo acknowledgement.

