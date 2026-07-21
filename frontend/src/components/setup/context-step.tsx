"use client";

import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  FileUp,
  Loader2,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CRISIS_OPTIONS,
  getCrisisLabel,
  type DocumentAnalysis,
} from "@/lib/setup-model";

import { DocumentImport } from "./document-import";

interface ContextStepProps {
  companyName: string;
  companyCulture: string;
  crisis: string;
  customCrisis: string;
  isGeneratingCrisis: boolean;
  isAnalyzingDocument: boolean;
  isDocumentDragActive: boolean;
  documentAnalysis: DocumentAnalysis | null;
  onCompanyNameChange: (value: string) => void;
  onCompanyCultureChange: (value: string) => void;
  onCrisisChange: (value: string) => void;
  onCustomCrisisChange: (value: string) => void;
  onGenerateCrisis: () => void;
  onDocumentDragActiveChange: (active: boolean) => void;
  onDocumentUpload: (file: File) => void;
  onContinue: () => void;
}

export function ContextStep({
  companyName,
  companyCulture,
  crisis,
  customCrisis,
  isGeneratingCrisis,
  isAnalyzingDocument,
  isDocumentDragActive,
  documentAnalysis,
  onCompanyNameChange,
  onCompanyCultureChange,
  onCrisisChange,
  onCustomCrisisChange,
  onGenerateCrisis,
  onDocumentDragActiveChange,
  onDocumentUpload,
  onContinue,
}: ContextStepProps) {
  return (
    <section aria-labelledby="context-step-title" className="grid gap-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60">
            <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BriefcaseBusiness aria-hidden="true" />
            </span>
            <CardTitle id="context-step-title">Company context</CardTitle>
            <CardDescription>
              Give the simulation enough context to make decisions feel
              specific to your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="company-name" className="text-sm font-bold">
                Company name
              </label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(event) => onCompanyNameChange(event.target.value)}
                placeholder="e.g. Acme Corp"
                className="min-h-11"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="company-culture" className="text-sm font-bold">
                Culture and operating context
              </label>
              <Textarea
                id="company-culture"
                value={companyCulture}
                onChange={(event) =>
                  onCompanyCultureChange(event.target.value)
                }
                placeholder="Describe the team, current priorities, and operating constraints."
                className="min-h-36 resize-y"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Include the details that should influence how team members
                communicate and decide.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60">
            <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <AlertTriangle aria-hidden="true" />
            </span>
            <CardTitle>Pressure scenario</CardTitle>
            <CardDescription>
              Choose the event that will test communication, priorities, and
              leadership.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="pressure-scenario" className="text-sm font-bold">
                Scenario
              </label>
              <Select
                value={crisis}
                onValueChange={(value) => onCrisisChange(value || "")}
              >
                <SelectTrigger
                  id="pressure-scenario"
                  className="min-h-11 bg-background"
                >
                  <span
                    data-slot="select-value"
                    className="flex flex-1 items-center text-left"
                  >
                    {getCrisisLabel(crisis, customCrisis)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {CRISIS_OPTIONS.filter(
                      (option) => option.value !== "custom",
                    ).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem
                      value="custom"
                      className="min-h-11 border border-primary/15 bg-primary/5 py-2 font-semibold text-primary focus:bg-primary/10 focus:text-primary"
                    >
                      <WandSparkles aria-hidden="true" />
                      Custom pressure scenario
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-muted-foreground">
                {
                  CRISIS_OPTIONS.find((option) => option.value === crisis)
                    ?.description
                }
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full justify-center"
              disabled={isGeneratingCrisis}
              onClick={onGenerateCrisis}
            >
              {isGeneratingCrisis ? (
                <Loader2
                  data-icon="inline-start"
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <Sparkles data-icon="inline-start" aria-hidden="true" />
              )}
              {isGeneratingCrisis
                ? "Generating scenario"
                : "Generate a tailored scenario"}
            </Button>

            {crisis === "custom" ? (
              <div className="grid gap-2">
                <label htmlFor="custom-crisis" className="text-sm font-bold">
                  Custom scenario
                </label>
                <Textarea
                  id="custom-crisis"
                  value={customCrisis}
                  onChange={(event) =>
                    onCustomCrisisChange(event.target.value)
                  }
                  placeholder="Describe the event, immediate constraints, and what is at stake."
                  className="min-h-36 resize-y"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <details className="group rounded-2xl border border-border/60 bg-card/70 shadow-sm">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-5">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FileUp aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">
                Import context from a document
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Optional AI-assisted extraction from a PRD, OKR, or team brief
              </span>
            </span>
          </span>
          <ChevronDown
            className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </summary>
        <DocumentImport
          analysis={documentAnalysis}
          isAnalyzing={isAnalyzingDocument}
          isDragActive={isDocumentDragActive}
          onDragActiveChange={onDocumentDragActiveChange}
          onUpload={onDocumentUpload}
        />
      </details>

      <div className="flex justify-end">
        <Button
          type="button"
          className="min-h-11 w-full px-5 sm:w-auto"
          onClick={onContinue}
        >
          Continue to team
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
