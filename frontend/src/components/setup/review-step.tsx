"use client";

import {
  ArrowLeft,
  Building2,
  Clock3,
  CreditCard,
  Gauge,
  Loader2,
  Play,
  ShieldAlert,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  getCrisisLabel,
  getEstimatedAgentTurns,
  getPacingLabel,
  type PresetAgent,
} from "@/lib/setup-model";
import { cn } from "@/lib/utils";

interface ReviewStepProps {
  companyName: string;
  companyCulture: string;
  crisis: string;
  customCrisis: string;
  selectedAgents: PresetAgent[];
  durationWeeks: number;
  pacingSpeed: number;
  credits: number;
  isAdmin: boolean;
  isCreating: boolean;
  onDurationChange: (weeks: number) => void;
  onPacingChange: (speed: number) => void;
  onBack: () => void;
  onCreate: () => void;
}

const PACING_OPTIONS = [
  {
    value: 0,
    label: "Slow",
    description: "More time to read each response",
  },
  {
    value: 50,
    label: "Normal",
    description: "Balanced chat response speed",
  },
  {
    value: 100,
    label: "Fast",
    description: "Rapid, high-pressure exchange",
  },
];

export function ReviewStep({
  companyName,
  companyCulture,
  crisis,
  customCrisis,
  selectedAgents,
  durationWeeks,
  pacingSpeed,
  credits,
  isAdmin,
  isCreating,
  onDurationChange,
  onPacingChange,
  onBack,
  onCreate,
}: ReviewStepProps) {
  const scenarioLabel = getCrisisLabel(crisis, customCrisis);
  const estimatedTurns = getEstimatedAgentTurns(
    selectedAgents.length,
    durationWeeks,
  );

  return (
    <section aria-labelledby="review-step-title" className="grid gap-6">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60">
            <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gauge aria-hidden="true" />
            </span>
            <CardTitle>Run parameters</CardTitle>
            <CardDescription>
              Set the length and interaction pace for this simulation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-7">
            <div className="grid gap-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <label
                    htmlFor="simulation-duration"
                    className="text-sm font-bold"
                  >
                    Duration
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    One round of team responses per simulated week
                  </p>
                </div>
                <span className="text-xl font-extrabold text-primary">
                  {durationWeeks} weeks
                </span>
              </div>
              <Slider
                id="simulation-duration"
                value={durationWeeks}
                min={1}
                max={24}
                step={1}
                className="min-h-11 px-1"
                thumbProps={{
                  "aria-label": "Simulation duration in weeks",
                }}
                thumbClassName="size-5 after:absolute after:-inset-3"
                onValueChange={(value) =>
                  onDurationChange(value as number)
                }
              />
              <div
                aria-hidden="true"
                className="flex justify-between text-xs text-muted-foreground"
              >
                <span>1 week</span>
                <span>24 weeks</span>
              </div>
            </div>

            <fieldset className="grid gap-3">
              <legend className="text-sm font-bold">Pacing</legend>
              <p className="text-xs text-muted-foreground">
                Controls how quickly agent messages appear in the live
                simulation.
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {PACING_OPTIONS.map((option) => {
                  const isSelected = option.value === pacingSpeed;

                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex min-h-20 cursor-pointer flex-col justify-center rounded-xl border px-3 py-2 outline-none transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 motion-reduce:transition-none",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:bg-muted/50",
                      )}
                    >
                      <input
                        type="radio"
                        name="simulation-pacing"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => onPacingChange(option.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-bold">{option.label}</span>
                      <span className="mt-1 text-xs leading-4 text-muted-foreground">
                        {option.description}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 aria-hidden="true" />
                Selected pace: {getPacingLabel(pacingSpeed)}
              </p>
            </fieldset>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-card/90 shadow-sm">
          <CardHeader className="border-b border-border/60">
            <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldAlert aria-hidden="true" />
            </span>
            <CardTitle id="review-step-title">Review & Launch</CardTitle>
            <CardDescription>
              Confirm the context and roster before creating the simulation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <dl className="grid gap-4">
              <ReviewRow
                icon={<Building2 aria-hidden="true" />}
                label="Company"
                value={companyName || "Not provided"}
                description={companyCulture}
              />
              <ReviewRow
                icon={<ShieldAlert aria-hidden="true" />}
                label="Pressure scenario"
                value={scenarioLabel}
                description={
                  crisis === "custom"
                    ? customCrisis.replace(/^\s*\[[^\]]+\]\s*/, "").trim()
                    : undefined
                }
              />
              <ReviewRow
                icon={<Users aria-hidden="true" />}
                label="Team"
                value={`${selectedAgents.length} agents`}
              />
            </dl>

            <div className="flex flex-wrap gap-2">
              {selectedAgents.map((agent) => (
                <Badge key={agent.id} variant="secondary">
                  {agent.name}
                  <span className="font-normal text-muted-foreground">
                    {agent.role}
                  </span>
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/25 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="mt-1 font-bold">{durationWeeks} weeks</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pacing</p>
                <p className="mt-1 font-bold">
                  {getPacingLabel(pacingSpeed)}
                </p>
              </div>
              <div className="col-span-2 border-t border-border/60 pt-3">
                <p className="text-xs text-muted-foreground">
                  Estimated agent turns
                </p>
                <p className="mt-1 font-mono font-bold">
                  Approximately {estimatedTurns}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CreditCard aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold">Uses 1 simulation credit</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isAdmin
                      ? "Admin access has unlimited simulation credits."
                      : `${credits} credits are currently available.`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={isCreating}
          onClick={onBack}
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Back to team
        </Button>
        <Button
          type="button"
          className="min-h-11 px-5"
          disabled={
            isCreating ||
            selectedAgents.length === 0 ||
            (!isAdmin && credits < 1)
          }
          onClick={onCreate}
        >
          {isCreating ? (
            <Loader2
              data-icon="inline-start"
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <Play data-icon="inline-start" aria-hidden="true" />
          )}
          {isCreating ? "Creating simulation" : "Create simulation"}
        </Button>
      </div>
    </section>
  );
}

function ReviewRow({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-3">
      <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-bold">{value}</dd>
        {description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
