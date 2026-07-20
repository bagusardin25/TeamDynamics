import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(testDirectory, "..");
const pagePath = join(frontendRoot, "src", "app", "dashboard", "page.tsx");
const componentDirectory = join(
  frontendRoot,
  "src",
  "components",
  "dashboard",
);
const expectedComponentPaths = [
  join(componentDirectory, "dashboard-nav.tsx"),
  join(componentDirectory, "dashboard-overview.tsx"),
  join(componentDirectory, "simulation-history.tsx"),
];

function readDashboardSource() {
  const sources = [readFileSync(pagePath, "utf8")];

  for (const componentPath of expectedComponentPaths) {
    if (existsSync(componentPath)) {
      sources.push(readFileSync(componentPath, "utf8"));
    }
  }

  return sources.join("\n");
}

test("splits the dashboard into focused product components", () => {
  for (const componentPath of expectedComponentPaths) {
    assert.equal(
      existsSync(componentPath),
      true,
      `${componentPath} should exist`,
    );
  }

  const pageSource = readFileSync(pagePath, "utf8");
  assert.match(pageSource, /<DashboardNav\b/);
  assert.match(pageSource, /<DashboardOverview\b/);
  assert.match(pageSource, /<SimulationHistory\b/);
});

test("matches the landing page visual system and responsive container", () => {
  const source = readDashboardSource();

  assert.match(source, /max-w-7xl/);
  assert.match(source, /bg-size-\[40px_40px\]/);
  assert.match(source, /rounded-2xl/);
  assert.match(source, /tracking-\[-0\.035em\]/);
  assert.match(source, /flex-col gap-4 sm:flex-row/);
  assert.match(source, /min-h-11/);
  assert.doesNotMatch(source, /text-\[10px\]/);
});

test("keeps dashboard navigation hydration-stable and semantic", () => {
  const source = readDashboardSource();

  assert.match(source, /aria-label="Dashboard navigation"/);
  assert.match(source, /aria-label="Toggle color theme"/);
  assert.doesNotMatch(
    source,
    /aria-label=\{resolvedTheme === "dark" \? "Switch to light theme"/,
  );
  assert.doesNotMatch(
    source,
    /<Link\b[^>]*>\s*<Button\b/s,
    "navigation destinations must not wrap buttons",
  );
  assert.doesNotMatch(source, /role="link"/);
});

test("reads persisted guide state through a hydration-safe store", () => {
  const pageSource = readFileSync(pagePath, "utf8");

  assert.match(pageSource, /useSyncExternalStore/);
  assert.match(pageSource, /getGuideVisibilityServerSnapshot/);
  assert.doesNotMatch(
    pageSource,
    /useEffect\(\(\) => \{\s*setShowGuide/s,
  );
});

test("prioritizes professional next actions over decorative metrics", () => {
  const source = readDashboardSource();

  assert.match(source, /Continue simulation/);
  assert.match(source, /Review decision brief/);
  assert.match(source, /Create your first simulation/);
  assert.match(source, /New Simulation/);
  assert.match(source, /Compare simulations/);
  assert.doesNotMatch(source, /Math\.random/);
  assert.doesNotMatch(source, /recharts|ResponsiveContainer|AreaChart/);
  assert.doesNotMatch(
    source,
    /God Mode|pizza party|unexpected chaos|Simulation Sandbox|ðŸ|🎉|🍕|👋/,
  );
});

test("uses finite motion and preserves a reduced-motion path", () => {
  const source = readDashboardSource();

  assert.doesNotMatch(source, /repeat:\s*Infinity|animate-bounce/);
  assert.match(source, /motion-reduce:transition-none/);
});

test("renders explicit history states with valid interaction structure", () => {
  const source = readDashboardSource();

  assert.match(source, /Unable to load simulation history/);
  assert.match(source, /aria-labelledby="simulation-history-title"/);
  assert.match(source, /data-testid=\{`simulation-row-\$\{simulation\.id\}`\}/);
  assert.match(source, /href=\{getSimulationHref\(simulation\)\}/);
  assert.doesNotMatch(
    source,
    /onClick=\{\(\) => router\.push\(href\)\}/,
    "history rows should use native links instead of click-handler cards",
  );
  assert.doesNotMatch(
    source,
    /<Link\b[^>]*>\s*<article\b/s,
    "history rows should not wrap sibling actions in a link",
  );
});

