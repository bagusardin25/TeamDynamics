import assert from "node:assert/strict";
import test from "node:test";

import { createDemoSimulation } from "../src/lib/demo-api.ts";


test("creates the fixed demo with POST", async () => {
  let requestedUrl = "";
  let requestedInit;
  const fetcher = async (input, init) => {
    requestedUrl = String(input);
    requestedInit = init;
    return new Response(
      JSON.stringify({
        id: "demo1234",
        status: "idle",
        mode: "demo",
        runtime_model: "gpt-5.6",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await createDemoSimulation("http://localhost:8000/", fetcher);

  assert.equal(requestedUrl, "http://localhost:8000/api/simulation/demo");
  assert.equal(requestedInit?.method, "POST");
  assert.equal(result.id, "demo1234");
  assert.equal(result.runtime_model, "gpt-5.6");
});


test("surfaces a safe backend error", async () => {
  const fetcher = async () =>
    new Response(JSON.stringify({ detail: "Demo is temporarily unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });

  await assert.rejects(
    createDemoSimulation("http://localhost:8000", fetcher),
    /Demo is temporarily unavailable/,
  );
});


test("rejects an invalid successful response", async () => {
  const fetcher = async () =>
    new Response(JSON.stringify({ id: "wrong-shape" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  await assert.rejects(
    createDemoSimulation("http://localhost:8000", fetcher),
    /Quick Demo returned an invalid response/,
  );
});
