export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_BASE = API_BASE.replace("http", "ws");

export interface Agent {
  id: string;
  name: string;
  morale: number;
  stress: number;
  loyalty?: number;
  productivity?: number;
  initials: string;
  has_resigned?: boolean;
}

export interface SimMessage {
  id: number;
  round?: number;
  agent?: string;
  agent_name?: string;
  agent_id?: string;
  type: string;
  content: string;
  thought?: string;
  state_changes?: {
    morale?: number;
    stress?: number;
    loyalty?: number;
    productivity?: number;
  };
  changes?: {
    morale?: number;
    stress?: number;
    loyalty?: number;
    productivity?: number;
  };
}

export interface Metrics {
  avgMorale: number;
  avgStress: number;
  productivity: number;
  resignations: number;
  avgLoyalty: number;
  teamCohesion: number;
}

export const DEFAULT_METRICS: Metrics = {
  avgMorale: 70,
  avgStress: 30,
  productivity: 75,
  resignations: 0,
  avgLoyalty: 70,
  teamCohesion: 70,
};

export interface WorldState {
  budgetRemaining: number;
  customerSatisfaction: number;
  companyReputation: number;
  teamCapacity: number;
  technicalDebt: number;
  deadlineWeeksLeft: number;
}

export interface DecisionStatus {
  proposalCount: number;
  hasDecision: boolean;
  decidedProposal: string | null;
  leadingProposal: string | null;
  leadingSupport: number;
  escalationCount: number;
  resignThreats: number;
}

export interface MetricsSnapshot {
  round: number;
  morale: number;
  stress: number;
  productivity: number;
  loyalty: number;
  cohesion: number;
}

export interface SimulationOutcome {
  emoji: string;
  title: string;
  description: string;
}
