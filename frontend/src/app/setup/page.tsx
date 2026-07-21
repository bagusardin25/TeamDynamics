"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { AgentDialog } from "@/components/setup/agent-dialog";
import { ContextStep } from "@/components/setup/context-step";
import { ReviewStep } from "@/components/setup/review-step";
import { SetupStepper } from "@/components/setup/setup-stepper";
import { TeamStep } from "@/components/setup/team-step";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  AGENT_COLORS,
  DEFAULT_PERSONALITY,
  FALLBACK_PRESETS,
  MAX_ROSTER_SIZE,
  POPULAR_MODELS,
  createDocumentAutofill,
  getPacingValue,
  type AgentPersonality,
  type AgentTemplate,
  type DocumentAnalysis,
  type DocumentAnalysisPayload,
  type PresetAgent,
  type SetupStepId,
  type SuggestedAgent,
} from "@/lib/setup-model";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SetupPage() {
  const router = useRouter();
  const {
    token,
    user,
    isLoading: authLoading,
    isAdmin,
    logout,
  } = useAuth();

  const [presets, setPresets] = useState<PresetAgent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<PresetAgent[]>([]);
  const [companyName, setCompanyName] = useState("Pied Piper");
  const [companyCulture, setCompanyCulture] = useState(
    "A fast-paced tech startup running low on funding. Everyone is stressed but highly motivated to ship v2.0.",
  );
  const [crisis, setCrisis] = useState("rnd1");
  const [customCrisis, setCustomCrisis] = useState("");
  const [isGeneratingCrisis, setIsGeneratingCrisis] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [pacingSpeed, setPacingSpeed] = useState(50);
  const [isCreatingSimulation, setIsCreatingSimulation] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<SetupStepId>(1);

  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<PresetAgent | null>(null);
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [customType, setCustomType] = useState("");
  const [customColor, setCustomColor] = useState(AGENT_COLORS[0].value);
  const [customMotivation, setCustomMotivation] = useState("");
  const [customExpertise, setCustomExpertise] = useState("");
  const [customModel, setCustomModel] = useState("__default__");
  const [customModelInput, setCustomModelInput] = useState("");
  const [customPersonality, setCustomPersonality] =
    useState<AgentPersonality>({ ...DEFAULT_PERSONALITY });

  const [isAnalyzingDocument, setIsAnalyzingDocument] = useState(false);
  const [documentAnalysis, setDocumentAnalysis] =
    useState<DocumentAnalysis | null>(null);
  const [isDocumentDragActive, setIsDocumentDragActive] = useState(false);

  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/setup");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    async function fetchTemplates() {
      try {
        const response = await fetch(`${API_BASE}/api/agents/templates`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) return;

        const data: unknown = await response.json();
        if (Array.isArray(data)) {
          setTemplates(data as AgentTemplate[]);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch agent templates:", error);
        }
      }
    }

    void fetchTemplates();

    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPresets() {
      try {
        const response = await fetch(`${API_BASE}/api/agents/presets`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid preset response");
        }

        const nextPresets = data as PresetAgent[];
        setPresets(nextPresets);
        setSelectedAgents(nextPresets.slice(0, 3));
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Failed to fetch presets:", error);
        setPresets(FALLBACK_PRESETS);
        setSelectedAgents(FALLBACK_PRESETS.slice(0, 3));
      }
    }

    void fetchPresets();

    return () => controller.abort();
  }, []);

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || selectedAgents.length === 0 || !token) {
      return;
    }

    setSavingTemplate(true);
    try {
      const response = await fetch(`${API_BASE}/api/agents/templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: templateName.trim(),
          agents: selectedAgents,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || "Failed to save template");
        return;
      }

      const data = await response.json();
      setTemplates((currentTemplates) => [
        {
          id: data.id,
          name: data.name,
          created_at: new Date().toISOString(),
        },
        ...currentTemplates,
      ]);
      setShowSaveTemplate(false);
      setTemplateName("");
      toast.success(`Template "${data.name}" saved`);
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleLoadTemplate = async (templateId: string) => {
    if (!token) return;

    setLoadingTemplate(templateId);
    try {
      const response = await fetch(
        `${API_BASE}/api/agents/templates/${templateId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        toast.error("Failed to load template");
        return;
      }

      const data = await response.json();
      setSelectedAgents(data.agents);
      setShowTemplateList(false);
      toast.success(
        `Loaded template "${data.name}" (${data.agent_count} agents)`,
      );
    } catch {
      toast.error("Failed to load template");
    } finally {
      setLoadingTemplate(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/agents/templates/${templateId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        setTemplates((currentTemplates) =>
          currentTemplates.filter((template) => template.id !== templateId),
        );
        toast.success("Template deleted");
      }
    } catch {
      toast.error("Failed to delete template");
    }
  };

  const removeAgent = (id: string) => {
    setSelectedAgents((currentAgents) =>
      currentAgents.filter((agent) => agent.id !== id),
    );
    setExpandedAgent((currentId) => (currentId === id ? null : currentId));
  };

  const addPresetAgent = (agent: PresetAgent) => {
    setSelectedAgents((currentAgents) => {
      if (
        currentAgents.length >= MAX_ROSTER_SIZE ||
        currentAgents.some((selected) => selected.id === agent.id)
      ) {
        return currentAgents;
      }

      return [...currentAgents, agent];
    });
  };

  const handleGenerateCrisis = async () => {
    if (!companyName || !companyCulture) {
      toast.error("Add a company name and operating context first.");
      return;
    }

    setIsGeneratingCrisis(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/simulation/generate-crisis`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_name: companyName,
            company_culture: companyCulture,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to generate scenario");
      }

      const data = await response.json();
      setCrisis("custom");
      setCustomCrisis(`[${data.title}]\n\n${data.description}`);
      toast.success("A tailored pressure scenario is ready");
    } catch (error) {
      console.error(error);
      toast.error("Scenario generation failed. Please try again.");
    } finally {
      setIsGeneratingCrisis(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    const allowedExtensions = [".pdf", ".docx", ".txt", ".csv", ".xlsx"];
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!allowedExtensions.includes(extension)) {
      toast.error(
        `Unsupported format: ${extension}. Allowed: ${allowedExtensions.join(", ")}`,
      );
      return;
    }

    setIsAnalyzingDocument(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE}/api/document/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Document analysis request failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as {
        filename: string;
        analysis: DocumentAnalysisPayload;
      };
      const autofill = createDocumentAutofill(data.analysis, selectedAgents);

      setDocumentAnalysis({ filename: data.filename, analysis: data.analysis });
      setCompanyName(autofill.companyName);
      setCompanyCulture(autofill.companyCulture);
      setCrisis(autofill.crisis);
      setCustomCrisis(autofill.customCrisis);
      if (autofill.rosterWasReplaced) {
        setSelectedAgents(autofill.selectedAgents);
      }

      const omittedMessage = autofill.omittedAgents
        ? ` ${autofill.omittedAgents} additional members were omitted because the roster limit is eight.`
        : "";
      toast.success(
        `Applied ${autofill.appliedLabels.join(", ")}.${omittedMessage}`,
      );
    } catch (error) {
      console.error("Document analysis failed:", error);
      toast.error("Document analysis failed. Your current setup was not changed.");
    } finally {
      setIsAnalyzingDocument(false);
    }
  };

  const addSuggestedAgent = (
    suggestedAgent: SuggestedAgent,
    index: number,
  ) => {
    setSelectedAgents((currentAgents) => {
      if (currentAgents.length >= MAX_ROSTER_SIZE) {
        toast.warning("The roster is full (maximum eight agents).");
        return currentAgents;
      }

      if (
        currentAgents.some(
          (agent) =>
            agent.name === suggestedAgent.name &&
            agent.role === suggestedAgent.role,
        )
      ) {
        return currentAgents;
      }

      const newAgent: PresetAgent = {
        id: `ai-suggested-${Date.now()}-${index}`,
        name: suggestedAgent.name || "Agent",
        role: suggestedAgent.role,
        type: suggestedAgent.type,
        color:
          AGENT_COLORS[currentAgents.length % AGENT_COLORS.length].value,
        personality:
          suggestedAgent.personality || { ...DEFAULT_PERSONALITY },
      };

      toast.success(`${newAgent.name} added to the roster`);
      return [...currentAgents, newAgent];
    });
  };

  const openCreateAgentDialog = () => {
    setEditingAgent(null);
    setCustomName("");
    setCustomRole("");
    setCustomType("");
    setCustomColor(AGENT_COLORS[0].value);
    setCustomMotivation("");
    setCustomExpertise("");
    setCustomModel("__default__");
    setCustomModelInput("");
    setCustomPersonality({ ...DEFAULT_PERSONALITY });
    setShowAgentDialog(true);
  };

  const openEditAgentDialog = (agent: PresetAgent) => {
    setEditingAgent(agent);
    setCustomName(agent.name);
    setCustomRole(agent.role);
    setCustomType(agent.type);
    setCustomColor(agent.color);
    setCustomMotivation(agent.motivation || "");
    setCustomExpertise(agent.expertise || "");

    const agentModel = agent.model || "";
    const isKnownModel = POPULAR_MODELS.some(
      (model) =>
        model.value === agentModel && model.value !== "__default__",
    );
    setCustomModel(
      isKnownModel
        ? agentModel
        : agentModel
          ? "__custom__"
          : "__default__",
    );
    setCustomModelInput(isKnownModel ? "" : agentModel);
    setCustomPersonality({ ...agent.personality });
    setShowAgentDialog(true);
  };

  const handleSaveAgent = () => {
    if (
      !customName.trim() ||
      !customRole.trim() ||
      !customType.trim()
    ) {
      return;
    }

    const resolvedModel =
      customModel === "__custom__"
        ? customModelInput.trim()
        : customModel === "__default__"
          ? ""
          : customModel;

    const agentData: PresetAgent = {
      id: editingAgent ? editingAgent.id : `custom-${Date.now()}`,
      name: customName.trim(),
      role: customRole.trim(),
      type: customType.trim(),
      color: customColor,
      personality: { ...customPersonality },
      motivation: customMotivation.trim() || undefined,
      expertise: customExpertise.trim() || undefined,
      model: resolvedModel || undefined,
    };

    setSelectedAgents((currentAgents) =>
      editingAgent
        ? currentAgents.map((agent) =>
            agent.id === editingAgent.id ? agentData : agent,
          )
        : [...currentAgents, agentData],
    );
    setShowAgentDialog(false);
  };

  const handleCreateSimulation = async () => {
    if (!crisis) {
      toast.warning("Select a pressure scenario before continuing.");
      return;
    }
    if (selectedAgents.length === 0) {
      toast.warning("Select at least one agent.");
      return;
    }

    setIsCreatingSimulation(true);
    try {
      const payload = {
        company: {
          name: companyName,
          culture: companyCulture,
        },
        agents: selectedAgents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          type: agent.type,
          color: agent.color,
          personality: agent.personality,
          motivation: agent.motivation || null,
          expertise: agent.expertise || null,
          model: agent.model || null,
        })),
        crisis: {
          scenario: crisis,
          custom_description: crisis === "custom" ? customCrisis : null,
        },
        params: {
          duration_weeks: durationWeeks,
          pacing: getPacingValue(pacingSpeed),
        },
      };

      const response = await fetch(`${API_BASE}/api/simulation/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        if (response.status === 401) {
          toast.error("Session expired. Please sign in again.");
          router.push("/login?redirect=/setup");
          return;
        }
        if (response.status === 403) {
          toast.error(
            errorData?.detail || "No simulation credits remaining.",
          );
          return;
        }

        throw new Error(
          errorData?.detail || "Failed to create simulation",
        );
      }

      const data = await response.json();
      toast.success("Simulation created. Opening the workspace.");
      router.push(`/simulation?id=${data.id}`);
    } catch (error) {
      console.error("Failed to create simulation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create simulation. Make sure the backend is running.",
      );
    } finally {
      setIsCreatingSimulation(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p
          role="status"
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"
        >
          <Loader2
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          Loading setup
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const rosterFull = selectedAgents.length >= MAX_ROSTER_SIZE;
  const availablePresets = presets.filter(
    (preset) =>
      !selectedAgents.some((selected) => selected.id === preset.id),
  );

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground antialiased">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,#80808018_1px,transparent_1px),linear-gradient(to_bottom,#80808018_1px,transparent_1px)] opacity-60"
      />

      <DashboardNav
        user={user}
        isAdmin={isAdmin}
        onSignOut={() => {
          logout();
          window.location.assign("/login");
        }}
      />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-8 sm:px-6 md:pb-24 md:pt-10">
        <div className="grid gap-7">
          <header className="grid gap-5 border-b border-border/60 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "-ml-2 mb-3 min-h-11 px-2 text-muted-foreground",
                )}
              >
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                Back to dashboard
              </Link>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                New simulation
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
                Configure a decision-ready simulation
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Set the organizational context, assemble the team, then review
                the run before using a simulation credit.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-sm shadow-sm">
              <p className="text-xs text-muted-foreground">Current draft</p>
              <p className="mt-1 font-bold">
                {selectedAgents.length} agents · {durationWeeks} weeks
              </p>
            </div>
          </header>

          <SetupStepper
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="motion-reduce:transform-none motion-reduce:transition-none"
            >
              {currentStep === 1 ? (
                <ContextStep
                  companyName={companyName}
                  companyCulture={companyCulture}
                  crisis={crisis}
                  customCrisis={customCrisis}
                  isGeneratingCrisis={isGeneratingCrisis}
                  isAnalyzingDocument={isAnalyzingDocument}
                  isDocumentDragActive={isDocumentDragActive}
                  documentAnalysis={documentAnalysis}
                  onCompanyNameChange={setCompanyName}
                  onCompanyCultureChange={setCompanyCulture}
                  onCrisisChange={setCrisis}
                  onCustomCrisisChange={setCustomCrisis}
                  onGenerateCrisis={() => void handleGenerateCrisis()}
                  onDocumentDragActiveChange={setIsDocumentDragActive}
                  onDocumentUpload={(file) =>
                    void handleDocumentUpload(file)
                  }
                  onContinue={() => setCurrentStep(2)}
                />
              ) : null}

              {currentStep === 2 ? (
                <TeamStep
                  availablePresets={availablePresets}
                  selectedAgents={selectedAgents}
                  suggestedAgents={
                    documentAnalysis?.analysis.suggested_agents ?? []
                  }
                  templates={templates}
                  expandedAgent={expandedAgent}
                  showSaveTemplate={showSaveTemplate}
                  showTemplateList={showTemplateList}
                  templateName={templateName}
                  savingTemplate={savingTemplate}
                  loadingTemplate={loadingTemplate}
                  rosterFull={rosterFull}
                  canUseTemplates={Boolean(token)}
                  onAddPreset={addPresetAgent}
                  onAddSuggestedAgent={addSuggestedAgent}
                  onCreateAgent={openCreateAgentDialog}
                  onEditAgent={openEditAgentDialog}
                  onRemoveAgent={removeAgent}
                  onExpandedAgentChange={setExpandedAgent}
                  onShowSaveTemplateChange={setShowSaveTemplate}
                  onShowTemplateListChange={setShowTemplateList}
                  onTemplateNameChange={setTemplateName}
                  onSaveTemplate={() => void handleSaveTemplate()}
                  onLoadTemplate={(id) => void handleLoadTemplate(id)}
                  onDeleteTemplate={(id) =>
                    void handleDeleteTemplate(id)
                  }
                  onBack={() => setCurrentStep(1)}
                  onContinue={() => setCurrentStep(3)}
                />
              ) : null}

              {currentStep === 3 ? (
                <ReviewStep
                  companyName={companyName}
                  companyCulture={companyCulture}
                  crisis={crisis}
                  customCrisis={customCrisis}
                  selectedAgents={selectedAgents}
                  durationWeeks={durationWeeks}
                  pacingSpeed={pacingSpeed}
                  credits={user.credits}
                  isAdmin={isAdmin}
                  isCreating={isCreatingSimulation}
                  onDurationChange={setDurationWeeks}
                  onPacingChange={setPacingSpeed}
                  onBack={() => setCurrentStep(2)}
                  onCreate={() => void handleCreateSimulation()}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AgentDialog
        open={showAgentDialog}
        editingAgent={editingAgent}
        name={customName}
        role={customRole}
        type={customType}
        color={customColor}
        motivation={customMotivation}
        expertise={customExpertise}
        model={customModel}
        customModelInput={customModelInput}
        personality={customPersonality}
        onOpenChange={setShowAgentDialog}
        onNameChange={setCustomName}
        onRoleChange={setCustomRole}
        onTypeChange={setCustomType}
        onColorChange={setCustomColor}
        onMotivationChange={setCustomMotivation}
        onExpertiseChange={setCustomExpertise}
        onModelChange={setCustomModel}
        onCustomModelInputChange={setCustomModelInput}
        onPersonalityChange={(key, value) =>
          setCustomPersonality((currentPersonality) => ({
            ...currentPersonality,
            [key]: value,
          }))
        }
        onSave={handleSaveAgent}
      />
    </div>
  );
}
