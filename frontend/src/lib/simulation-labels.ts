export interface SimulationTimeLabels {
  round: string;
  shortRound: string;
  completed: string;
  timeline: string;
  duration: string;
}

export function getSimulationStatusLabel(
  status: string,
  isConnected: boolean,
): string {
  if (status === 'completed') return 'Completed';
  if (status === 'paused') return 'Paused';
  if (status === 'running') {
    return isConnected ? 'Active' : 'Reconnecting';
  }
  return isConnected ? 'Ready' : 'Connecting';
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
