"use client";

import type { DragEvent } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  FileUp,
  Lightbulb,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  DocumentAnalysis,
  PresetAgent,
  SuggestedAgent,
} from "@/lib/setup-model";

interface DocumentImportProps {
  analysis: DocumentAnalysis | null;
  isAnalyzing: boolean;
  isDragActive: boolean;
  selectedAgents: PresetAgent[];
  rosterFull: boolean;
  onDragActiveChange: (active: boolean) => void;
  onUpload: (file: File) => void;
  onApplyAll: () => void;
  onAddSuggestedAgent: (agent: SuggestedAgent, index: number) => void;
}

export function DocumentImport({
  analysis,
  isAnalyzing,
  isDragActive,
  selectedAgents,
  rosterFull,
  onDragActiveChange,
  onUpload,
  onApplyAll,
  onAddSuggestedAgent,
}: DocumentImportProps) {
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    onDragActiveChange(false);
    const file = event.dataTransfer.files[0];
    if (file) onUpload(file);
  };

  const result = analysis?.analysis;

  return (
    <div className="grid gap-5 border-t border-border/60 px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
      <div>
        <input
          id="company-context-document"
          type="file"
          accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.xls"
          aria-label="Upload company context document"
          className="sr-only"
          disabled={isAnalyzing}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
        />
        <label
          htmlFor="company-context-document"
          onDragOver={(event) => {
            event.preventDefault();
            onDragActiveChange(true);
          }}
          onDragLeave={() => onDragActiveChange(false)}
          onDrop={handleDrop}
          className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-5 py-6 text-center outline-none transition-colors motion-reduce:transition-none ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
          } ${isAnalyzing ? "pointer-events-none opacity-60" : ""}`}
        >
          <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
            {isAnalyzing ? (
              <Loader2
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <FileUp aria-hidden="true" />
            )}
          </span>
          <span>
            <span className="block text-sm font-bold">
              {isAnalyzing ? "Analyzing document" : "Choose a file or drop it here"}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              PDF, DOCX, TXT, CSV, or Excel up to 10MB
            </span>
          </span>
        </label>
      </div>

      {analysis && result ? (
        <section
          aria-labelledby="document-analysis-title"
          className="grid gap-5 rounded-xl border border-border bg-background/70 p-4 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 id="document-analysis-title" className="font-bold">
                Analysis ready
              </h3>
              <p className="truncate text-sm text-muted-foreground">
                {analysis.filename}
              </p>
            </div>
          </div>

          {result.company_name || result.company_culture ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold">
                <Building2 aria-hidden="true" />
                Detected company context
              </h4>
              <dl className="mt-3 grid gap-2 text-sm">
                {result.company_name ? (
                  <div className="grid gap-1 sm:grid-cols-[7rem_1fr]">
                    <dt className="text-muted-foreground">Company</dt>
                    <dd className="font-medium">{result.company_name}</dd>
                  </div>
                ) : null}
                {result.company_culture ? (
                  <div className="grid gap-1 sm:grid-cols-[7rem_1fr]">
                    <dt className="text-muted-foreground">Context</dt>
                    <dd>{result.company_culture}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {result.summary ? (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold">
                <FileText aria-hidden="true" />
                Summary
              </h4>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {result.summary}
              </p>
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            {result.key_requirements?.length ? (
              <AnalysisList
                title="Key requirements"
                icon={<ShieldCheck aria-hidden="true" />}
                items={result.key_requirements}
              />
            ) : null}
            {result.team_risks?.length ? (
              <AnalysisList
                title="Team risks"
                icon={<AlertTriangle aria-hidden="true" />}
                items={result.team_risks}
              />
            ) : null}
            {result.suggested_team_rules?.length ? (
              <AnalysisList
                title="Suggested team rules"
                icon={<CheckCircle2 aria-hidden="true" />}
                items={result.suggested_team_rules}
              />
            ) : null}
            {result.actionable_insights?.length ? (
              <AnalysisList
                title="Actionable insights"
                icon={<Lightbulb aria-hidden="true" />}
                items={result.actionable_insights}
              />
            ) : null}
          </div>

          {result.suggested_crisis ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle aria-hidden="true" />
                Suggested pressure scenario
              </h4>
              <p className="mt-2 text-sm font-bold">
                {result.suggested_crisis.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.suggested_crisis.description}
              </p>
            </div>
          ) : null}

          {result.suggested_agents?.length ? (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold">
                <Sparkles aria-hidden="true" />
                Suggested team members
              </h4>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {result.suggested_agents.map((agent, index) => {
                  const isAdded = selectedAgents.some(
                    (selected) =>
                      selected.name === agent.name &&
                      selected.role === agent.role,
                  );

                  return (
                    <article
                      key={`${agent.name}-${agent.role}-${index}`}
                      className="rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">
                            {agent.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {agent.role}
                          </p>
                        </div>
                        {isAdded ? (
                          <Badge variant="secondary">Added</Badge>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-11 shrink-0"
                            aria-label={`Add ${agent.name} to roster`}
                            disabled={rosterFull}
                            onClick={() =>
                              onAddSuggestedAgent(agent, index)
                            }
                          >
                            <Plus aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                      <Badge variant="outline" className="mt-3">
                        {agent.type}
                      </Badge>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {agent.rationale}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Button
            type="button"
            className="min-h-11 w-full sm:w-auto sm:justify-self-end"
            onClick={onApplyAll}
          >
            <Sparkles data-icon="inline-start" aria-hidden="true" />
            Apply all suggestions
          </Button>
        </section>
      ) : null}
    </div>
  );
}

function AnalysisList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <div>
      <h4 className="flex items-center gap-2 text-sm font-bold">
        {icon}
        {title}
      </h4>
      <ul className="mt-2 grid gap-2">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="flex gap-2 text-sm leading-5 text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
