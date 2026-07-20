# Dashboard Professional Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish `/dashboard` into a responsive, accessible product surface that matches the approved landing page.

**Architecture:** Keep authentication and fetching in the route component, move display responsibilities into focused dashboard components, and centralize deterministic simulation metadata in a model module. Preserve all existing routes and API contracts.

**Tech Stack:** Next.js 16.2.2, React 19.2.4, TypeScript, Tailwind CSS 4, shadcn/base-ui components, Lucide icons, Framer Motion, Node test runner.

## Global Constraints

- Modify `/dashboard` only; do not change authentication, API contracts, or simulation destination routes.
- Match the approved landing page's grid, width, typography, color, border, and motion language.
- Avoid nested interactive elements, fake chart data, random render values, emoji, and novelty copy.
- Keep primary mobile controls at least 44 pixels high and prevent horizontal overflow at 390 pixels.
- Stop after verification for manual user review; do not commit dashboard changes yet.

---

### Task 1: Dashboard model and regression contract

**Files:**
- Create: `frontend/src/lib/dashboard-model.ts`
- Create: `frontend/tests/dashboard-model.test.mjs`
- Create: `frontend/tests/dashboard-page.test.mjs`

**Interfaces:**
- Produces: `SimulationRecord`, `getSimulationHref(record)`, `getCrisisLabel(value)`, `getSimulationProgress(record)`, `formatSimulationDate(value)`, and `getDashboardSummary(records)`.
- Consumes: no dashboard UI modules.

- [ ] **Step 1: Write failing tests for deterministic helpers and UI source contracts**

Cover zero-round progress, clamped progress, completed/report routing, readable
crisis labels, deterministic date formatting, semantic links, stable theme
labeling, absence of Recharts and `Math.random`, professional copy, and mobile
stacking classes.

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run:
`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-test-isolation=none tests/dashboard-model.test.mjs tests/dashboard-page.test.mjs`

Expected: FAIL because the model and polished component contracts do not exist.

- [ ] **Step 3: Implement the minimal dashboard model**

Create typed, pure helpers with deterministic outputs and no browser
dependencies.

- [ ] **Step 4: Run the model test and confirm it passes**

Run:
`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-test-isolation=none tests/dashboard-model.test.mjs`

Expected: PASS.

### Task 2: Navigation and overview hierarchy

**Files:**
- Create: `frontend/src/components/dashboard/dashboard-nav.tsx`
- Create: `frontend/src/components/dashboard/dashboard-overview.tsx`
- Modify: `frontend/src/app/dashboard/page.tsx`
- Test: `frontend/tests/dashboard-page.test.mjs`

**Interfaces:**
- Consumes: authenticated user fields, admin flag, theme state, summary values,
  selected next simulation, and callbacks supplied by the route.
- Produces: semantic dashboard navigation, primary next action, factual metrics,
  and a dismissible first-run guide.

- [ ] **Step 1: Build a floating authenticated navbar derived from the landing navbar**

Use a `max-w-7xl` rounded glass container, semantic pricing/admin links, a
stable `Toggle color theme` label, and accessible 40–44 pixel controls.

- [ ] **Step 2: Build the next-action and metric overview**

Choose running, then completed, then first-run as the action priority. Replace
sparklines with factual icon metrics and put the primary CTA beside the page
heading on desktop and below it on mobile.

- [ ] **Step 3: Replace novelty onboarding copy**

Use three product-oriented steps: configure a scenario, observe the response,
and review the decision brief. Keep all supporting text at least 12 pixels.

- [ ] **Step 4: Run the focused source regression test**

Run:
`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-test-isolation=none tests/dashboard-page.test.mjs`

Expected: the navigation and overview assertions pass.

### Task 3: Responsive simulation history

**Files:**
- Create: `frontend/src/components/dashboard/simulation-history.tsx`
- Modify: `frontend/src/app/dashboard/page.tsx`
- Test: `frontend/tests/dashboard-page.test.mjs`

**Interfaces:**
- Consumes: simulations, loading flag, request error, status metadata, and model
  helpers.
- Produces: accessible loading, error, empty, and history states with primary
  links and independent replay links.

- [ ] **Step 1: Implement semantic history rows**

Make the title/details area the primary link, keep replay as a sibling link,
and present status/date/progress without a click-handler card wrapper.

- [ ] **Step 2: Implement mobile reflow and empty/error states**

Stack the section actions and row metadata below 640 pixels, preserve scenario
context, use 44-pixel actions, and remove infinite animation.

- [ ] **Step 3: Run focused tests and lint**

Run:
`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-test-isolation=none tests/dashboard-model.test.mjs tests/dashboard-page.test.mjs`

Run:
`npx eslint src/app/dashboard/page.tsx src/components/dashboard src/lib/dashboard-model.ts`

Expected: PASS with no ESLint errors.

### Task 4: Production and rendered verification

**Files:**
- Verify only; no planned source changes unless a regression is found.

**Interfaces:**
- Consumes: completed dashboard implementation.
- Produces: evidence that desktop/mobile rendering and production compilation
  satisfy the design contract.

- [ ] **Step 1: Run the relevant frontend test suite**

Run:
`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-test-isolation=none tests/demo-api.test.mjs tests/landing-page.test.mjs tests/landing-hydration.test.mjs tests/landing-content.test.mjs tests/dashboard-model.test.mjs tests/dashboard-page.test.mjs`

Expected: PASS.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: Next.js compiles and generates `/dashboard`.

- [ ] **Step 3: Inspect rendered desktop and mobile states**

Check first-run and active-history states at 1440 and 390 pixels. Confirm no
horizontal overflow, hydration mismatch, console errors, nested interactive
controls, or clipped primary actions.

- [ ] **Step 4: Hand off for manual review**

Summarize the changed dashboard surfaces and verification evidence. Do not
change another route or create a commit before user approval.

