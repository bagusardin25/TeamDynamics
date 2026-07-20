import {
  AlertTriangle,
  BarChart3,
  Bell,
  CircleAlert,
  Flag,
  Gavel,
  Megaphone,
  ShieldAlert,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  SimulationEvent,
  SimulationEventEffect,
  SimulationEventKind,
} from "@/app/simulation/types";

const DECORATIVE_EMOJI_RE = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;
const NEGATIVE_METRICS = new Set([
  "stress",
  "technical debt",
  "resignations",
  "resignation",
]);

export function stripDecorativeEmoji(value: string): string {
  return value
    .replace(DECORATIVE_EMOJI_RE, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function effectTone(label: string, value: string): SimulationEventEffect["tone"] {
  const amount = Number.parseFloat(value.replace(/[^+\-\d.]/g, ""));
  if (Number.isNaN(amount) || amount === 0) return "neutral";
  const isNegativeMetric = NEGATIVE_METRICS.has(label.toLowerCase());
  return (isNegativeMetric ? amount < 0 : amount > 0) ? "positive" : "negative";
}

function parseEffects(value: string): SimulationEventEffect[] {
  return Array.from(
    value.matchAll(/(?:^|,\s*)([^,:]+):\s*([+\-]?\d+(?:\.\d+)?%?)/g),
    ([, label, amount]) => ({
      label: label.trim(),
      value: amount.trim(),
      tone: effectTone(label.trim(), amount.trim()),
    }),
  );
}

function event(
  kind: SimulationEventKind,
  title: string,
  summary: string,
  severity: SimulationEvent["severity"] = "info",
  effects: SimulationEventEffect[] = [],
): SimulationEvent {
  return { kind, title, summary, severity, effects };
}

export function classifySimulationEvent(content: string): SimulationEvent {
  const clean = stripDecorativeEmoji(content);
  const upper = clean.toUpperCase();

  if (upper.includes("SIMULATION OUTCOME:")) {
    const outcome = clean.split(/SIMULATION OUTCOME:/i)[1]?.trim() || "Outcome";
    const [title, ...rest] = outcome
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line && !/^=+$/.test(line));
    return event(
      "outcome",
      title?.replace(/^=+\s*|\s*=+$/g, "") || "Simulation Outcome",
      rest.join(" ").split(/FINAL WORLD STATE:/i)[0].trim(),
      "success",
    );
  }

  if (upper.includes("TEAM DECISION REACHED:")) {
    return event(
      "decision",
      "Team Decision",
      clean.split(/TEAM DECISION REACHED:/i)[1]?.trim() || clean,
      "success",
    );
  }

  const phase = clean.match(/^Phase Shift\s*(?:→|->)\s*([^:]+):\s*([\s\S]*)$/i);
  if (phase) return event("phase_shift", phase[1].trim(), phase[2].trim());

  const unexpected = clean.match(
    /^UNEXPECTED EVENT:\s*([^\n]*)(?:\n+([\s\S]*))?$/i,
  );
  if (unexpected) {
    const description = unexpected[2]?.trim();
    return event(
      "unexpected_event",
      description ? unexpected[1].trim() : "Unexpected Event",
      description || unexpected[1].trim(),
      "warning",
    );
  }

  const crisis = clean.match(
    /^(CRITICAL INCIDENT|ANNOUNCEMENT|URGENT|BREAKING|CRISIS):\s*([\s\S]*)$/i,
  );
  if (crisis) {
    const label = crisis[1].toUpperCase();
    const title = label === "CRITICAL INCIDENT"
      ? "Critical Incident"
      : label === "CRISIS"
        ? "Crisis"
        : label.charAt(0) + label.slice(1).toLowerCase();
    return event("crisis", title, crisis[2].trim(), "critical");
  }

  const proposal = clean.match(/^(.+?) has proposed:\s*([\s\S]*)$/i);
  if (proposal) {
    return event(
      "proposal",
      `${proposal[1].trim()} proposed a plan`,
      proposal[2].trim(),
    );
  }

  const impact = clean.match(/^Impact of (.+?)'s action:\s*([\s\S]*)$/i);
  if (impact) {
    return event(
      "impact",
      "Action Impact",
      `${impact[1].trim()}'s action changed the project state.`,
      "info",
      parseEffects(impact[2]),
    );
  }

  const intervention = clean.match(
    /^(?:GOD MODE|MANAGEMENT(?: ANNOUNCEMENT)?):\s*([\s\S]*)$/i,
  );
  if (intervention) {
    return event(
      "intervention",
      "God Mode Intervention",
      intervention[1].trim(),
      "warning",
    );
  }

  if (
    /opposes the current proposal|escalated to management|resignation|pointing fingers/i.test(clean)
  ) {
    return event("team_signal", "Team Signal", clean, "warning");
  }

  return event("update", "System Update", clean);
}

interface SimulationEventPresentation {
  label: string;
  icon: LucideIcon;
  containerClass: string;
  iconClass: string;
  eyebrowClass: string;
}

// Keep complete class tokens visible to Tailwind's static scanner.
const SIMULATION_EVENT_TONE_CLASSES = [
  'border-rose-500/35 bg-rose-500/8 bg-rose-500/15 text-rose-500 text-rose-700 dark:text-rose-400',
  'border-sky-500/35 bg-sky-500/8 bg-sky-500/15 text-sky-500 text-sky-700 dark:text-sky-400',
  'border-amber-500/35 bg-amber-500/8 bg-amber-500/15 text-amber-500 text-amber-700 dark:text-amber-400',
  'border-violet-500/35 bg-violet-500/8 bg-violet-500/15 text-violet-500 text-violet-700 dark:text-violet-400',
  'border-emerald-500/35 bg-emerald-500/8 bg-emerald-500/15 text-emerald-500 text-emerald-700 dark:text-emerald-400',
  'border-cyan-500/35 bg-cyan-500/8 bg-cyan-500/15 text-cyan-500 text-cyan-700 dark:text-cyan-400',
  'border-fuchsia-500/35 bg-fuchsia-500/8 bg-fuchsia-500/15 text-fuchsia-500 text-fuchsia-700 dark:text-fuchsia-400',
  'border-orange-500/35 bg-orange-500/8 bg-orange-500/15 text-orange-500 text-orange-700 dark:text-orange-400',
] as const;
void SIMULATION_EVENT_TONE_CLASSES;

const presentation = (
  label: string,
  icon: LucideIcon,
  tone: string,
): SimulationEventPresentation => ({
  label,
  icon,
  containerClass: `border-${tone}-500/35 bg-${tone}-500/8`,
  iconClass: `bg-${tone}-500/15 text-${tone}-500`,
  eyebrowClass: `text-${tone}-700 dark:text-${tone}-400`,
});

const EVENT_PRESENTATION: Record<SimulationEventKind, SimulationEventPresentation> = {
  crisis: presentation("Critical Incident", ShieldAlert, "rose"),
  phase_shift: presentation("Phase Shift", Flag, "sky"),
  unexpected_event: presentation("Unexpected Event", AlertTriangle, "amber"),
  proposal: presentation("Proposal", Megaphone, "violet"),
  decision: presentation("Team Decision", Gavel, "emerald"),
  impact: presentation("Action Impact", BarChart3, "cyan"),
  intervention: presentation("God Mode", Sparkles, "fuchsia"),
  team_signal: presentation("Team Signal", CircleAlert, "orange"),
  outcome: presentation("Simulation Outcome", Trophy, "amber"),
  update: {
    label: "System Update",
    icon: Bell,
    containerClass: "border-border/70 bg-muted/35",
    iconClass: "bg-muted text-muted-foreground",
    eyebrowClass: "text-muted-foreground",
  },
};

export function getSimulationEventPresentation(
  kind: SimulationEventKind,
): SimulationEventPresentation {
  return EVENT_PRESENTATION[kind] || EVENT_PRESENTATION.update;
}

export function getMessageEvent(
  content: string,
  metadata?: SimulationEvent,
): SimulationEvent {
  return metadata || classifySimulationEvent(content);
}
