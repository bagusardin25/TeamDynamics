import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Film,
  GitCompareArrows,
  LoaderCircle,
  Play,
  Plus,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  formatSimulationDate,
  getCrisisLabel,
  getSimulationHref,
  getSimulationProgress,
  type SimulationRecord,
} from "@/lib/dashboard-model";
import { cn } from "@/lib/utils";

interface SimulationHistoryProps {
  simulations: readonly SimulationRecord[];
  isLoading: boolean;
  errorMessage: string | null;
}

const STATUS_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    label: string;
    badgeVariant: "default" | "secondary" | "outline";
    iconClassName: string;
  }
> = {
  idle: {
    icon: CircleDashed,
    label: "Ready",
    badgeVariant: "outline",
    iconClassName: "border-border bg-secondary text-muted-foreground",
  },
  running: {
    icon: Play,
    label: "Running",
    badgeVariant: "default",
    iconClassName: "border-primary/20 bg-primary/10 text-primary",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    badgeVariant: "secondary",
    iconClassName: "border-border bg-secondary text-foreground",
  },
};

export function SimulationHistory({
  simulations,
  isLoading,
  errorMessage,
}: SimulationHistoryProps) {
  return (
    <section
      aria-labelledby="simulation-history-title"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="simulation-history-title"
            className="text-2xl font-extrabold tracking-[-0.03em]"
          >
            Simulation history
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Reopen active scenarios or review completed decision records.
          </p>
        </div>
        <Link
          href="/compare"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "min-h-11 w-full rounded-xl px-4 font-bold motion-reduce:transition-none sm:w-auto",
          )}
        >
          <GitCompareArrows data-icon="inline-start" aria-hidden="true" />
          Compare simulations
        </Link>
      </div>

      {isLoading ? (
        <div
          className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card/30 text-sm font-semibold text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle
            className="size-5 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          Loading simulation history
        </div>
      ) : errorMessage ? (
        <div
          className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/5 p-6 text-center"
          role="alert"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-base font-extrabold">
            Unable to load simulation history
          </h3>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            {errorMessage}
          </p>
        </div>
      ) : simulations.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/25 p-7 text-center sm:p-10">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Clock3 className="size-6" aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-xl font-extrabold tracking-[-0.02em]">
            No simulations yet
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Create a scenario to start recording team responses, risk signals,
            and decision outcomes.
          </p>
          <Link
            href="/setup"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 min-h-11 rounded-xl px-4 font-bold transition-[background-color,transform] hover:-translate-y-0.5 motion-reduce:transition-none",
            )}
          >
            <Plus data-icon="inline-start" aria-hidden="true" />
            Create your first simulation
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {simulations.map((simulation) => {
            const status =
              STATUS_CONFIG[simulation.status] ?? STATUS_CONFIG.idle;
            const StatusIcon = status.icon;
            const progress = getSimulationProgress(simulation);
            const formattedDate = formatSimulationDate(simulation.created_at);

            return (
              <li key={simulation.id}>
                <article
                  data-testid={`simulation-row-${simulation.id}`}
                  className="group rounded-2xl border border-border/60 bg-card/45 p-4 transition-[border-color,background-color,box-shadow] hover:border-primary/30 hover:bg-card/70 hover:shadow-lg hover:shadow-black/5 motion-reduce:transition-none sm:p-5"
                >
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                      <span
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl border",
                          status.iconClassName,
                        )}
                      >
                        <StatusIcon className="size-4" aria-hidden="true" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={getSimulationHref(simulation)}
                          aria-label={`Open ${simulation.company_name}`}
                          className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-md font-extrabold outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none sm:min-h-0"
                        >
                          <span className="truncate">
                            {simulation.company_name}
                          </span>
                          <ArrowRight
                            className="size-4 shrink-0"
                            aria-hidden="true"
                          />
                        </Link>
                        <p className="mt-1 truncate text-xs font-medium text-muted-foreground sm:text-sm">
                          {getCrisisLabel(simulation.crisis_scenario)}
                        </p>
                        <div className="mt-3 flex max-w-sm items-center gap-3">
                          <Progress
                            value={progress}
                            aria-label={`${simulation.company_name} progress`}
                            className="min-w-0 flex-1"
                          />
                          <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-muted-foreground">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                      <Badge variant={status.badgeVariant}>
                        <StatusIcon data-icon="inline-start" aria-hidden="true" />
                        {status.label}
                      </Badge>
                      {formattedDate ? (
                        <span className="px-1 text-xs font-medium text-muted-foreground">
                          {formattedDate}
                        </span>
                      ) : null}
                      {simulation.status === "completed" ? (
                        <Link
                          href={`/replay?id=${simulation.id}`}
                          aria-label={`Replay ${simulation.company_name}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "relative min-h-11 rounded-lg px-3 font-bold text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Film data-icon="inline-start" aria-hidden="true" />
                          Replay
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

