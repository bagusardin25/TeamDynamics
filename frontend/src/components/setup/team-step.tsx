"use client";

import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
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
import { Input } from "@/components/ui/input";
import type {
  AgentTemplate,
  PresetAgent,
  SuggestedAgent,
} from "@/lib/setup-model";

const RadarChart = dynamic(
  () =>
    import("@/components/ui/radar-chart").then(
      (module) => module.RadarChart,
    ),
  { ssr: false },
);

interface TeamStepProps {
  availablePresets: PresetAgent[];
  selectedAgents: PresetAgent[];
  suggestedAgents: SuggestedAgent[];
  templates: AgentTemplate[];
  expandedAgent: string | null;
  showSaveTemplate: boolean;
  showTemplateList: boolean;
  templateName: string;
  savingTemplate: boolean;
  loadingTemplate: string | null;
  rosterFull: boolean;
  canUseTemplates: boolean;
  onAddPreset: (agent: PresetAgent) => void;
  onAddSuggestedAgent: (agent: SuggestedAgent, index: number) => void;
  onCreateAgent: () => void;
  onEditAgent: (agent: PresetAgent) => void;
  onRemoveAgent: (id: string) => void;
  onExpandedAgentChange: (id: string | null) => void;
  onShowSaveTemplateChange: (show: boolean) => void;
  onShowTemplateListChange: (show: boolean) => void;
  onTemplateNameChange: (name: string) => void;
  onSaveTemplate: () => void;
  onLoadTemplate: (id: string) => void;
  onDeleteTemplate: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function TeamStep({
  availablePresets,
  selectedAgents,
  suggestedAgents,
  templates,
  expandedAgent,
  showSaveTemplate,
  showTemplateList,
  templateName,
  savingTemplate,
  loadingTemplate,
  rosterFull,
  canUseTemplates,
  onAddPreset,
  onAddSuggestedAgent,
  onCreateAgent,
  onEditAgent,
  onRemoveAgent,
  onExpandedAgentChange,
  onShowSaveTemplateChange,
  onShowTemplateListChange,
  onTemplateNameChange,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  onBack,
  onContinue,
}: TeamStepProps) {
  return (
    <section aria-labelledby="team-step-title" className="grid gap-6">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60">
            <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <UserPlus aria-hidden="true" />
            </span>
            <CardTitle id="team-step-title">Available agents</CardTitle>
            <CardDescription>
              Add up to eight perspectives. A focused team of three to five is
              a strong starting point.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {suggestedAgents.length > 0 ? (
              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  <Sparkles aria-hidden="true" />
                  Document recommendations
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {suggestedAgents.map((agent, index) => {
                    const isAdded = selectedAgents.some(
                      (selected) =>
                        selected.name === agent.name &&
                        selected.role === agent.role,
                    );

                    return (
                      <AgentPoolButton
                        key={`${agent.name}-${agent.role}-${index}`}
                        name={agent.name}
                        role={agent.role}
                        type={agent.type}
                        isAdded={isAdded}
                        disabled={isAdded || rosterFull}
                        onClick={() => onAddSuggestedAgent(agent, index)}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Preset roles
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {availablePresets.map((agent) => (
                  <AgentPoolButton
                    key={agent.id}
                    name={agent.name}
                    role={agent.role}
                    type={agent.type}
                    color={agent.color}
                    disabled={rosterFull}
                    onClick={() => onAddPreset(agent)}
                  />
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="min-h-24 h-auto w-full flex-col gap-2 border-dashed text-wrap whitespace-normal"
                  disabled={rosterFull}
                  onClick={onCreateAgent}
                >
                  <UserPlus aria-hidden="true" />
                  <span>Create custom agent</span>
                </Button>
              </div>

              {availablePresets.length === 0 && rosterFull ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  The roster is full. Remove an agent before adding another.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-card/90 shadow-sm">
          <CardHeader className="border-b border-border/60">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users aria-hidden="true" />
                </span>
                <CardTitle>Active roster</CardTitle>
                <CardDescription>
                  {selectedAgents.length} of 8 positions selected
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={!canUseTemplates || selectedAgents.length === 0}
                  aria-expanded={showSaveTemplate}
                  onClick={() => {
                    onShowSaveTemplateChange(!showSaveTemplate);
                    onShowTemplateListChange(false);
                  }}
                >
                  <Save data-icon="inline-start" aria-hidden="true" />
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={!canUseTemplates || templates.length === 0}
                  aria-expanded={showTemplateList}
                  onClick={() => {
                    onShowTemplateListChange(!showTemplateList);
                    onShowSaveTemplateChange(false);
                  }}
                >
                  <FolderOpen data-icon="inline-start" aria-hidden="true" />
                  Load
                </Button>
              </div>
            </div>
          </CardHeader>

          {showSaveTemplate ? (
            <div className="grid gap-3 border-b border-border/60 bg-muted/20 p-4 sm:grid-cols-[1fr_auto_auto]">
              <div className="grid gap-2">
                <label htmlFor="template-name" className="sr-only">
                  Template name
                </label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(event) =>
                    onTemplateNameChange(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onSaveTemplate();
                  }}
                  placeholder="Template name"
                  className="min-h-11"
                  autoFocus
                />
              </div>
              <Button
                type="button"
                className="min-h-11"
                disabled={!templateName.trim() || savingTemplate}
                onClick={onSaveTemplate}
              >
                {savingTemplate ? (
                  <Loader2
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : (
                  <Save aria-hidden="true" />
                )}
                Save template
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label="Cancel saving template"
                onClick={() => {
                  onShowSaveTemplateChange(false);
                  onTemplateNameChange("");
                }}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          ) : null}

          {showTemplateList ? (
            <div className="grid gap-2 border-b border-border/60 bg-muted/20 p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Saved templates
              </h3>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background p-2"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 min-w-0 flex-1 justify-start truncate"
                    disabled={loadingTemplate !== null}
                    onClick={() => onLoadTemplate(template.id)}
                  >
                    {loadingTemplate === template.id ? (
                      <Loader2
                        data-icon="inline-start"
                        className="animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    ) : (
                      <FolderOpen
                        data-icon="inline-start"
                        aria-hidden="true"
                      />
                    )}
                    <span className="truncate">{template.name}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="size-11 shrink-0"
                    aria-label={`Delete template ${template.name}`}
                    onClick={() => onDeleteTemplate(template.id)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <CardContent className="grid gap-3">
            {selectedAgents.length === 0 ? (
              <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 text-center">
                <Users
                  className="mb-3 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="font-bold">No agents selected</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add at least one agent to continue.
                </p>
              </div>
            ) : (
              selectedAgents.map((agent) => {
                const isExpanded = expandedAgent === agent.id;

                return (
                  <article
                    key={agent.id}
                    className="rounded-xl border border-border bg-background/80 p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white ${getAgentAvatarClass(agent.color)}`}
                        aria-hidden="true"
                      >
                        {agent.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{agent.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {agent.role}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary">{agent.type}</Badge>
                          {agent.model ? (
                            <Badge variant="outline">
                              <Cpu aria-hidden="true" />
                              Custom AI
                            </Badge>
                          ) : null}
                          {agent.expertise ? (
                            <Badge variant="outline">Specialist</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11"
                          aria-label={`Edit ${agent.name}`}
                          onClick={() => onEditAgent(agent)}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="size-11"
                          aria-label={`Remove ${agent.name}`}
                          onClick={() => onRemoveAgent(agent.id)}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-3 min-h-11 w-full justify-between border-t border-border/60 px-1 pt-3 text-muted-foreground"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        onExpandedAgentChange(isExpanded ? null : agent.id)
                      }
                    >
                      Personality details
                      {isExpanded ? (
                        <ChevronUp aria-hidden="true" />
                      ) : (
                        <ChevronDown aria-hidden="true" />
                      )}
                    </Button>

                    {isExpanded ? (
                      <div className="grid gap-4 pt-3 md:grid-cols-[11rem_1fr] md:items-center">
                        <div className="mx-auto">
                          <RadarChart
                            size={160}
                            data={[
                              {
                                label: "EMP",
                                value: agent.personality.empathy,
                              },
                              {
                                label: "AMB",
                                value: agent.personality.ambition,
                              },
                              {
                                label: "RES",
                                value: agent.personality.stressTolerance,
                              },
                              {
                                label: "AGR",
                                value: agent.personality.agreeableness,
                              },
                              {
                                label: "ASR",
                                value: agent.personality.assertiveness,
                              },
                            ]}
                          />
                        </div>
                        <dl className="grid gap-2 text-sm">
                          <TraitRow
                            label="Empathy"
                            value={agent.personality.empathy}
                          />
                          <TraitRow
                            label="Ambition"
                            value={agent.personality.ambition}
                          />
                          <TraitRow
                            label="Stress tolerance"
                            value={agent.personality.stressTolerance}
                          />
                          <TraitRow
                            label="Agreeableness"
                            value={agent.personality.agreeableness}
                          />
                          <TraitRow
                            label="Assertiveness"
                            value={agent.personality.assertiveness}
                          />
                        </dl>
                        {agent.motivation || agent.expertise ? (
                          <div className="grid gap-3 text-sm md:col-span-2">
                            {agent.motivation ? (
                              <p>
                                <span className="font-bold">Motivation: </span>
                                <span className="text-muted-foreground">
                                  {agent.motivation}
                                </span>
                              </p>
                            ) : null}
                            {agent.expertise ? (
                              <p>
                                <span className="font-bold">Expertise: </span>
                                <span className="text-muted-foreground">
                                  {agent.expertise}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={onBack}
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Back to context
        </Button>
        <Button
          type="button"
          className="min-h-11"
          disabled={selectedAgents.length === 0}
          onClick={onContinue}
        >
          Continue to review
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}

function AgentPoolButton({
  name,
  role,
  type,
  color,
  isAdded = false,
  disabled,
  onClick,
}: {
  name: string;
  role: string;
  type: string;
  color?: string;
  isAdded?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-auto min-h-24 w-full justify-start gap-3 p-3 text-left text-wrap whitespace-normal"
      disabled={disabled}
      onClick={onClick}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white ${
          color ? getAgentAvatarClass(color) : "bg-violet-500"
        }`}
        aria-hidden="true"
      >
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-bold">{name}</span>
          {isAdded ? (
            <Check className="shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <Plus className="shrink-0 text-primary" aria-hidden="true" />
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {role}
        </span>
        <span className="mt-2 block truncate text-xs text-muted-foreground">
          {type}
        </span>
      </span>
    </Button>
  );
}

function TraitRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono font-bold">{value}</dd>
    </div>
  );
}

function getAgentAvatarClass(color: string): string {
  return color.replace("text-", "bg-").replace("/20", "/80");
}
