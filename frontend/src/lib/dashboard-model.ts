export interface SimulationRecord {
  id: string;
  status: string;
  current_round: number;
  total_rounds: number;
  company_name: string;
  crisis_scenario: string;
  pacing: string;
  created_at: string;
}

export interface DashboardSummary {
  total: number;
  running: number;
  completed: number;
}

const CRISIS_LABELS: Record<string, string> = {
  rnd1: "Mandatory weekend delivery",
  rnd2: "Workforce reduction",
  rnd3: "Leadership transition",
  rnd4: "Critical data loss",
  custom: "Custom scenario",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function getDashboardSummary(
  simulations: ReadonlyArray<{ status: string }>,
): DashboardSummary {
  let running = 0;
  let completed = 0;

  for (const simulation of simulations) {
    if (simulation.status === "running") {
      running += 1;
    } else if (simulation.status === "completed") {
      completed += 1;
    }
  }

  return {
    total: simulations.length,
    running,
    completed,
  };
}

export function getSimulationProgress(
  simulation: Pick<SimulationRecord, "current_round" | "total_rounds">,
): number {
  if (simulation.total_rounds <= 0) {
    return 0;
  }

  const progress = (simulation.current_round / simulation.total_rounds) * 100;
  return Math.round(Math.min(100, Math.max(0, progress)));
}

export function getSimulationHref(
  simulation: Pick<SimulationRecord, "id" | "status">,
): string {
  return simulation.status === "completed"
    ? `/report?id=${simulation.id}`
    : `/simulation?id=${simulation.id}`;
}

export function getCrisisLabel(crisisScenario: string): string {
  return CRISIS_LABELS[crisisScenario] ?? crisisScenario;
}

export function formatSimulationDate(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return DATE_FORMATTER.format(date);
}

export function getPrimarySimulation(
  simulations: readonly SimulationRecord[],
): SimulationRecord | null {
  let latestRunning: SimulationRecord | null = null;
  let latestPaused: SimulationRecord | null = null;
  let latestCompleted: SimulationRecord | null = null;

  for (const simulation of simulations) {
    const createdAt = Date.parse(simulation.created_at) || 0;

    if (simulation.status === "running") {
      if (
        !latestRunning ||
        createdAt > (Date.parse(latestRunning.created_at) || 0)
      ) {
        latestRunning = simulation;
      }
      continue;
    }

    if (simulation.status === "completed") {
      if (
        !latestCompleted ||
        createdAt > (Date.parse(latestCompleted.created_at) || 0)
      ) {
        latestCompleted = simulation;
      }
      continue;
    }

    if (
      !latestPaused ||
      createdAt > (Date.parse(latestPaused.created_at) || 0)
    ) {
      latestPaused = simulation;
    }
  }

  return latestRunning ?? latestPaused ?? latestCompleted;
}

