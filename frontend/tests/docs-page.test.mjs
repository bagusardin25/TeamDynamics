import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(testDirectory, "..");
const pagePath = join(frontendRoot, "src", "app", "docs", "page.tsx");
const layoutPath = join(frontendRoot, "src", "app", "docs", "layout.tsx");
const pageSource = readFileSync(pagePath, "utf8");

test("positions TeamDynamics as decision rehearsal instead of certain prediction", () => {
  assert.match(pageSource, /decision-rehearsal environment/i);
  assert.match(pageSource, /Burnout Risk Signals/);
  assert.doesNotMatch(pageSource, /that predict team dynamics/i);
  assert.doesNotMatch(pageSource, /before it happens in real life/i);
  assert.doesNotMatch(pageSource, /Burnout Prediction/);
});

test("documents the Build Week model boundary and validation evidence", () => {
  for (const expected of [
    "OpenAI Build Week",
    "GPT-5.4",
    "GPT-5.5",
    "GPT-5.6",
    "OpenAI Codex",
    "gpt-4o-mini",
    "TestSprite",
    "deterministic",
  ]) {
    assert.match(pageSource, new RegExp(expected.replace(".", "\\."), "i"));
  }
});

test("offers the public demo as the fastest path", () => {
  assert.match(pageSource, /href="\/demo"/);
  assert.match(pageSource, /Run 2-Minute Demo/);
  assert.match(pageSource, /PDF, DOCX, TXT, CSV, XLSX/);
});

test("documents the current intervention and simulation API", () => {
  for (const endpoint of [
    "/api/simulation/demo",
    "/api/simulation/{id}/interventions/preview",
    "/api/simulation/{id}/interventions/{intervention_id}/undo",
    "/api/simulation/{id}/control",
    "/api/simulation/compare",
    "/api/simulation/{id}/replay",
  ]) {
    assert.match(pageSource, new RegExp(endpoint.replaceAll("/", "\\/")));
  }

  for (const behavior of [
    "Impact Preview",
    "Apply & Record",
    "Undo When Safe",
    "pause, resume, or advance",
  ]) {
    assert.match(pageSource, new RegExp(behavior, "i"));
  }
});

test("keeps mobile docs navigation responsive and accessible", () => {
  assert.match(pageSource, /overflow-x-clip/);
  assert.match(pageSource, /aria-label=\{mobileMenuOpen/);
  assert.match(pageSource, /aria-expanded=\{mobileMenuOpen\}/);
  assert.match(pageSource, /aria-controls="docs-mobile-navigation"/);
  assert.match(pageSource, /aria-current=\{activeSection === item\.id/);
  assert.doesNotMatch(pageSource, /<h4\b/);
});

test("provides page-specific documentation metadata", () => {
  assert.equal(existsSync(layoutPath), true, "docs layout metadata should exist");
  const layoutSource = readFileSync(layoutPath, "utf8");
  assert.match(layoutSource, /title:\s*"TeamDynamics Documentation"/);
  assert.match(layoutSource, /export const metadata/);
});
