# TeamDynamics Landing Page Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the TeamDynamics landing page into a professional, accessible,
responsive decision-simulation experience while preserving its current visual
identity.

**Architecture:** Keep `app/page.tsx` server-rendered for static marketing
content. Isolate theme/auth navigation and pressure interaction in two small
client components, and put pressure calculations in a pure tested helper.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4,
Radix Slider, Base UI Button, Lucide icons, Node test runner.

## Global Constraints

- Preserve the existing dark slate, technical grid, indigo accent, glass
  navigation, headline, and pressure simulator.
- Do not redesign any non-landing route.
- Do not add dependencies, testimonials, pricing, fake metrics, or new routes.
- Use one interactive element per action.
- Respect `prefers-reduced-motion`.
- Keep the public demo available without authentication.
- Do not write Git commits during this run because the shared `.git` directory is
  read-only and the user requested a manual visual review checkpoint.

---

### Task 1: Lock Pressure and Accessibility Behavior with Failing Tests

**Files:**

- Create: `frontend/tests/landing-page.test.mjs`
- Create after RED verification: `frontend/src/lib/landing-pressure.ts`

**Interfaces:**

- Produces: `getPressureSnapshot(value: number): PressureSnapshot`
- Produces: `getPressureAriaValue(snapshot: PressureSnapshot): string`

- [ ] **Step 1: Write a failing pressure-model test**

Test the 0–100 clamp, the output peak at pressure 65, smooth decline after the
peak, state-band boundaries, and descriptive screen-reader text.

- [ ] **Step 2: Write failing source-invariant tests**

Assert that the route is not a client component, landing links do not wrap
buttons, reduced-motion handling exists, and the slider exposes thumb labeling.

- [ ] **Step 3: Run RED verification**

Run:

```powershell
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-test-isolation=none tests/landing-page.test.mjs
```

Expected: test failures because the helper and required landing structure do not
exist yet.

- [ ] **Step 4: Implement the pure pressure helper**

Create typed snapshot and accessibility helpers with safe clamping and a
continuous output curve.

- [ ] **Step 5: Run the pressure tests**

Use the same Node command. Pressure-model assertions should pass while source
invariants remain red until Tasks 2–4.

### Task 2: Build Accessible Responsive Navigation

**Files:**

- Create: `frontend/src/components/landing/landing-nav.tsx`
- Modify: `frontend/src/app/page.tsx`

**Interfaces:**

- Consumes: `useTheme`, `useAuth`, `buttonVariants`
- Produces: `LandingNav(): JSX.Element`

- [ ] **Step 1: Implement one-element navigation actions**

Use styled `Link` elements for destinations and a real `Button` only for theme
switching. Replace the handwritten GitHub SVG with the existing Lucide icon.

- [ ] **Step 2: Implement the compact mobile state**

Hide the wordmark below 520 px, hide secondary navigation below its breakpoint,
and keep a 40 px theme control plus compact public action visible.

- [ ] **Step 3: Run the source-invariant test**

Expected: the nested-control assertion passes.

### Task 3: Build the Interactive Hero

**Files:**

- Create: `frontend/src/components/landing/interactive-hero.tsx`
- Modify: `frontend/src/components/ui/slider.tsx`

**Interfaces:**

- Consumes: `getPressureSnapshot`, `getPressureAriaValue`, `buttonVariants`
- Extends: `SliderProps` with `thumbClassName`, `thumbAriaLabel`, and
  `getThumbAriaValueText`
- Produces: `InteractiveHero(): JSX.Element`

- [ ] **Step 1: Implement scalar pressure state**

Use a single number, derive the snapshot during render, and keep the state local
to the hero.

- [ ] **Step 2: Implement the approved hero copy and CTA order**

Make `Run 2-minute demo` the primary action and `Build a scenario` secondary.

- [ ] **Step 3: Fix the reactive color treatment**

Select complete gradient classes per pressure state instead of combining a fixed
arbitrary gradient with ineffective `from-*`/`to-*` utilities.

- [ ] **Step 4: Extend slider thumb accessibility**

Apply a landing-only 44 px interaction row, a 20 px visible thumb, an accessible
name, and pressure-specific value text.

- [ ] **Step 5: Remove perpetual motion**

Use short CSS transitions with `motion-reduce:transition-none`; do not use
infinite shake, pulse, bounce, or arrow loops.

- [ ] **Step 6: Run the landing tests**

Expected: pressure and reduced-motion/slider assertions pass.

### Task 4: Recompose the Server Landing Page

**Files:**

- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/layout.tsx`

**Interfaces:**

- Consumes: `LandingNav`, `InteractiveHero`
- Produces: server-rendered workflow, roster, footer, and landing metadata

- [ ] **Step 1: Replace the monolithic client page**

Compose the client islands and static sections from the server route.

- [ ] **Step 2: Rewrite the feature section as a workflow**

Use an `h2` section heading and three `h3` steps: configure, observe, review.

- [ ] **Step 3: Reposition the persona roster**

Describe configurable personas in neutral professional language, preserve the
four-card grid, and use correct heading levels.

- [ ] **Step 4: Update font weight and metadata**

Load Poppins 800 and use professional landing metadata.

- [ ] **Step 5: Run all landing tests**

Expected: all landing tests pass.

### Task 5: Static Verification

**Files:**

- Verify all changed frontend files

- [ ] **Step 1: Run all unit tests without process isolation**

```powershell
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --experimental-test-isolation=none tests/demo-api.test.mjs tests/landing-page.test.mjs
```

- [ ] **Step 2: Run full frontend lint**

```powershell
npm run lint
```

- [ ] **Step 3: Run the production build**

```powershell
npm run build
```

- [ ] **Step 4: Inspect the scoped diff**

Confirm that no non-landing application page or backend file was modified by
this implementation.

### Task 6: Rendered Desktop and Mobile QA

**Files:**

- Temporary screenshots outside committed source

- [ ] **Step 1: Start the local frontend**

Use the repository's `npm run dev` command and preserve the requested localhost
host.

- [ ] **Step 2: Verify desktop**

Check page identity, visible content, console health, pressure interaction, theme
toggle, CTA destinations, and first-viewport balance.

- [ ] **Step 3: Verify 390 px mobile**

Check header containment, CTA stacking, slider touch size, readable labels, and
absence of horizontal overflow.

- [ ] **Step 4: Compare against the accepted identity**

Inspect at least headline, nav, grid/palette, simulator, typography, section
order, and motion. Fix any material drift or professional-quality issue.

- [ ] **Step 5: Remove temporary QA artifacts**

Keep source and user-owned audit artifacts intact; remove only files created
solely for this QA run.
