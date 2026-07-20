import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const componentDirectory = join(
  testDirectory,
  "..",
  "src",
  "components",
  "dashboard",
);
const overviewSource = readFileSync(
  join(componentDirectory, "dashboard-overview.tsx"),
  "utf8",
);
const historySource = readFileSync(
  join(componentDirectory, "simulation-history.tsx"),
  "utf8",
);

test("keeps mobile metrics compact in a two-column summary", () => {
  assert.match(overviewSource, /grid-cols-2/);
  assert.match(overviewSource, /lg:grid-cols-4/);
  assert.match(overviewSource, /hidden text-xs/);
  assert.match(overviewSource, /sm:block/);
});

test("gives mobile simulation title links a full touch target", () => {
  assert.match(historySource, /href=\{getSimulationHref\(simulation\)\}/);
  assert.match(historySource, /inline-flex min-h-11/);
  assert.match(historySource, /sm:min-h-0/);
});
