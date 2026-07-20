"use client";

import dynamic from "next/dynamic";
import { Cpu, Save, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  AGENT_COLORS,
  PERSONALITY_TRAITS,
  POPULAR_MODELS,
  type AgentPersonality,
  type PresetAgent,
} from "@/lib/setup-model";
import { cn } from "@/lib/utils";

const RadarChart = dynamic(
  () =>
    import("@/components/ui/radar-chart").then(
      (module) => module.RadarChart,
    ),
  { ssr: false },
);

interface AgentDialogProps {
  open: boolean;
  editingAgent: PresetAgent | null;
  name: string;
  role: string;
  type: string;
  color: string;
  motivation: string;
  expertise: string;
  model: string;
  customModelInput: string;
  personality: AgentPersonality;
  onOpenChange: (open: boolean) => void;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onMotivationChange: (value: string) => void;
  onExpertiseChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onCustomModelInputChange: (value: string) => void;
  onPersonalityChange: (
    key: keyof AgentPersonality,
    value: number,
  ) => void;
  onSave: () => void;
}

export function AgentDialog({
  open,
  editingAgent,
  name,
  role,
  type,
  color,
  motivation,
  expertise,
  model,
  customModelInput,
  personality,
  onOpenChange,
  onNameChange,
  onRoleChange,
  onTypeChange,
  onColorChange,
  onMotivationChange,
  onExpertiseChange,
  onModelChange,
  onCustomModelInputChange,
  onPersonalityChange,
  onSave,
}: AgentDialogProps) {
  const isValid = Boolean(name.trim() && role.trim() && type.trim());
  const modelLabel =
    POPULAR_MODELS.find((option) => option.value === model)?.label ||
    (model === "__custom__" ? "Custom model ID" : "Default (Global)");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto p-0 sm:max-w-2xl">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <DialogHeader className="border-b border-border/60 p-5 pr-14 sm:p-6 sm:pr-16">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound aria-hidden="true" />
            </span>
            <DialogTitle className="text-xl font-bold">
              {editingAgent ? "Edit agent" : "Create custom agent"}
            </DialogTitle>
            <DialogDescription>
              Define the role, motivation, and personality that will shape this
              agent&apos;s decisions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="agent-name" className="text-sm font-bold">
                  Name
                </label>
                <Input
                  id="agent-name"
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                  placeholder="e.g. Taylor"
                  className="min-h-11"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="agent-role" className="text-sm font-bold">
                  Role
                </label>
                <Input
                  id="agent-role"
                  value={role}
                  onChange={(event) => onRoleChange(event.target.value)}
                  placeholder="e.g. Product Designer"
                  className="min-h-11"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="agent-type" className="text-sm font-bold">
                Personality profile
              </label>
              <Input
                id="agent-type"
                value={type}
                onChange={(event) => onTypeChange(event.target.value)}
                placeholder="e.g. Detail-oriented and cautious"
                className="min-h-11"
                required
              />
            </div>

            <fieldset className="grid gap-3">
              <legend className="text-sm font-bold">Color tag</legend>
              <div className="flex flex-wrap gap-2">
                {AGENT_COLORS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(
                      "size-11 rounded-full",
                      color === option.value &&
                        "border-primary ring-3 ring-primary/20",
                    )}
                    aria-label={`${option.label} color`}
                    aria-pressed={color === option.value}
                    onClick={() => onColorChange(option.value)}
                  >
                    <span
                      className={`size-5 rounded-full ${option.dot}`}
                      aria-hidden="true"
                    />
                  </Button>
                ))}
              </div>
            </fieldset>

            <Separator />

            <div className="grid gap-5 lg:grid-cols-[1fr_12rem] lg:items-center">
              <fieldset className="grid gap-5">
                <legend className="text-sm font-bold">
                  Personality traits
                </legend>
                {PERSONALITY_TRAITS.map((trait) => (
                  <div key={trait.key} className="grid gap-3">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <label
                          htmlFor={`agent-${trait.key}`}
                          className="text-sm font-bold"
                        >
                          {trait.label}
                        </label>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {trait.description}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-primary">
                        {personality[trait.key]}
                      </span>
                    </div>
                    <Slider
                      id={`agent-${trait.key}`}
                      value={personality[trait.key]}
                      min={0}
                      max={100}
                      step={5}
                      className="min-h-11 px-1"
                      thumbProps={{
                        "aria-label": `${trait.label} score`,
                      }}
                      thumbClassName="size-5 after:absolute after:-inset-3"
                      onValueChange={(value) =>
                        onPersonalityChange(trait.key, value as number)
                      }
                    />
                  </div>
                ))}
              </fieldset>

              <div className="hidden justify-center lg:flex">
                <div className="text-center">
                  <p className="mb-2 text-xs font-bold text-muted-foreground">
                    Personality preview
                  </p>
                  <RadarChart
                    size={176}
                    data={[
                      { label: "EMP", value: personality.empathy },
                      { label: "AMB", value: personality.ambition },
                      {
                        label: "RES",
                        value: personality.stressTolerance,
                      },
                      { label: "AGR", value: personality.agreeableness },
                      { label: "ASR", value: personality.assertiveness },
                    ]}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="agent-motivation" className="text-sm font-bold">
                  Motivation
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </label>
                <Textarea
                  id="agent-motivation"
                  value={motivation}
                  onChange={(event) =>
                    onMotivationChange(event.target.value)
                  }
                  placeholder="What does this person want to protect or achieve?"
                  className="min-h-24 resize-y"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="agent-expertise" className="text-sm font-bold">
                  Expertise
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </label>
                <Input
                  id="agent-expertise"
                  value={expertise}
                  onChange={(event) => onExpertiseChange(event.target.value)}
                  placeholder="e.g. React, system design, team leadership"
                  className="min-h-11"
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-2">
              <label
                htmlFor="agent-model"
                className="flex items-center gap-2 text-sm font-bold"
              >
                <Cpu aria-hidden="true" />
                AI model
                <span className="font-normal text-muted-foreground">
                  Optional
                </span>
              </label>
              <p className="text-xs leading-5 text-muted-foreground">
                Leave this on Default to use the global provider configured for
                the application.
              </p>
              <Select
                value={model}
                onValueChange={(value) => {
                  const nextModel = value || "__default__";
                  onModelChange(nextModel);
                  if (nextModel !== "__custom__") {
                    onCustomModelInputChange("");
                  }
                }}
              >
                <SelectTrigger
                  id="agent-model"
                  className="min-h-11 bg-background"
                >
                  <span
                    data-slot="select-value"
                    className="flex flex-1 items-center text-left"
                  >
                    {modelLabel}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {POPULAR_MODELS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">
                      Custom model ID
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {model === "__custom__" ? (
                <div className="mt-2 grid gap-2">
                  <label htmlFor="agent-custom-model" className="text-sm font-bold">
                    Model ID
                  </label>
                  <Input
                    id="agent-custom-model"
                    value={customModelInput}
                    onChange={(event) =>
                      onCustomModelInputChange(event.target.value)
                    }
                    placeholder="e.g. anthropic/claude-3.7-sonnet"
                    className="min-h-11 font-mono text-xs"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="m-0">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-h-11"
              disabled={!isValid}
            >
              <Save data-icon="inline-start" aria-hidden="true" />
              {editingAgent ? "Save changes" : "Add to roster"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
