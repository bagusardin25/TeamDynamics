# TeamDynamics Color Contrast Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strengthen TeamDynamics card and control contrast in both themes while preserving the existing layout and semantic color system.

**Architecture:** Keep all palette decisions in the existing OKLCH semantic tokens in `globals.css`, then make the shared Card primitive consume the border token. Add a focused source-contract test that checks the selected token values, calculated input contrast, and Card ring utility.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Node.js built-in test runner, Chrome Browser plugin.

## Global Constraints

- Do not change layout, spacing, sizing, responsive breakpoints, DOM structure, typography, navigation, animation, or copy.
- Do not change semantic red, green, amber, chart, or agent-avatar colors.
- Preserve every unrelated working-tree change.
- Modify only `frontend/src/app/globals.css`, `frontend/src/components/ui/card.tsx`, and the focused test file during implementation.
- Do not add dependencies.
- Do not commit generated screenshots or audit artifacts.

---

## File Structure

- Create `frontend/tests/color-system.test.mjs`: verify the exact semantic token contract, calculated input contrast, and Card border utility.
- Modify `frontend/src/app/globals.css`: refine existing light and dark semantic color values.
- Modify `frontend/src/components/ui/card.tsx`: route Card outlines through `ring-border`.

### Task 1: Lock the color-system contract with a failing test

**Files:**
- Create: `frontend/tests/color-system.test.mjs`
- Test: `frontend/tests/color-system.test.mjs`

**Interfaces:**
- Consumes: CSS custom properties in `frontend/src/app/globals.css` and the Card class string in `frontend/src/components/ui/card.tsx`.
- Produces: a source-contract test executable with `node --test tests/color-system.test.mjs`.

- [ ] **Step 1: Create the focused source-contract test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const globals = await readFile(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);
const card = await readFile(
  new URL("../src/components/ui/card.tsx", import.meta.url),
  "utf8",
);

const rootBlock = globals.slice(
  globals.indexOf(":root {"),
  globals.indexOf(".dark {"),
);
const darkBlock = globals.slice(globals.indexOf(".dark {"));

function parseToken(block, name) {
  const match = block.match(
    new RegExp(`--${name}:\\\\s*oklch\\\\(([^)]+)\\\\)`),
  );
  assert.ok(match, `--${name} should be present`);
  return match[1].trim().split(/\\s+/).map(Number);
}

function relativeLuminance([lightness, chroma, hue]) {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;
  const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return (
    0.2126 * Math.max(0, red) +
    0.7152 * Math.max(0, green) +
    0.0722 * Math.max(0, blue)
  );
}

function contrast(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

test("uses the approved light color tokens", () => {
  assert.deepEqual(parseToken(rootBlock, "primary"), [0.4, 0.16, 270]);
  assert.deepEqual(parseToken(rootBlock, "accent"), [0.96, 0.025, 285]);
  assert.deepEqual(parseToken(rootBlock, "border"), [0.86, 0.015, 250]);
  assert.deepEqual(parseToken(rootBlock, "input"), [0.66, 0.015, 250]);
  assert.deepEqual(parseToken(rootBlock, "ring"), [0.4, 0.16, 270]);
  assert.deepEqual(parseToken(rootBlock, "sidebar-primary"), [0.4, 0.16, 270]);
  assert.deepEqual(parseToken(rootBlock, "sidebar-border"), [0.86, 0.015, 250]);
});

test("uses the approved dark color tokens", () => {
  assert.deepEqual(parseToken(darkBlock, "primary"), [0.84, 0.11, 270]);
  assert.deepEqual(parseToken(darkBlock, "accent"), [0.28, 0.035, 285]);
  assert.deepEqual(parseToken(darkBlock, "border"), [0.36, 0.015, 255]);
  assert.deepEqual(parseToken(darkBlock, "input"), [0.5, 0.015, 255]);
  assert.deepEqual(parseToken(darkBlock, "ring"), [0.84, 0.11, 270]);
  assert.deepEqual(parseToken(darkBlock, "sidebar-primary"), [0.84, 0.11, 270]);
  assert.deepEqual(parseToken(darkBlock, "sidebar-border"), [0.36, 0.015, 255]);
});

test("keeps input boundaries at 3:1 against card surfaces", () => {
  assert.ok(
    contrast(parseToken(rootBlock, "card"), parseToken(rootBlock, "input")) >= 3,
  );
  assert.ok(
    contrast(parseToken(darkBlock, "card"), parseToken(darkBlock, "input")) >= 3,
  );
});

test("routes Card outlines through the semantic border token", () => {
  assert.match(card, /ring-1 ring-border/);
  assert.doesNotMatch(card, /ring-foreground\\/10/);
});
```

- [ ] **Step 2: Run the test and verify the current palette fails**

Run:

```powershell
cd frontend
node --test tests/color-system.test.mjs
```

Expected: FAIL in the light-token, dark-token, input-contrast, and Card-outline tests because the approved values and `ring-border` are not implemented yet.

### Task 2: Implement the semantic color refinement

**Files:**
- Modify: `frontend/src/app/globals.css:51-117`
- Modify: `frontend/src/components/ui/card.tsx:15`
- Test: `frontend/tests/color-system.test.mjs`

**Interfaces:**
- Consumes: the token names and values asserted by Task 1.
- Produces: the same Tailwind semantic interfaces (`primary`, `accent`, `border`, `input`, `ring`, `sidebar-primary`, and `sidebar-border`) with improved contrast.

- [ ] **Step 1: Update the light theme tokens**

In `:root`, use:

```css
  --primary: oklch(0.40 0.16 270); /* Deep violet-indigo with high CTA contrast */
  --accent: oklch(0.96 0.025 285);
  --border: oklch(0.86 0.015 250);
  --input: oklch(0.66 0.015 250);
  --ring: oklch(0.40 0.16 270);
  --sidebar-primary: oklch(0.40 0.16 270);
  --sidebar-border: oklch(0.86 0.015 250);
```

Leave all other light-theme values unchanged.

- [ ] **Step 2: Update the dark theme tokens**

In `.dark`, use:

```css
  --primary: oklch(0.84 0.11 270); /* Pale violet-indigo with dark CTA text */
  --accent: oklch(0.28 0.035 285);
  --border: oklch(0.36 0.015 255);
  --input: oklch(0.50 0.015 255);
  --ring: oklch(0.84 0.11 270);
  --sidebar-primary: oklch(0.84 0.11 270);
  --sidebar-border: oklch(0.36 0.015 255);
```

Leave all other dark-theme values unchanged.

- [ ] **Step 3: Make Card use the border token**

In `frontend/src/components/ui/card.tsx`, change only the ring color utility:

```tsx
"group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-border has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl"
```

- [ ] **Step 4: Run the focused test**

Run:

```powershell
cd frontend
node --test tests/color-system.test.mjs
```

Expected: 4 tests pass, 0 fail.

- [ ] **Step 5: Review the scoped diff**

Run:

```powershell
git diff -- frontend/src/app/globals.css frontend/src/components/ui/card.tsx frontend/tests/color-system.test.mjs
```

Expected: only the approved color values, Card ring utility, and focused test are present; no layout utilities or unrelated files appear.

- [ ] **Step 6: Commit the implementation**

```powershell
git add -- frontend/src/app/globals.css frontend/src/components/ui/card.tsx frontend/tests/color-system.test.mjs
git commit -m "fix(ui): strengthen theme color contrast"
```

### Task 3: Verify rendered behavior and regression safety

**Files:**
- Verify: `frontend/src/app/globals.css`
- Verify: `frontend/src/components/ui/card.tsx`
- Verify: `frontend/tests/color-system.test.mjs`

**Interfaces:**
- Consumes: the implementation commit from Task 2.
- Produces: command and browser evidence that color contrast improved without layout regressions.

- [ ] **Step 1: Run static checks**

Run:

```powershell
cd frontend
npm run lint
npm run test:unit
npm run build
```

Expected: every command exits with code 0. If the production build fails only because Google Fonts cannot be fetched, record that network-specific failure and verify TypeScript through the completed Next.js compilation stage.

- [ ] **Step 2: Start the existing frontend**

Run:

```powershell
cd frontend
npm run dev
```

Expected: Next.js reports a local URL and serves the current application without a framework error overlay.

- [ ] **Step 3: Validate the desktop Dashboard flow in Chrome**

Use the Chrome Browser plugin with the flow:

```text
Dashboard loads -> light theme is captured -> theme toggle switches to dark ->
dark theme is captured -> card and control boundaries remain visible without
movement, clipping, or wrapping changes.
```

Check:

- URL and title identify TeamDynamics Dashboard.
- DOM snapshot contains meaningful dashboard content.
- No Next.js error overlay is visible.
- Console has no relevant warnings or errors.
- Card borders are visibly stronger in both themes.
- Primary CTA remains readable.

- [ ] **Step 4: Validate Setup and a mobile viewport in Chrome**

Check the Setup context, team, and review steps at the existing desktop viewport,
then use a mobile-sized viewport for Dashboard or Setup.

Expected:

- Inputs and selects have distinct inactive boundaries.
- Selected steps and pacing cards remain distinguishable.
- Semantic amber, red, green, and agent colors are unchanged.
- No spacing, sizing, layout, wrapping, clipping, or responsive regression is visible.

- [ ] **Step 5: Report evidence and remaining risk**

Summarize:

- Files changed and exact user-visible effect.
- Focused test, lint, unit-test, and build results.
- Desktop and mobile URLs/viewports checked.
- Light/dark theme interaction result.
- Console status and any environment-only limitation.
- Before/after screenshot evidence, without committing screenshots.
