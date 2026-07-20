export interface DemoSimulationResponse {
  id: string;
  status: "idle";
  mode: "demo";
  runtime_model: "scripted-mock";
}

interface DemoPayload {
  detail?: string;
  id?: string;
  status?: string;
  mode?: string;
  runtime_model?: string;
}

export async function createDemoSimulation(
  apiBase: string,
  fetcher: typeof fetch = fetch,
): Promise<DemoSimulationResponse> {
  const normalizedApiBase = apiBase.replace(/\/+$/, "");
  const response = await fetcher(
    `${normalizedApiBase}/api/simulation/demo`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );

  const payload = (await response.json().catch(() => ({}))) as DemoPayload;

  if (!response.ok) {
    throw new Error(payload.detail || "Quick Demo is temporarily unavailable");
  }

  if (
    !payload.id ||
    payload.status !== "idle" ||
    payload.mode !== "demo" ||
    payload.runtime_model !== "scripted-mock"
  ) {
    throw new Error("Quick Demo returned an invalid response");
  }

  return payload as DemoSimulationResponse;
}
