import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(testDirectory, "..");
const pagePath = join(frontendRoot, "src", "app", "page.tsx");
const landingComponentsDirectory = join(
  frontendRoot,
  "src",
  "components",
  "landing",
);
const sliderPath = join(
  frontendRoot,
  "src",
  "components",
  "ui",
  "slider.tsx",
);
const pressureModulePath = join(
  frontendRoot,
  "src",
  "lib",
  "landing-pressure.ts",
);

function readLandingSource() {
  const sources = [readFileSync(pagePath, "utf8"), readFileSync(sliderPath, "utf8")];

  if (existsSync(landingComponentsDirectory)) {
    for (const fileName of readdirSync(landingComponentsDirectory)) {
      if (fileName.endsWith(".tsx")) {
        sources.push(
          readFileSync(join(landingComponentsDirectory, fileName), "utf8"),
        );
      }
    }
  }

  return sources.join("\n");
}

test("models pressure as a bounded, continuous illustrative scenario", async () => {
  let pressureModule;

  if (existsSync(pressureModulePath)) {
    pressureModule = await import(pathToFileURL(pressureModulePath).href);
  }

  assert.equal(
    typeof pressureModule?.getPressureSnapshot,
    "function",
    "landing pressure helper should expose getPressureSnapshot",
  );
  assert.equal(
    typeof pressureModule?.getPressureAriaValue,
    "function",
    "landing pressure helper should expose getPressureAriaValue",
  );

  const belowRange = pressureModule.getPressureSnapshot(-20);
  const peak = pressureModule.getPressureSnapshot(65);
  const beforeDecline = pressureModule.getPressureSnapshot(79);
  const afterDecline = pressureModule.getPressureSnapshot(80);
  const aboveRange = pressureModule.getPressureSnapshot(120);

  assert.equal(belowRange.value, 0);
  assert.equal(aboveRange.value, 100);
  assert.equal(peak.output, 85);
  assert.ok(afterDecline.output < peak.output);
  assert.ok(
    Math.abs(beforeDecline.output - afterDecline.output) <= 2,
    "output should not jump at a pressure boundary",
  );
  assert.equal(pressureModule.getPressureSnapshot(45).tone, "stable");
  assert.equal(pressureModule.getPressureSnapshot(46).tone, "strained");
  assert.equal(pressureModule.getPressureSnapshot(71).tone, "critical");
  assert.equal(pressureModule.getPressureSnapshot(91).tone, "extreme");
  assert.match(
    pressureModule.getPressureAriaValue(afterDecline),
    /illustrative output/i,
  );
});

test("keeps landing interactions semantic and motion considerate", () => {
  const pageSource = readFileSync(pagePath, "utf8");
  const landingSource = readLandingSource();

  assert.doesNotMatch(
    pageSource,
    /^\s*["']use client["'];?/m,
    "the route should remain a server component",
  );
  assert.doesNotMatch(
    landingSource,
    /<Link\b[^>]*>\s*<Button\b/s,
    "a destination must not wrap a second interactive button",
  );
  assert.match(landingSource, /motion-reduce:transition-none/);
  assert.doesNotMatch(landingSource, /repeat:\s*Infinity|animate-bounce/);
  assert.match(landingSource, /thumbAriaLabel/);
  assert.match(landingSource, /getThumbAriaValueText/);
});
