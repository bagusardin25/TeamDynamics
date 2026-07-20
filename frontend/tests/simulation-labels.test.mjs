import assert from "node:assert/strict";
import test from "node:test";

import * as labels from "../src/lib/simulation-labels.ts";


test("uses phase terminology for the scripted demo", () => {
  assert.equal(typeof labels.getSimulationTimeLabels, "function");
  assert.deepEqual(labels.getSimulationTimeLabels(true), {
    round: "Phase",
    shortRound: "P",
    completed: "All Phases Finished",
    timeline: "Phase",
    duration: "Phases Completed",
  });
});


test("preserves week terminology for standard simulations", () => {
  assert.equal(typeof labels.getSimulationTimeLabels, "function");
  assert.deepEqual(labels.getSimulationTimeLabels(false), {
    round: "Week",
    shortRound: "W",
    completed: "All Rounds Finished",
    timeline: "Week",
    duration: "Weeks Completed",
  });
});
