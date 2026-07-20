"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Play,
  Users,
} from "lucide-react";

import { PressureSlider } from "@/components/landing/pressure-slider";
import { buttonVariants } from "@/components/ui/button";
import {
  getPressureAriaValue,
  getPressureSnapshot,
  type PressureTone,
} from "@/lib/landing-pressure";
import { cn } from "@/lib/utils";

const toneStyles: Record<
  PressureTone,
  {
    ambient: string;
    badge: string;
    badgeIcon: string;
    gradient: string;
    range: string;
    value: string;
    panel: string;
    statusDot: string;
    morale: string;
    output: string;
  }
> = {
  stable: {
    ambient: "bg-primary",
    badge: "border-border bg-secondary/80 text-foreground",
    badgeIcon: "text-primary",
    gradient:
      "bg-[linear-gradient(100deg,var(--color-primary),#8b5cf6)] dark:bg-[linear-gradient(100deg,var(--color-primary),#a78bfa)]",
    range: "bg-primary",
    value: "text-primary",
    panel: "border-border/70",
    statusDot: "bg-emerald-500",
    morale: "border-emerald-500/20 bg-emerald-500/8",
    output: "border-blue-500/20 bg-blue-500/8",
  },
  strained: {
    ambient: "bg-amber-500",
    badge:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    badgeIcon: "text-amber-500",
    gradient: "bg-[linear-gradient(100deg,#f59e0b,#fb923c)]",
    range: "bg-amber-500",
    value: "text-amber-600 dark:text-amber-400",
    panel: "border-amber-500/25",
    statusDot: "bg-amber-500",
    morale: "border-amber-500/20 bg-amber-500/8",
    output: "border-blue-500/20 bg-blue-500/8",
  },
  critical: {
    ambient: "bg-orange-500",
    badge:
      "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    badgeIcon: "text-orange-500",
    gradient: "bg-[linear-gradient(100deg,#f97316,#ef4444)]",
    range: "bg-orange-500",
    value: "text-orange-600 dark:text-orange-400",
    panel: "border-orange-500/30",
    statusDot: "bg-orange-500",
    morale: "border-orange-500/20 bg-orange-500/8",
    output: "border-amber-500/20 bg-amber-500/8",
  },
  extreme: {
    ambient: "bg-red-500",
    badge:
      "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
    badgeIcon: "text-red-500",
    gradient: "bg-[linear-gradient(100deg,#ef4444,#fb7185)]",
    range: "bg-red-500",
    value: "text-red-600 dark:text-red-400",
    panel: "border-red-500/35",
    statusDot: "bg-red-500",
    morale: "border-red-500/20 bg-red-500/8",
    output: "border-orange-500/20 bg-orange-500/8",
  },
};

export function InteractiveHero() {
  const [pressure, setPressure] = useState(20);
  const snapshot = getPressureSnapshot(pressure);
  const styles = toneStyles[snapshot.tone];
  const isElevated = snapshot.tone !== "stable";

  return (
    <section
      aria-labelledby="landing-hero-title"
      className="relative isolate mx-auto grid min-h-[820px] w-full max-w-7xl grid-cols-1 items-center gap-14 overflow-hidden px-5 pb-24 pt-36 sm:px-6 md:pt-40 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:overflow-visible lg:pb-28"
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -left-36 top-20 -z-10 size-[440px] rounded-full opacity-15 blur-[120px] transition-colors duration-700 motion-reduce:transition-none sm:size-[560px]",
          styles.ambient,
        )}
      />

      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <div
          className={cn(
            "mb-7 inline-flex max-w-full items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-300 motion-reduce:transition-none sm:text-sm",
            styles.badge,
          )}
        >
          {isElevated ? (
            <AlertTriangle
              className={cn("size-4 shrink-0", styles.badgeIcon)}
              aria-hidden="true"
            />
          ) : (
            <Bot
              className={cn("size-4 shrink-0", styles.badgeIcon)}
              aria-hidden="true"
            />
          )}
          <span>For founders &amp; people leaders</span>
        </div>

        <h1
          id="landing-hero-title"
          className="max-w-3xl text-[clamp(3rem,6.3vw,5.5rem)] font-extrabold leading-[0.96] tracking-[-0.055em] text-foreground"
        >
          What happens when you{" "}
          <span
            className={cn(
              "bg-clip-text text-transparent transition-all duration-500 motion-reduce:transition-none",
              styles.gradient,
            )}
          >
            push them too hard?
          </span>
        </h1>

        <p className="mt-7 max-w-xl text-base font-medium leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
          Stress-test a simulated team, introduce a crisis, and observe how
          morale, communication, and output change under pressure.
        </p>

        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/demo"
            className={cn(
              buttonVariants({ size: "lg" }),
              "group h-14 w-full rounded-xl px-7 text-base font-bold shadow-lg shadow-primary/15 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:w-auto motion-reduce:transition-none",
            )}
          >
            <Play className="size-4 fill-current" aria-hidden="true" />
            Run 2-minute demo
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </Link>
          <Link
            href="/setup"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-14 w-full rounded-xl bg-background/50 px-7 text-base font-semibold backdrop-blur-sm sm:w-auto",
            )}
          >
            Build a scenario
          </Link>
        </div>
      </div>

      <div className="relative flex w-full justify-center lg:justify-end">
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-8 -z-10 rounded-full opacity-15 blur-[80px] transition-colors duration-700 motion-reduce:transition-none",
            styles.ambient,
          )}
        />

        <div
          className={cn(
            "w-full max-w-[480px] rounded-3xl border bg-card/75 p-5 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.85)] backdrop-blur-xl transition-colors duration-500 motion-reduce:transition-none sm:p-7",
            styles.panel,
          )}
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Pressure Simulator
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {snapshot.label}
              </p>
            </div>
            <span
              className={cn(
                "text-3xl font-extrabold tabular-nums transition-colors duration-300 motion-reduce:transition-none",
                styles.value,
              )}
            >
              {snapshot.value}%
            </span>
          </div>

          <div className="mt-5">
            <PressureSlider
              value={snapshot.value}
              onValueChange={setPressure}
              ariaValueText={getPressureAriaValue(snapshot)}
              rangeClassName={styles.range}
            />
            <div className="flex justify-between px-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/75">
              <span>Stable</span>
              <span>Strained</span>
              <span>Burnout risk</span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border/60 bg-background/45 p-4">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full shadow-[0_0_0_4px_color-mix(in_oklab,currentColor_12%,transparent)]",
                  styles.statusDot,
                )}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-bold text-foreground">
                  {snapshot.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {snapshot.detail}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricCard
              icon={<Users className="size-4" aria-hidden="true" />}
              label="Morale"
              value={`${snapshot.morale}%`}
              className={styles.morale}
            />
            <MetricCard
              icon={<Activity className="size-4" aria-hidden="true" />}
              label="Illustrative output"
              value={`${snapshot.output}%`}
              className={styles.output}
            />
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/75">
            Illustrative scenario model — not a forecast of individual behavior.
          </p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-2xl border p-3.5",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-foreground/8 text-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-base font-extrabold tabular-nums text-foreground">
          {value}
        </span>
      </span>
    </div>
  );
}
