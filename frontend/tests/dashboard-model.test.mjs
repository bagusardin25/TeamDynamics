import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const modelPath = join(
  testDirectory,
  "..",
  "src",
  "lib",
  "dashboard-model.ts",
);

async function loadDashboardModel() {
  if (!existsSync(modelPath)) {
    return {};
  }

  return import(pathToFileURL(modelPath).href);
}

test("builds deterministic dashboard summary values", async () => {
  const model = await loadDashboardModel();

  assert.equal(typeof model.getDashboardSummary, "function");

  const summary = model.getDashboardSummary([
    { status: "running" },
    { status: "completed" },
    { status: "completed" },
    { status: "idle" },
  ]);

  assert.deepEqual(summary, {
    total: 4,
    running: 1,
    completed: 2,
  });
});

test("clamps simulation progress and handles an empty round range", async () => {
  const model = await loadDashboardModel();

  assert.equal(typeof model.getSimulationProgress, "function");
  assert.equal(
    model.getSimulationProgress({ current_round: 0, total_rounds: 0 }),
    0,
  );
  assert.equal(
    model.getSimulationProgress({ current_round: -2, total_rounds: 8 }),
    0,
  );
  assert.equal(
    model.getSimulationProgress({ current_round: 3, total_rounds: 4 }),
    75,
  );
  assert.equal(
    model.getSimulationProgress({ current_round: 12, total_rounds: 10 }),
    100,
  );
});

test("routes and labels simulation records consistently", async () => {
  const model = await loadDashboardModel();

  assert.equal(typeof model.getSimulationHref, "function");
  assert.equal(typeof model.getCrisisLabel, "function");
  assert.equal(
    model.getSimulationHref({ id: "sim-complete", status: "completed" }),
    "/report?id=sim-complete",
  );
  assert.equal(
    model.getSimulationHref({ id: "sim-running", status: "running" }),
    "/simulation?id=sim-running",
  );
  assert.equal(
    model.getCrisisLabel("rnd1"),
    "Mandatory weekend delivery",
  );
  assert.equal(model.getCrisisLabel("Leadership transition"), "Leadership transition");
});

test("formats dates without depending on the browser locale", async () => {
  const model = await loadDashboardModel();

  assert.equal(typeof model.formatSimulationDate, "function");
  assert.equal(
    model.formatSimulationDate("2026-07-20T12:00:00.000Z"),
    "Jul 20, 2026",
  );
  assert.equal(model.formatSimulationDate("not-a-date"), "");
  assert.equal(model.formatSimulationDate(""), "");
});

test("prioritizes the latest running simulation for the next action", async () => {
  const model = await loadDashboardModel();

  assert.equal(typeof model.getPrimarySimulation, "function");

  const completed = {
    id: "completed",
    status: "completed",
    created_at: "2026-07-20T09:00:00.000Z",
  };
  const olderRunning = {
    id: "older-running",
    status: "running",
    created_at: "2026-07-20T08:00:00.000Z",
  };
  const newestRunning = {
    id: "newest-running",
    status: "running",
    created_at: "2026-07-20T10:00:00.000Z",
  };

  assert.equal(
    model.getPrimarySimulation([completed, olderRunning, newestRunning]).id,
    "newest-running",
  );
  assert.equal(model.getPrimarySimulation([completed]).id, "completed");
  assert.equal(model.getPrimarySimulation([]), null);
});

