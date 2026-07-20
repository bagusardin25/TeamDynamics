# TeamDynamics Color Contrast Refinement

Date: 2026-07-20

## Context

The color audit found that TeamDynamics already has a coherent, release-ready
indigo/slate palette. Primary actions and text contrast are strong, but card
separation and inactive control boundaries are too subtle in both themes,
especially in light mode. The logo also introduces a violet accent that is only
lightly repeated in the application palette.

The frontend centralizes its semantic colors in
`frontend/src/app/globals.css`. Most screens consume those tokens through
Tailwind utilities. The shared Card primitive currently uses
`ring-foreground/10`, which bypasses the semantic border token and keeps card
outlines faint even when `--border` is adjusted.

## Goals

- Improve visual separation between cards, page surfaces, and controls.
- Bring inactive input boundaries to approximately 3:1 contrast against their
  immediate card surface.
- Keep the existing high contrast of primary calls to action.
- Connect the indigo interface more clearly to the violet in the logo.
- Apply the refinement consistently across the application.

## Non-Goals

- No layout, spacing, sizing, responsive breakpoint, DOM structure, typography,
  navigation, animation, or content changes.
- No changes to semantic red, green, amber, chart, or agent-avatar colors.
- No component redesign or new visual pattern.
- No broad refactor of existing page-level Tailwind classes.

## Considered Approaches

### 1. Global tokens plus the shared Card primitive

Adjust the global semantic tokens and make Card use the semantic border token.
This produces consistent behavior with a small, reviewable diff.

This is the selected approach.

### 2. Page-specific utility overrides

Increase border opacity separately on Dashboard and Setup. This offers
fine-grained control but duplicates decisions and leaves other pages visually
inconsistent.

### 3. Full brand palette redesign

Replace the indigo system with a broader violet/gradient identity. This would
strengthen branding but introduces unnecessary visual and regression risk.

## Design

### Light theme

- Keep background and card surfaces unchanged.
- Change `--border` and `--sidebar-border` from
  `oklch(0.92 0.01 240)` to `oklch(0.86 0.015 250)`.
- Change `--input` from `oklch(0.92 0.01 240)` to
  `oklch(0.66 0.015 250)`. This is expected to provide approximately 3.1:1
  contrast against the white card surface.
- Shift `--primary`, `--ring`, and `--sidebar-primary` from hue 260 to hue 270,
  using `oklch(0.40 0.16 270)`. Contrast against the existing light primary
  foreground remains approximately 9.1:1.
- Change `--accent` to a restrained violet-tinted surface:
  `oklch(0.96 0.025 285)`.

### Dark theme

- Keep background and card surfaces unchanged.
- Change `--border` and `--sidebar-border` from
  `oklch(0.30 0.01 255)` to `oklch(0.36 0.015 255)`.
- Change `--input` from `oklch(0.30 0.01 255)` to
  `oklch(0.50 0.015 255)`. This is expected to provide approximately 3.0:1
  contrast against the dark card surface.
- Shift `--primary`, `--ring`, and `--sidebar-primary` to
  `oklch(0.84 0.11 270)`. Contrast against the existing dark primary
  foreground remains approximately 11.9:1.
- Change `--accent` to a restrained violet-tinted surface:
  `oklch(0.28 0.035 285)`.

### Shared Card primitive

Replace `ring-foreground/10` with `ring-border` in
`frontend/src/components/ui/card.tsx`. This makes Card consume the semantic
border token and creates predictable separation in both themes without
changing its dimensions.

## Compatibility and Safety

- Existing semantic Tailwind utilities continue to use the same token names.
- The implementation changes only color values and one ring color utility.
- Existing unrelated working-tree changes must be preserved.
- No generated artifacts or audit screenshots will be included in the
  implementation commit unless explicitly requested.

## Validation

The flow under test is:

`Dashboard loads -> theme toggles -> Dashboard and Setup surfaces, controls, and selected states remain legible without layout movement.`

Validation will cover:

- Dashboard in light and dark themes.
- Setup context, team, and review states.
- Primary CTA, Card, Input, Select, and selected-option states.
- One desktop and one mobile-sized viewport.
- Page identity, meaningful DOM, framework-overlay absence, console health,
  screenshot evidence, and a theme-toggle interaction.
- Frontend lint, unit tests, and production build.

## Acceptance Criteria

- Card and surface separation is visibly stronger in both themes.
- Inactive input boundaries are approximately 3:1 against their card surface.
- Primary CTA contrast remains above 4.5:1.
- Violet branding is more coherent but remains restrained.
- No visible layout, spacing, sizing, wrapping, or responsive regression.
- Existing semantic status colors remain unchanged.
