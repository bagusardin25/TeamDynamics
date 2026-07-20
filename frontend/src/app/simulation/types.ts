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
  event?: SimulationEvent;
}

export type SimulationEventKind =
  | 'crisis'
  | 'phase_shift'
  | 'unexpected_event'
  | 'proposal'
  | 'decision'
  | 'impact'
  | 'intervention'
  | 'team_signal'
  | 'outcome'
  | 'update';

export interface SimulationEventEffect {
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface SimulationEvent {
  kind: SimulationEventKind;
  title: string;
  summary: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  effects: SimulationEventEffect[];
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
  icon?: string;
  title: string;
  description: string;
}

export type InterventionType = 'bonus' | 'pizza' | 'cancel_overtime' | 'custom';
export type InterventionTargetKind = 'all_team' | 'agent' | 'project' | 'decision_process';
export type InterventionCategory = 'people' | 'time_scope' | 'resources' | 'policy' | 'incident';
export type SimulationControlAction = 'pause' | 'resume' | 'step';

export interface InterventionDraft {
  type: InterventionType;
  command: string;
  category?: InterventionCategory;
  targetKind?: InterventionTargetKind;
  targetId?: string;
}

export interface InterventionEffect {
  scope: string;
  scope_label: string;
  key: string;
  label: string;
  before: number | null;
  delta: number;
  after: number | null;
  unit: '%' | 'step';
}

export interface InterventionTarget {
  kind: InterventionTargetKind;
  id?: string;
  label: string;
}

export interface InterventionPreview {
  simulation_id: string;
  round: number;
  type: InterventionType;
  command: string;
  category: InterventionCategory;
  target: InterventionTarget;
  effects: InterventionEffect[];
  confirmation_required: boolean;
  semantics: 'preset' | 'category_based';
  metrics_only: boolean;
  response_note: string;
  preview_token: string;
}

export interface InterventionReceipt {
  id: string;
  type: InterventionType;
  command: string;
  category: InterventionCategory;
  target: InterventionTarget;
  preview_effects: InterventionEffect[];
  actual_effects: InterventionEffect[];
  applied_round: number;
  applied_at: string;
  status: 'applied' | 'undone';
  response_status: 'pending' | 'acknowledged' | 'metrics_only';
  acknowledged_by?: string;
  confirmation_required: boolean;
  can_undo: boolean;
  semantics: 'preset' | 'category_based';
  response_note?: string;
}
