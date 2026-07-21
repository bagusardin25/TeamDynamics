export type SetupStepId = 1 | 2 | 3;

export interface SetupStep {
  id: SetupStepId;
  label: string;
  description: string;
}

export interface AgentPersonality {
  empathy: number;
  ambition: number;
  stressTolerance: number;
  agreeableness: number;
  assertiveness: number;
}

export interface PresetAgent {
  id: string;
  name: string;
  role: string;
  type: string;
  color: string;
  personality: AgentPersonality;
  motivation?: string;
  expertise?: string;
  model?: string;
}

export interface SuggestedAgent {
  name: string;
  role: string;
  type: string;
  rationale: string;
  personality: AgentPersonality;
}

export type DocumentTeamSource = "documented" | "inferred" | "none";

export interface DocumentAnalysisPayload {
  company_name: string;
  company_culture: string;
  operating_context: string;
  summary: string;
  key_requirements: string[];
  team_risks: string[];
  suggested_crisis: { title: string; description: string };
  team_source: DocumentTeamSource;
  suggested_agents: SuggestedAgent[];
  suggested_team_rules: string[];
  actionable_insights: string[];
}

export interface DocumentAnalysis {
  filename: string;
  analysis: DocumentAnalysisPayload;
}

export interface DocumentAutofill {
  companyName: string;
  companyCulture: string;
  crisis: "custom";
  customCrisis: string;
  selectedAgents: PresetAgent[];
  rosterWasReplaced: boolean;
  omittedAgents: number;
  appliedLabels: string[];
}

export interface AgentTemplate {
  id: string;
  name: string;
  created_at: string | null;
}

export const MAX_ROSTER_SIZE = 8;

export const SETUP_STEPS: SetupStep[] = [
  {
    id: 1,
    label: "Context",
    description: "Company and pressure",
  },
  {
    id: 2,
    label: "Team",
    description: "People and dynamics",
  },
  {
    id: 3,
    label: "Review & Launch",
    description: "Parameters and credit",
  },
];

export const CRISIS_OPTIONS = [
  {
    value: "rnd1",
    label: "Mandatory weekend delivery",
    description: "The team is asked to ship v2.0 over the weekend.",
  },
  {
    value: "rnd2",
    label: "Thirty percent budget reduction",
    description: "Leadership requires a major staffing and scope reduction.",
  },
  {
    value: "rnd3",
    label: "Unexpected CEO resignation",
    description: "The company must stabilize during a leadership transition.",
  },
  {
    value: "rnd4",
    label: "Critical database recovery",
    description: "A production database is deleted late on Friday.",
  },
  {
    value: "custom",
    label: "Custom pressure scenario",
    description: "Write a scenario tailored to your organization.",
  },
] as const;

export const POPULAR_MODELS = [
  { label: "Default (Global)", value: "__default__" },
  { label: "GPT-4o Mini", value: "gpt-4o-mini" },
  {
    label: "OpenRouter Free (Auto)",
    value: "openrouter/free",
  },
  {
    label: "MiniMax M2.5 (Free, availability varies)",
    value: "minimax/minimax-m2.5:free",
  },
  {
    label: "Claude 3 Haiku (Credits required)",
    value: "anthropic/claude-3-haiku",
  },
  {
    label: "Kimi K2.5 (Credits required)",
    value: "moonshotai/kimi-k2.5",
  },
  {
    label: "DeepSeek V3.2 (Credits required)",
    value: "deepseek/deepseek-v3.2",
  },
  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
] as const;

export const AGENT_COLORS: Array<{
  label: string;
  value: string;
  dot: string;
}> = [
  {
    label: "Red",
    value: "bg-red-500/20 text-red-500",
    dot: "bg-red-500",
  },
  {
    label: "Green",
    value: "bg-green-500/20 text-green-500",
    dot: "bg-green-500",
  },
  {
    label: "Blue",
    value: "bg-blue-500/20 text-blue-500",
    dot: "bg-blue-500",
  },
  {
    label: "Purple",
    value: "bg-purple-500/20 text-purple-500",
    dot: "bg-purple-500",
  },
  {
    label: "Orange",
    value: "bg-orange-500/20 text-orange-500",
    dot: "bg-orange-500",
  },
  {
    label: "Cyan",
    value: "bg-cyan-500/20 text-cyan-500",
    dot: "bg-cyan-500",
  },
  {
    label: "Pink",
    value: "bg-pink-500/20 text-pink-500",
    dot: "bg-pink-500",
  },
  {
    label: "Yellow",
    value: "bg-yellow-500/20 text-yellow-500",
    dot: "bg-yellow-500",
  },
];

const STATUS_OR_FEELING_NAME_TERMS = new Set([
  "anxious",
  "burnout",
  "capek",
  "cemas",
  "depressed",
  "exhausted",
  "fatigue",
  "frustrasi",
  "frustrated",
  "kelelahan",
  "kewalahan",
  "lelah",
  "marah",
  "overwhelmed",
  "panic",
  "panik",
  "pressure",
  "sad",
  "sedih",
  "stress",
  "stressed",
  "stres",
  "tertekan",
  "tired",
]);

export function isValidPersonAgentName(value: string): boolean {
  const tokens = value.toLowerCase().match(/[a-z]+/g) || [];
  return (
    tokens.length > 0 &&
    !tokens.some((token) => STATUS_OR_FEELING_NAME_TERMS.has(token))
  );
}


export const DEFAULT_PERSONALITY: AgentPersonality = {
  empathy: 50,
  ambition: 50,
  stressTolerance: 50,
  agreeableness: 50,
  assertiveness: 50,
};

function documentAgentId(name: string, index: number): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `agent-${index + 1}`;
  return `document-${index}-${slug}`;
}

export function createDocumentAutofill(
  analysis: DocumentAnalysisPayload,
  currentAgents: PresetAgent[],
): DocumentAutofill {
  const contextParts = [analysis.company_culture, analysis.operating_context]
    .map((value) => value.trim())
    .filter((value, index, values) => value && values.indexOf(value) === index);
  const validSuggestedAgents = analysis.suggested_agents.filter((agent) =>
    isValidPersonAgentName(agent.name),
  );
  const shouldReplaceRoster =
    analysis.team_source !== "none" && validSuggestedAgents.length > 0;
  const importedAgents = validSuggestedAgents
    .slice(0, MAX_ROSTER_SIZE)
    .map((agent, index): PresetAgent => ({
      id: documentAgentId(agent.name, index),
      name: agent.name.trim() || `Agent ${index + 1}`,
      role: agent.role.trim() || "Team Member",
      type: agent.type.trim() || "Versatile",
      color: AGENT_COLORS[index % AGENT_COLORS.length].value,
      personality: { ...DEFAULT_PERSONALITY, ...agent.personality },
    }));

  return {
    companyName: analysis.company_name.trim(),
    companyCulture: contextParts.join("\n\n"),
    crisis: "custom",
    customCrisis: `[${analysis.suggested_crisis.title.trim()}]\n\n${analysis.suggested_crisis.description.trim()}`,
    selectedAgents: shouldReplaceRoster ? importedAgents : currentAgents,
    rosterWasReplaced: shouldReplaceRoster,
    omittedAgents: shouldReplaceRoster
      ? Math.max(0, validSuggestedAgents.length - MAX_ROSTER_SIZE)
      : 0,
    appliedLabels: [
      "company name",
      "culture and operating context",
      "pressure scenario",
      ...(shouldReplaceRoster ? [`${importedAgents.length} team members`] : []),
    ],
  };
}

export const PERSONALITY_TRAITS = [
  {
    key: "empathy",
    label: "Empathy",
    description: "Understands other people's feelings",
  },
  {
    key: "ambition",
    label: "Ambition",
    description: "Drive to achieve and succeed",
  },
  {
    key: "stressTolerance",
    label: "Stress tolerance",
    description: "Ability to work under pressure",
  },
  {
    key: "agreeableness",
    label: "Agreeableness",
    description: "Tendency to cooperate and align",
  },
  {
    key: "assertiveness",
    label: "Assertiveness",
    description: "Willingness to speak up and lead",
  },
] satisfies Array<{
  key: keyof AgentPersonality;
  label: string;
  description: string;
}>;

export const FALLBACK_PRESETS: PresetAgent[] = [
  {
    id: "1",
    name: "Alex",
    role: "Tech Lead",
    type: "Strict & Burned Out",
    color: "bg-red-500/20 text-red-500",
    personality: {
      empathy: 30,
      ambition: 80,
      stressTolerance: 25,
      agreeableness: 20,
      assertiveness: 90,
    },
  },
  {
    id: "2",
    name: "Sam",
    role: "Junior Dev",
    type: "Ambitious & Naive",
    color: "bg-green-500/20 text-green-500",
    personality: {
      empathy: 65,
      ambition: 90,
      stressTolerance: 30,
      agreeableness: 80,
      assertiveness: 25,
    },
  },
  {
    id: "3",
    name: "Jordan",
    role: "Product Manager",
    type: "Empathetic",
    color: "bg-blue-500/20 text-blue-500",
    personality: {
      empathy: 90,
      ambition: 55,
      stressTolerance: 70,
      agreeableness: 85,
      assertiveness: 40,
    },
  },
  {
    id: "4",
    name: "Casey",
    role: "Senior Dev",
    type: "Silent & Efficient",
    color: "bg-purple-500/20 text-purple-500",
    personality: {
      empathy: 40,
      ambition: 60,
      stressTolerance: 85,
      agreeableness: 30,
      assertiveness: 50,
    },
  },
];

export function getCrisisLabel(
  crisis: string,
  customDescription = "",
): string {
  if (crisis === "custom") {
    const title = customDescription.match(/^\s*\[([^\]]+)\]/)?.[1]?.trim();
    return title || "Custom pressure scenario";
  }

  return (
    CRISIS_OPTIONS.find((option) => option.value === crisis)?.label ||
    "Pressure scenario"
  );
}

export function getPacingLabel(pacingSpeed: number): string {
  if (pacingSpeed <= 25) return "Slow";
  if (pacingSpeed <= 75) return "Normal";
  return "Fast";
}

export function getPacingValue(
  pacingSpeed: number,
): "slow" | "normal" | "fast" {
  if (pacingSpeed <= 25) return "slow";
  if (pacingSpeed <= 75) return "normal";
  return "fast";
}

export function getEstimatedAgentTurns(
  agentCount: number,
  durationWeeks: number,
): number {
  return Math.max(0, agentCount) * Math.max(0, durationWeeks);
}
