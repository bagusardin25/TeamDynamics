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
    new RegExp(`--${name}:\\s*oklch\\(([^)]+)\\)`),
  );
  assert.ok(match, `--${name} should be present`);
  return match[1].trim().split(/\s+/).map(Number);
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
  assert.doesNotMatch(card, /ring-foreground\/10/);
});
