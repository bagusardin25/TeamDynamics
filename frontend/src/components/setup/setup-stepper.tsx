"use client";

import { Check } from "lucide-react";

import { SETUP_STEPS, type SetupStepId } from "@/lib/setup-model";
import { cn } from "@/lib/utils";

interface SetupStepperProps {
  currentStep: SetupStepId;
  onStepChange: (step: SetupStepId) => void;
}

export function SetupStepper({
  currentStep,
  onStepChange,
}: SetupStepperProps) {
  return (
    <nav aria-label="Simulation setup progress">
      <ol className="grid grid-cols-3 gap-2 sm:gap-4">
        {SETUP_STEPS.map((step) => {
          const isCurrent = step.id === currentStep;
          const isComplete = step.id < currentStep;
          const isReachable = step.id <= currentStep;
          const shortLabel = step.id === 3 ? "Review" : step.label;

          return (
            <li key={step.id} className="relative min-w-0">
              <button
                type="button"
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${step.id}. ${step.label}${isComplete ? ", completed" : ""}`}
                disabled={!isReachable}
                onClick={() => onStepChange(step.id)}
                className={cn(
                  "group flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl px-2 py-2 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none sm:gap-3 sm:px-3",
                  isCurrent &&
                    "bg-primary/10 text-foreground ring-1 ring-primary/25",
                  isComplete && "text-foreground hover:bg-muted",
                  !isCurrent &&
                    !isComplete &&
                    "cursor-not-allowed text-muted-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold",
                    isCurrent &&
                      "border-primary bg-primary text-primary-foreground",
                    isComplete &&
                      "border-primary/30 bg-primary/10 text-primary",
                    !isCurrent &&
                      !isComplete &&
                      "border-border bg-muted/50",
                  )}
                >
                  {isComplete ? <Check /> : step.id}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold sm:hidden">
                    {shortLabel}
                  </span>
                  <span className="hidden truncate text-sm font-bold sm:block">
                    {step.label}
                  </span>
                  <span className="hidden truncate text-xs text-muted-foreground md:block">
                    {step.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
