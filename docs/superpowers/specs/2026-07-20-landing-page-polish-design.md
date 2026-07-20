# TeamDynamics Landing Page Professional Polish

Date: 2026-07-20  
Status: Approved through the landing-page audit and the user's `oke eksekusi`

## Goal

Make the TeamDynamics landing page feel simpler, more elegant, and more
credible for startup founders, HR/people leaders, and team managers without
replacing the existing visual identity.

## Approved Direction

The current dark slate canvas, technical grid, indigo accent, provocative
headline, glass navigation, and interactive pressure simulator are the accepted
design foundation. This is a surgical polish pass, not a generic SaaS redesign.

Professionalism comes from:

- clearer audience and product language;
- one obvious low-friction first action;
- restrained motion and effect density;
- accessible, semantically correct controls;
- deliberate mobile behavior;
- real product workflow instead of theatrical claims.

## Information Architecture

The landing-page section order remains:

1. Navigation
2. Hero with interactive pressure simulator
3. Three-step product workflow
4. Example simulation roster
5. Footer

No testimonials, pricing, invented metrics, or additional product routes will be
introduced.

## Above-the-Fold Copy

Allowed visible copy:

- Brand: `TeamDynamics`
- Product status: `Beta`
- Navigation: `Docs`, `GitHub Repository`, `Sign In`, `Quick Demo`, `Dashboard`
- Audience line: `AI scenario simulator for founders & people leaders`
- Headline: `What happens when you push them too hard?`
- Supporting copy: `Stress-test a simulated team, introduce a crisis, and
  observe how morale, communication, and output change under pressure.`
- Primary CTA: `Run 2-minute demo`
- Secondary CTA: `Build a scenario`
- Simulator title: `Pressure Simulator`
- Simulator scale: `Stable`, `Strained`, `Burnout risk`
- Simulator metrics: `Morale`, `Illustrative output`

The copy must describe simulated scenarios and risk signals. It must not claim
to predict exactly when a real person will burn out, quit, or fail.

## Visual System

### Color

- Preserve the existing dark slate background and light theme tokens.
- Preserve indigo as the normal state.
- Use amber for strained pressure and restrained red only for extreme pressure.
- Keep the 40 px technical grid but reduce its visual prominence.
- Keep one ambient glow around the hero and one around the simulator; avoid
  stacking additional decorative effects.

### Typography

- Continue using Poppins.
- Load weights 400, 500, 600, 700, and 800.
- Use 800 for the hero rather than synthesized 900.
- Keep body copy at 16–20 px and UI labels at 11–13 px.
- Maintain the provocative scale of the hero while reducing the desktop maximum
  enough to produce more controlled line breaks.

### Shape and Elevation

- Preserve the rounded glass navigation and simulator panel.
- Use 12–24 px radii according to component size.
- Reduce heavy shadows and hover movement; borders and spacing should carry most
  of the hierarchy.

### Motion

- Remove perpetual headline shaking, bouncing warning icons, and looping CTA
  arrows.
- Keep short color, border, and position transitions.
- All non-essential transitions must stop under `prefers-reduced-motion`.

## Responsive Behavior

- At widths below 520 px, show the logo mark without the full wordmark.
- Keep the theme control and one compact primary action visible.
- Hide secondary navigation until wider breakpoints.
- No horizontal clipping may be masked by the page root.
- Hero actions stack on narrow screens.
- Simulator padding and type scale reduce without shrinking touch targets.

## Accessibility

- Every destination is one interactive element; no `Link > Button` nesting.
- The logo is a semantic home link.
- Navigation has an accessible label.
- The slider thumb has an accessible name and pressure-specific value text.
- Slider interaction target is at least 44 px high in the landing hero.
- Feature cards follow an `h2` then `h3` hierarchy.
- Persona cards use `h3` headings.
- Focus-visible states remain visible in both themes.

## Component Architecture

- `frontend/src/app/page.tsx` becomes a server-rendered landing shell containing
  static workflow, roster, and footer content.
- `frontend/src/components/landing/landing-nav.tsx` owns authentication-aware
  navigation and theme switching.
- `frontend/src/components/landing/interactive-hero.tsx` owns pressure state and
  the reactive simulator.
- `frontend/src/lib/landing-pressure.ts` owns the deterministic illustrative
  pressure model.
- `frontend/src/components/ui/slider.tsx` gains optional thumb accessibility and
  styling props without changing existing callers.

This boundary prevents slider updates from re-rendering all static landing-page
sections.

## Pressure Model

- Pressure is clamped to 0–100.
- Morale declines smoothly from 100 to 28.
- Illustrative output rises from 35 to a peak of 85 at pressure 65, then declines
  smoothly to 45 at pressure 100.
- State bands are stable (0–45), strained (46–70), critical (71–90), and extreme
  (91–100).
- Copy identifies the values as illustrative scenario output, not forecasts.

## Error and Edge Handling

- Non-numeric pressure input resolves safely to 0.
- Pressure values below 0 or above 100 are clamped.
- Authentication loading must not block the public demo action.
- Theme controls retain an explicit action label.

## Verification

- Test the pressure curve and boundary handling with Node's built-in test runner.
- Add source invariants for server/client boundaries, nested interactive controls,
  reduced-motion handling, and slider labeling.
- Run focused and full frontend lint.
- Run TypeScript/Next production build.
- Verify desktop and 390 px mobile rendering.
- Exercise theme toggle, pressure slider, and primary demo link.
- Compare the final render with the user-provided current hero screenshot for
  identity preservation, not pixel cloning.

## Scope Guard

Only the landing route and directly required shared primitives are in scope.
The demo, setup, dashboard, authentication, docs, backend, and other pages must
not be visually redesigned in this pass.
