export interface SimulationTimeLabels {
  round: string;
  shortRound: string;
  completed: string;
  timeline: string;
  duration: string;
}

export function getSimulationTimeLabels(
  _isDemo: boolean,
): SimulationTimeLabels {
  if (_isDemo) {
    return {
      round: "Phase",
      shortRound: "P",
      completed: "All Phases Finished",
      timeline: "Phase",
      duration: "Phases Completed",
    };
  }

  return {
    round: "Week",
    shortRound: "W",
    completed: "All Rounds Finished",
    timeline: "Week",
    duration: "Weeks Completed",
  };
}
