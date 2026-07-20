# Dashboard Professional Polish Design

## Goal

Bring the authenticated dashboard to the same simple, elegant, professional
standard as the approved landing page without changing authentication, API
contracts, simulation routes, or other application pages.

## Scope

- Redesign `/dashboard` only.
- Keep the existing simulation fetch and navigation behavior.
- Support first-run, active-simulation, completed-simulation, loading, admin,
  low-credit, light-theme, dark-theme, desktop, and mobile states.
- Stop after implementation and verification so the result can be reviewed
  manually before any other page is changed.

## Visual Direction

The dashboard should feel like the product surface behind the landing page:

- use the same `max-w-7xl`, compact floating navigation, quiet grid backdrop,
  slate/indigo color system, strong Poppins headings, and restrained radii;
- prioritize the user's next decision above aggregate metrics;
- use borders and tonal surfaces instead of decorative glows or fake charts;
- keep motion limited to short entrance transitions and honor reduced motion;
- use professional product copy with no emoji, game-like language, or novelty
  labels.

## Information Hierarchy

1. Navigation and account utilities.
2. Page title, short context, and primary `New Simulation` action.
3. A focused next-action panel:
   - continue the most recent running simulation;
   - review the most recent completed report; or
   - create the first simulation.
4. Four compact, factual metrics: total, running, completed, credits.
5. A concise setup guide for new users only.
6. Simulation history with comparison as the secondary action.

## Interaction and Accessibility

- Use links for navigation and buttons for actions; do not nest interactive
  controls.
- Every icon-only control has a stable accessible name.
- Theme-toggle server and client markup must remain hydration-stable.
- Simulation rows use one primary destination plus an optional separate replay
  link, without nested links.
- All primary mobile controls are at least 44 pixels high.
- At a 390-pixel viewport, the document must not overflow horizontally.
- Status is communicated through icon, label, and color.
- Dates use a deterministic `en-US` abbreviated format.

## Component Boundaries

- `dashboard/page.tsx` owns authentication, fetching, state selection, and page
  composition.
- `dashboard/dashboard-nav.tsx` owns authenticated navigation utilities.
- `dashboard/dashboard-overview.tsx` owns the next-action panel, metrics, and
  first-run guide.
- `dashboard/simulation-history.tsx` owns loading, empty, and history states.
- `dashboard/dashboard-model.ts` owns shared simulation types, labels, status
  metadata, and deterministic formatting helpers.

## Error Handling

The current API remains the source of truth. A failed history request leaves
the dashboard usable and presents an explicit, quiet error message in the
history area instead of silently looking like an empty account.

## Verification

- Source-level regression tests cover semantics, stable theme labeling,
  professional copy, absence of fake chart/random render logic, mobile layout
  constraints, and model helper behavior.
- Focused ESLint and Node tests must pass.
- A production build must pass.
- Rendered desktop and 390-pixel mobile states must be visually inspected with
  no hydration, console, or horizontal-overflow errors.

