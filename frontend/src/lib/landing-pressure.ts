export type PressureTone = "stable" | "strained" | "critical" | "extreme";

export interface PressureSnapshot {
  value: number;
  morale: number;
  output: number;
  tone: PressureTone;
  label: string;
  detail: string;
}

function clampPressure(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getTone(value: number): Pick<
  PressureSnapshot,
  "tone" | "label" | "detail"
> {
  if (value > 90) {
    return {
      tone: "extreme",
      label: "Extreme pressure",
      detail: "The scenario has entered a burnout-risk range.",
    };
  }

  if (value > 70) {
    return {
      tone: "critical",
      label: "Critical pressure",
      detail: "Risk signals are compounding across the simulated team.",
    };
  }

  if (value > 45) {
    return {
      tone: "strained",
      label: "Strained",
      detail: "Sustained pressure is starting to reduce team resilience.",
    };
  }

  return {
    tone: "stable",
    label: "Stable",
    detail: "The simulated team is operating in a sustainable range.",
  };
}

export function getPressureSnapshot(value: number): PressureSnapshot {
  const pressure = clampPressure(value);
  const morale = Math.round(100 - pressure * 0.72);
  const output =
    pressure <= 65
      ? Math.round(35 + (pressure / 65) * 50)
      : Math.round(85 - ((pressure - 65) / 35) * 40);

  return {
    value: pressure,
    morale,
    output,
    ...getTone(pressure),
  };
}

export function getPressureAriaValue(snapshot: PressureSnapshot): string {
  return `${snapshot.value}% pressure, ${snapshot.label}. Estimated morale ${snapshot.morale}%, illustrative output ${snapshot.output}%.`;
}
