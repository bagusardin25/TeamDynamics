"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Layers3,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  getCrisisLabel,
  getSimulationHref,
  getSimulationProgress,
  type DashboardSummary,
  type SimulationRecord,
} from "@/lib/dashboard-model";
import { cn } from "@/lib/utils";

interface DashboardOverviewProps {
  firstName: string;
  credits: number;
  isAdmin: boolean;
  simulations: readonly SimulationRecord[];
  summary: DashboardSummary;
  primarySimulation: SimulationRecord | null;
  showGuide: boolean;
  onDismissGuide: () => void;
}

export function DashboardOverview({
  firstName,
  credits,
  isAdmin,
  simulations,
  summary,
  primarySimulation,
  showGuide,
  onDismissGuide,
}: DashboardOverviewProps) {
  const isCompleted = primarySimulation?.status === "completed";
  const nextActionTitle = primarySimulation
    ? isCompleted
      ? "Review decision brief"
      : "Continue simulation"
    : "Create your first simulation";
  const nextActionDescription = primarySimulation
    ? isCompleted
      ? `${primarySimulation.company_name} is ready for review. Examine the response timeline, risk signals, and recommended actions.`
      : `${primarySimulation.company_name} is in progress. Resume the scenario to keep the decision record complete.`
    : "Configure a team, operating context, and pressure scenario to begin a structured rehearsal.";
  const nextActionHref = primarySimulation
    ? getSimulationHref(primarySimulation)
    : "/setup";
  const nextActionLabel = primarySimulation
    ? isCompleted
      ? "Open decision brief"
      : "Continue simulation"
    : "Create simulation";
  const primaryProgress = primarySimulation
    ? getSimulationProgress(primarySimulation)
    : 0;
  const configured = summary.total > 0;
  const observed = simulations.some(
    (simulation) => simulation.current_round > 0,
  );
  const reviewed = summary.completed > 0;
  const completedGuideSteps = [configured, observed, reviewed].filter(
    Boolean,
  ).length;

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <section
        aria-labelledby="dashboard-title"
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="min-w-0">
          <h1
            id="dashboard-title"
            className="text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl"
          >
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Manage active scenarios and turn completed runs into clearer
            decisions.
          </p>
        </div>

        <Link
          href="/setup"
          className={cn(
            buttonVariants({ size: "lg" }),
            "min-h-11 w-full rounded-xl px-4 font-bold shadow-sm transition-[background-color,transform] hover:-translate-y-0.5 motion-reduce:transition-none sm:w-auto",
          )}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          New Simulation
        </Link>
      </section>

      <section
        aria-labelledby="next-action-title"
        className="overflow-hidden rounded-3xl border border-border/60 bg-card/55 shadow-xl shadow-black/5"
      >
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch lg:gap-0">
          <div className="lg:pr-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
              Next action
            </p>
            <h2
              id="next-action-title"
              className="mt-4 max-w-2xl text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl"
            >
              {nextActionTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {nextActionDescription}
            </p>
            <Link
              href={nextActionHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-6 min-h-11 rounded-xl px-4 font-bold transition-[background-color,transform] hover:-translate-y-0.5 motion-reduce:transition-none",
              )}
            >
              {nextActionLabel}
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </div>

          <div className="border-t border-border/60 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            {primarySimulation ? (
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Scenario context
                  </p>
                  <p className="mt-3 text-lg font-extrabold tracking-[-0.02em]">
                    {primarySimulation.company_name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getCrisisLabel(primarySimulation.crisis_scenario)}
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-4 text-xs font-bold">
                    <span className="text-muted-foreground">
                      {isCompleted ? "Scenario complete" : "Scenario progress"}
                    </span>
                    <span className="tabular-nums">{primaryProgress}%</span>
                  </div>
                  <Progress
                    value={primaryProgress}
                    aria-label={`${primarySimulation.company_name} progress`}
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  One run produces
                </p>
                <ul className="mt-4 flex flex-col gap-3 text-sm font-semibold">
                  <li className="flex items-center gap-3">
                    <Activity className="size-4 text-primary" aria-hidden="true" />
                    Live team response
                  </li>
                  <li className="flex items-center gap-3">
                    <Layers3 className="size-4 text-primary" aria-hidden="true" />
                    Risk timeline
                  </li>
                  <li className="flex items-center gap-3">
                    <FileText className="size-4 text-primary" aria-hidden="true" />
                    Decision brief
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Dashboard summary">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-4">
          <SummaryItem
            icon={Layers3}
            label="Total simulations"
            value={summary.total}
            description="All scenario records"
          />
          <SummaryItem
            icon={Clock3}
            label="In progress"
            value={summary.running}
            description="Scenarios to continue"
          />
          <SummaryItem
            icon={CheckCircle2}
            label="Completed"
            value={summary.completed}
            description="Decision briefs ready"
          />
          <Link
            href="/pricing"
            aria-label={
              isAdmin
                ? "View pricing, unlimited credits"
                : `View pricing, ${credits} credits available`
            }
            className="group flex min-h-32 flex-col items-start gap-3 bg-background/95 p-4 outline-none transition-colors hover:bg-card focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 motion-reduce:transition-none sm:flex-row sm:gap-4 sm:p-5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Credits available
              </span>
              <span className="mt-2 block text-2xl font-extrabold tracking-tight">
                {isAdmin ? "Unlimited" : credits}
              </span>
              <span className="mt-1 hidden text-xs font-medium text-muted-foreground group-hover:text-foreground sm:block">
                Review plan and usage
              </span>
            </span>
          </Link>
        </div>
      </section>

      {showGuide && summary.total < 3 ? (
        <section
          aria-labelledby="setup-guide-title"
          className="rounded-2xl border border-border/60 bg-card/35 p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
                Setup guide
              </p>
              <h2
                id="setup-guide-title"
                className="mt-2 text-lg font-extrabold tracking-[-0.02em]"
              >
                Build your first decision record
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Follow the same three-step workflow used throughout
                TeamDynamics.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 rounded-lg text-muted-foreground"
              aria-label="Dismiss setup guide"
              onClick={onDismissGuide}
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <ol className="mt-6 grid gap-3 md:grid-cols-3">
            <GuideStep
              number="01"
              title="Configure a scenario"
              description="Define the team, operating context, and pressure event."
              completed={configured}
            />
            <GuideStep
              number="02"
              title="Observe the response"
              description="Follow communication and risk signals as the scenario develops."
              completed={observed}
            />
            <GuideStep
              number="03"
              title="Review the decision brief"
              description="Use the completed record to challenge the original plan."
              completed={reviewed}
            />
          </ol>

          <div className="mt-5 flex items-center gap-3">
            <Progress
              value={(completedGuideSteps / 3) * 100}
              aria-label={`${completedGuideSteps} of 3 setup steps complete`}
              className="flex-1"
            />
            <span className="text-xs font-bold tabular-nums text-muted-foreground">
              {completedGuideSteps}/3 complete
            </span>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="flex min-h-32 flex-col items-start gap-3 bg-background/95 p-4 sm:flex-row sm:gap-4 sm:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="mt-1 hidden text-xs font-medium text-muted-foreground sm:block">
          {description}
        </p>
      </div>
    </article>
  );
}

function GuideStep({
  number,
  title,
  description,
  completed,
}: {
  number: string;
  title: string;
  description: string;
  completed: boolean;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-border/60 bg-background/55 p-4">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-extrabold",
          completed
            ? "border-primary/20 bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground",
        )}
      >
        {completed ? (
          <CheckCircle2 className="size-4" aria-hidden="true" />
        ) : (
          number
        )}
      </span>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </li>
  );
}

