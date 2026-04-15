"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, AlertTriangle, Play, Briefcase, Plus, X, Loader2, UserPlus, Pencil, ChevronDown, Cpu, Sparkles, FileUp, FileText, CheckCircle2 } from "lucide-react";
import { RadarChart } from "@/components/ui/radar-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MAX_ROSTER_SIZE = 8;

interface AgentPersonality {
  empathy: number;
  ambition: number;
  stressTolerance: number;
  agreeableness: number;
  assertiveness: number;
}

interface PresetAgent {
  id: string;
  name: string;
  role: string;
  type: string;
  color: string;
  personality: AgentPersonality;
  motivation?: string;
  expertise?: string;
  model?: string;
}

const POPULAR_MODELS = [
  { label: "Default (Global)", value: "__default__" },
  { label: "GPT-4o Mini", value: "gpt-4o-mini" },
  { label: "GPT-4o", value: "gpt-4o" },
  { label: "Claude 3.7 Sonnet", value: "anthropic/claude-3.7-sonnet" },
  { label: "Claude 3 Haiku", value: "anthropic/claude-3-haiku" },
  { label: "Llama 3.1 8B (Free)", value: "meta-llama/llama-3.1-8b-instruct:free" },
  { label: "Kimi K2.5", value: "moonshotai/kimi-k2.5" },
  { label: "Mistral 7B (Free)", value: "mistralai/mistral-7b-instruct:free" },
  { label: "Deepseek", value: "deepseek/deepseek-v3.2" },
  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
  { label: "Custom...", value: "__custom__" },
];

const AGENT_COLORS = [
  { label: "Red", value: "bg-red-500/20 text-red-500", dot: "bg-red-500" },
  { label: "Green", value: "bg-green-500/20 text-green-500", dot: "bg-green-500" },
  { label: "Blue", value: "bg-blue-500/20 text-blue-500", dot: "bg-blue-500" },
  { label: "Purple", value: "bg-purple-500/20 text-purple-500", dot: "bg-purple-500" },
  { label: "Orange", value: "bg-orange-500/20 text-orange-500", dot: "bg-orange-500" },
  { label: "Cyan", value: "bg-cyan-500/20 text-cyan-500", dot: "bg-cyan-500" },
  { label: "Pink", value: "bg-pink-500/20 text-pink-500", dot: "bg-pink-500" },
  { label: "Yellow", value: "bg-yellow-500/20 text-yellow-500", dot: "bg-yellow-500" },
];

const DEFAULT_PERSONALITY: AgentPersonality = {
  empathy: 50,
  ambition: 50,
  stressTolerance: 50,
  agreeableness: 50,
  assertiveness: 50,
};

export default function SetupPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [presets, setPresets] = useState<PresetAgent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<PresetAgent[]>([]);
  const [companyName, setCompanyName] = useState("Pied Piper");
  const [companyCulture, setCompanyCulture] = useState(
    "A fast-paced tech startup running low on funding. Everyone is stressed but highly motivated to ship v2.0."
  );
  const [crisis, setCrisis] = useState("");
  const [customCrisis, setCustomCrisis] = useState("");
  const [isGeneratingCrisis, setIsGeneratingCrisis] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [pacingSpeed, setPacingSpeed] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Custom Agent Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<PresetAgent | null>(null);
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [customType, setCustomType] = useState("");
  const [customColor, setCustomColor] = useState(AGENT_COLORS[0].value);
  const [customMotivation, setCustomMotivation] = useState("");
  const [customExpertise, setCustomExpertise] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [customModelInput, setCustomModelInput] = useState("");
  const [customPersonality, setCustomPersonality] = useState<AgentPersonality>({ ...DEFAULT_PERSONALITY });

  // Preset picker dropdown
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  // Document upload state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [docAnalysis, setDocAnalysis] = useState<{
    filename: string;
    analysis: {
      summary: string;
      key_requirements: string[];
      team_risks: string[];
      suggested_crisis: { title: string; description: string };
      suggested_agents: { role: string; type: string; rationale: string }[];
      actionable_insights: string[];
    };
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Fetch preset agents on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/agents/presets`)
      .then((res) => res.json())
      .then((data) => {
        setPresets(data);
        setSelectedAgents(data.slice(0, 3));
      })
      .catch((err) => {
        console.error("Failed to fetch presets:", err);
        // Fallback to hardcoded presets
        const fallback: PresetAgent[] = [
          { id: "1", name: "Alex", role: "Tech Lead", type: "Strict & Burned Out", color: "bg-red-500/20 text-red-500", personality: { empathy: 30, ambition: 80, stressTolerance: 25, agreeableness: 20, assertiveness: 90 } },
          { id: "2", name: "Sam", role: "Junior Dev", type: "Ambitious & Naive", color: "bg-green-500/20 text-green-500", personality: { empathy: 65, ambition: 90, stressTolerance: 30, agreeableness: 80, assertiveness: 25 } },
          { id: "3", name: "Jordan", role: "Product Manager", type: "Empathetic", color: "bg-blue-500/20 text-blue-500", personality: { empathy: 90, ambition: 55, stressTolerance: 70, agreeableness: 85, assertiveness: 40 } },
          { id: "4", name: "Casey", role: "Senior Dev", type: "Silent & Efficient", color: "bg-purple-500/20 text-purple-500", personality: { empathy: 40, ambition: 60, stressTolerance: 85, agreeableness: 30, assertiveness: 50 } },
        ];
        setPresets(fallback);
        setSelectedAgents(fallback.slice(0, 3));
      });
  }, []);

  const removeAgent = (id: string) => setSelectedAgents(selectedAgents.filter((a) => a.id !== id));

  const addPresetAgent = (agent: PresetAgent) => {
    if (selectedAgents.length >= MAX_ROSTER_SIZE) return;
    if (!selectedAgents.find((a) => a.id === agent.id)) {
      setSelectedAgents([...selectedAgents, agent]);
    }
  };

  const handleGenerateCrisis = async () => {
    if (!companyName || !companyCulture) {
      toast.error("Please fill in Company Name and Culture first.");
      return;
    }
    setIsGeneratingCrisis(true);
    try {
      const res = await fetch(`${API_BASE}/api/simulation/generate-crisis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName, company_culture: companyCulture }),
      });
      if (!res.ok) throw new Error("Failed to generate crisis");
      const data = await res.json();
      setCrisis("custom");
      setCustomCrisis(`[${data.title}]\n\n${data.description}`);
      toast.success("AI tailored a custom crisis for your startup!");
    } catch (err) {
      console.error(err);
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsGeneratingCrisis(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }
    const allowedExts = [".pdf", ".docx", ".doc", ".txt", ".csv", ".xlsx", ".xls"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExts.includes(ext)) {
      toast.error(`Unsupported format: ${ext}. Allowed: ${allowedExts.join(", ")}`);
      return;
    }
    setIsAnalyzing(true);
    setDocAnalysis(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/document/analyze`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Analysis failed");
      }
      const data = await res.json();
      setDocAnalysis({ filename: data.filename, analysis: data.analysis });
      toast.success("Document analyzed successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Document analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyDocSuggestions = () => {
    if (!docAnalysis) return;
    const a = docAnalysis.analysis;
    if (a.suggested_crisis) {
      setCrisis("custom");
      setCustomCrisis(`[${a.suggested_crisis.title}]\n\n${a.suggested_crisis.description}`);
    }
    toast.success("Suggestions applied! Check crisis and review agents.");
  };

  const openCreateModal = () => {
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
    setShowCreateModal(true);
  };

  const openEditModal = (agent: PresetAgent) => {
    setEditingAgent(agent);
    setCustomName(agent.name);
    setCustomRole(agent.role);
    setCustomType(agent.type);
    setCustomColor(agent.color);
    setCustomMotivation(agent.motivation || "");
    setCustomExpertise(agent.expertise || "");
    const agentModel = agent.model || "";
    const isKnown = POPULAR_MODELS.some(m => m.value === agentModel && m.value !== "__default__");
    setCustomModel(isKnown ? agentModel : (agentModel ? "__custom__" : "__default__"));
    setCustomModelInput(isKnown ? "" : (agentModel || ""));
    setCustomPersonality({ ...agent.personality });
    setShowCreateModal(true);
  };

  const handleSaveAgent = () => {
    if (!customName.trim() || !customRole.trim() || !customType.trim()) return;

    const resolvedModel = customModel === "__custom__" ? customModelInput.trim() : (customModel === "__default__" ? "" : customModel);
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

    if (editingAgent) {
      setSelectedAgents(selectedAgents.map((a) => (a.id === editingAgent.id ? agentData : a)));
    } else {
      setSelectedAgents([...selectedAgents, agentData]);
    }

    setShowCreateModal(false);
  };

  const getPacingLabel = () => {
    if (pacingSpeed <= 25) return "Slow";
    if (pacingSpeed <= 75) return "Normal";
    return "Fast";
  };

  const getPacingValue = (): string => {
    if (pacingSpeed <= 25) return "slow";
    if (pacingSpeed <= 75) return "normal";
    return "fast";
  };

  const estimateApiCalls = () => {
    return selectedAgents.length * durationWeeks;
  };

  const estimateCost = () => {
    return (estimateApiCalls() * 0.0005).toFixed(2);
  };

  const handleStartSimulation = async () => {
    if (!crisis) {
      toast.warning("Please select a crisis scenario before starting.");
      return;
    }
    if (selectedAgents.length === 0) {
      toast.warning("Please select at least one agent.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        company: {
          name: companyName,
          culture: companyCulture,
        },
        agents: selectedAgents.map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          type: a.type,
          color: a.color,
          personality: a.personality,
          motivation: a.motivation || null,
          expertise: a.expertise || null,
          model: a.model || null,
        })),
        crisis: {
          scenario: crisis,
          custom_description: crisis === "custom" ? customCrisis : null,
        },
        params: {
          duration_weeks: durationWeeks,
          pacing: getPacingValue(),
        },
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/simulation/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 403) {
          toast.error(errData?.detail || "No simulation credits remaining.");
          setIsLoading(false);
          return;
        }
        throw new Error(errData?.detail || "Failed to create simulation");
      }

      const data = await res.json();
      toast.success("Simulation created! Redirecting...");
      router.push(`/simulation?id=${data.id}`);
    } catch (err: any) {
      console.error("Failed to start simulation:", err);
      toast.error(err.message || "Failed to start simulation. Make sure the backend server is running.");
      setIsLoading(false);
    }
  };

  const rosterFull = selectedAgents.length >= MAX_ROSTER_SIZE;
  const availablePresets = presets.filter((p) => !selectedAgents.find((s) => s.id === p.id));

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header & Stepper */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Configure Simulation</h1>
            <p className="text-muted-foreground">Setup your team, inject the crisis, and watch the chaos.</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep === step ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-110' : currentStep > step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{currentStep > step ? '✓' : step}</div>
                {step < 3 && <div className={`w-6 sm:w-12 h-1 rounded-full transition-colors duration-300 ${currentStep > step ? 'bg-primary/50' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[600px]">
          <AnimatePresence mode="wait">
            {/* Step 1 */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 max-w-3xl mx-auto">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="w-5 h-5 text-primary" />
                      <CardTitle>Company Profile</CardTitle>
                    </div>
                    <CardDescription>Define the tone and context of your startup.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company Name</label>
                      <Input placeholder="e.g. Acme Corp" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company Culture / Context</label>
                      <Textarea placeholder="Describe the current state of the company..." value={companyCulture} onChange={(e) => setCompanyCulture(e.target.value)} className="min-h-[100px] bg-background/50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl border-t-4 border-t-orange-500">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <CardTitle>Crisis Injection</CardTitle>
                    </div>
                    <CardDescription>What event triggers this simulation?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <label className="text-sm font-medium">Select Scenario</label>
                         <Button variant="ghost" size="sm" onClick={handleGenerateCrisis} disabled={isGeneratingCrisis} className="h-7 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-500/10">
                           {isGeneratingCrisis ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                           Auto-Generate
                         </Button>
                       </div>
                      <Select value={crisis} onValueChange={(val) => setCrisis(val || "")}>
                        <SelectTrigger className="w-full bg-background/50">
                          <SelectValue placeholder="Choose a crisis..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rnd1">Mandatory Weekend Coding for v2.0</SelectItem>
                          <SelectItem value="rnd2">Budget Cut: 30% Layoffs Required</SelectItem>
                          <SelectItem value="rnd3">CEO Resigns Unexpectedly</SelectItem>
                          <SelectItem value="rnd4">Critical Database Deleted on Friday</SelectItem>
                          <SelectItem value="custom">Custom Crisis...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {crisis === "custom" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 pt-2">
                        <label className="text-sm font-medium">Describe Custom Event</label>
                        <Textarea placeholder="e.g. We just lost our biggest client and everyone's panic-blaming each other..." value={customCrisis} onChange={(e) => setCustomCrisis(e.target.value)} className="min-h-[100px] bg-background/50" />
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {/* Document Upload & AI Analysis */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl border-t-4 border-t-violet-500">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <FileUp className="w-5 h-5 text-violet-500" />
                      <CardTitle>AI Document Analysis</CardTitle>
                      <Badge variant="secondary" className="text-[10px] bg-violet-500/10 text-violet-400 border-none">New</Badge>
                    </div>
                    <CardDescription>Upload a document (PDF, DOCX, TXT, CSV, Excel) for AI-powered requirement extraction and crisis suggestions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Drop zone */}
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                        dragOver ? "border-violet-500 bg-violet-500/10" : "border-border/60 hover:border-violet-500/50 hover:bg-violet-500/5"
                      } ${isAnalyzing ? "pointer-events-none opacity-60" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleDocumentUpload(file);
                      }}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".pdf,.docx,.doc,.txt,.csv,.xlsx,.xls";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleDocumentUpload(file);
                        };
                        input.click();
                      }}
                    >
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                          <p className="text-sm font-medium text-violet-400">Analyzing document...</p>
                          <p className="text-xs text-muted-foreground">AI is extracting requirements and insights</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileUp className={`w-8 h-8 ${dragOver ? "text-violet-500" : "text-muted-foreground"}`} />
                          <p className="text-sm font-medium">Drop a file here or click to upload</p>
                          <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, CSV, Excel — Max 10MB</p>
                        </div>
                      )}
                    </div>

                    {/* Analysis Results */}
                    <AnimatePresence>
                      {docAnalysis && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                          <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-semibold">Analysis: {docAnalysis.filename}</span>
                            </div>

                            {/* Summary */}
                            <p className="text-sm text-muted-foreground leading-relaxed">{docAnalysis.analysis.summary}</p>

                            {/* Key Requirements */}
                            {docAnalysis.analysis.key_requirements.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Key Requirements</h4>
                                <ul className="space-y-1">
                                  {docAnalysis.analysis.key_requirements.map((req, i) => (
                                    <li key={i} className="text-xs text-foreground flex gap-2"><span className="text-violet-400 shrink-0">•</span>{req}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Team Risks */}
                            {docAnalysis.analysis.team_risks.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Team Risks</h4>
                                <ul className="space-y-1">
                                  {docAnalysis.analysis.team_risks.map((risk, i) => (
                                    <li key={i} className="text-xs text-orange-400 flex gap-2"><AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />{risk}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Suggested Crisis */}
                            {docAnalysis.analysis.suggested_crisis && (
                              <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3">
                                <h4 className="text-xs font-semibold text-orange-400 mb-1">💥 Suggested Crisis</h4>
                                <p className="text-xs font-medium">{docAnalysis.analysis.suggested_crisis.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{docAnalysis.analysis.suggested_crisis.description}</p>
                              </div>
                            )}

                            {/* Suggested Agents */}
                            {docAnalysis.analysis.suggested_agents.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Suggested Team Roles</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {docAnalysis.analysis.suggested_agents.map((agent, i) => (
                                    <div key={i} className="rounded-lg bg-background/50 border border-border/50 p-2">
                                      <div className="text-xs font-semibold">{agent.role}</div>
                                      <Badge variant="secondary" className="text-[9px] mt-0.5">{agent.type}</Badge>
                                      <p className="text-[10px] text-muted-foreground mt-1">{agent.rationale}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Apply Suggestions Button */}
                            <Button size="sm" className="w-full h-9 bg-violet-600 hover:bg-violet-700 text-white" onClick={applyDocSuggestions}>
                              <Sparkles className="w-3 h-3 mr-1" /> Apply Suggestions to Setup
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setCurrentStep(2)} size="lg" className="w-full sm:w-auto h-12 px-8">Next: Assemble Team &rarr;</Button>
                </div>
              </motion.div>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Pool */}
                  <Card className="border-border/50 bg-card/20 backdrop-blur-sm border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg">Agent Pool</CardTitle>
                      <CardDescription>Click to add presets to your roster.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-[400px] overflow-y-auto p-4 content-start">
                      {availablePresets.map((p) => (
                        <motion.button
                          key={p.id}
                          layoutId={`agent-${p.id}`}
                          onClick={() => { addPresetAgent(p); }}
                          className="flex flex-col text-left border border-border/40 rounded-xl p-3 bg-card hover:bg-primary/5 hover:border-primary/50 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-2 w-full">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm text-white ${p.color.replace('text-', 'bg-').replace('/20', '/80')}`}>{p.name.charAt(0)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{p.name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{p.role}</div>
                            </div>
                            <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <Badge variant="secondary" className="text-[9px] w-fit truncate">
                            {p.type}
                          </Badge>
                        </motion.button>
                      ))}
                      <motion.button onClick={openCreateModal} layout className="flex flex-col items-center justify-center text-center border-2 border-dashed border-primary/30 rounded-xl p-4 bg-primary/5 hover:bg-primary/10 transition-colors h-[100px] gap-2 text-primary">
                        <UserPlus className="w-5 h-5" />
                        <span className="text-xs font-semibold">Custom Agent</span>
                      </motion.button>
                    </CardContent>
                  </Card>

                  {/* Right: Roster */}
                  <Card className="border-primary/20 bg-card/50 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />
                    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2 border-b border-border/50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-5 h-5 text-primary" />
                          <CardTitle>Active Roster</CardTitle>
                        </div>
                        <CardDescription>Your team for the simulation.</CardDescription>
                      </div>
                      <Badge variant={rosterFull ? "destructive" : "secondary"} className="shrink-0 mt-1 shadow-sm">
                        {selectedAgents.length}/8
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 h-[400px] overflow-y-auto">
                      <AnimatePresence>
                        {selectedAgents.length === 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <Users className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">Roster is empty.</p>
                            <p className="text-xs">Add up to 8 agents.</p>
                          </motion.div>
                        )}
                        {selectedAgents.map((agent) => (
                          <motion.div
                            key={agent.id}
                            layoutId={`agent-${agent.id}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                            className="border border-border/50 rounded-xl p-3 bg-background/80 backdrop-blur-md relative group cursor-pointer transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(var(--primary),0.15)]"
                            onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                          >
                            <button onClick={(e) => { e.stopPropagation(); removeAgent(agent.id); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground z-10"><X className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(agent); }} className="absolute top-2 right-10 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground z-10"><Pencil className="w-3 h-3" /></button>

                            <div className="flex items-center gap-3 mb-2">
                              {/* Soft GLow based on agent color type */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md text-white ${agent.color.replace('text-', 'bg-').replace('/20', '/80')}`}>
                                {agent.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-sm group-hover:text-primary transition-colors">{agent.name}</div>
                                <div className="text-xs text-muted-foreground">{agent.role}</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                               <Badge variant="secondary" className={`${agent.color.includes('border') ? agent.color : agent.color + " border-none"} font-medium text-[10px]`}>{agent.type}</Badge>
                               {agent.model && <Badge variant="outline" className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20"><Cpu className="w-2.5 h-2.5 mr-1" />Custom AI</Badge>}
                               {agent.expertise && <Badge variant="outline" className="text-[9px]">🎯 Expert</Badge>}
                            </div>

                            {/* Radar Chart (expanded) */}
                            <AnimatePresence>
                              {expandedAgent === agent.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="mt-3 pt-3 border-t border-border/50 flex flex-col items-center">
                                    <RadarChart size={160} data={[ { label: "EMP", value: agent.personality.empathy }, { label: "AMB", value: agent.personality.ambition }, { label: "RES", value: agent.personality.stressTolerance }, { label: "AGR", value: agent.personality.agreeableness }, { label: "ASR", value: agent.personality.assertiveness } ]} />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} className="h-12 px-6">&larr; Back</Button>
                  <Button onClick={() => setCurrentStep(3)} size="lg" disabled={selectedAgents.length === 0} className="h-12 px-8">Next: Simulation Config &rarr;</Button>
                </div>
              </motion.div>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 max-w-2xl mx-auto">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Simulation Parameters</CardTitle>
                    <CardDescription>Adjust duration and pacing.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="font-medium">Duration (Weeks)</label>
                        <span className="text-xl font-bold text-primary">{durationWeeks}</span>
                      </div>
                      <Slider value={[durationWeeks]} onValueChange={(val) => setDurationWeeks(Array.isArray(val) ? val[0] : val)} max={24} min={1} step={1} className="py-4" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="font-medium">Pacing Speed</label>
                        <span className="text-xl font-bold text-primary">{getPacingLabel()}</span>
                      </div>
                      <Slider value={[pacingSpeed]} onValueChange={(val) => setPacingSpeed(Array.isArray(val) ? val[0] : val)} max={100} step={50} className="py-4" />
                      <p className="text-xs text-muted-foreground">Determines how fast agents reply in the simulated chat UI.</p>
                    </div>

                    <Separator />

                    <motion.div key={estimateCost()} initial={{ opacity: 0.5, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl bg-primary/10 border border-primary/20 p-5 shadow-inner transition-colors duration-500">
                      <h4 className="font-semibold text-primary mb-3">Invoice Estimation</h4>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-muted-foreground">Est. API Calls:</span>
                        <span className="font-mono font-medium">~{estimateApiCalls()}</span>
                      </div>
                      <div className="flex justify-between items-center bg-card/50 px-3 py-2 rounded-lg mt-2 font-medium">
                        <span className="text-muted-foreground">Total Cost:</span>
                        <span className="font-mono text-green-500 font-bold text-lg">~${estimateCost()}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3 text-center opacity-70">Charged to your account credits.</p>
                    </motion.div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)} className="h-12 px-6">&larr; Back</Button>
                  <Button className="h-12 px-10 text-md font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all hover:scale-105" onClick={handleStartSimulation} disabled={isLoading || selectedAgents.length === 0}>
                    {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Igniting...</> : <><Play className="w-5 h-5 mr-2" /> Launch Simulation</>}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create / Edit Agent Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{editingAgent ? "Edit Agent" : "Create Custom Agent"}</h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Name *</label>
                    <Input
                      placeholder="e.g. Taylor"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Role *</label>
                    <Input
                      placeholder="e.g. Designer"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Personality Type *</label>
                  <Input
                    placeholder="e.g. Perfectionist & Anxious"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                {/* Color Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Color Tag</label>
                  <div className="flex gap-2">
                    {AGENT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setCustomColor(c.value)}
                        className={`w-7 h-7 rounded-full ${c.dot} transition-all ${customColor === c.value ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110" : "opacity-60 hover:opacity-100"}`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Personality Traits */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personality Traits</label>
                  <div className="space-y-4 pt-2">
                    {[
                      { key: "empathy" as const, label: "Empathy", desc: "How well they understand others' feelings" },
                      { key: "ambition" as const, label: "Ambition", desc: "Drive to achieve and succeed" },
                      { key: "stressTolerance" as const, label: "Stress Tolerance", desc: "Ability to handle pressure" },
                      { key: "agreeableness" as const, label: "Agreeableness", desc: "Tendency to cooperate and comply" },
                      { key: "assertiveness" as const, label: "Assertiveness", desc: "Willingness to speak up and lead" },
                    ].map((trait) => (
                      <div key={trait.key} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium">{trait.label}</span>
                            <p className="text-[10px] text-muted-foreground">{trait.desc}</p>
                          </div>
                          <span className="text-sm font-bold text-primary w-8 text-right">{customPersonality[trait.key]}</span>
                        </div>
                        <Slider
                          value={customPersonality[trait.key]}
                          onValueChange={(val) => setCustomPersonality({ ...customPersonality, [trait.key]: val as number })}
                          max={100}
                          min={0}
                          step={5}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Motivation & Expertise */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Motivation</label>
                  <Textarea
                    placeholder="e.g. Wants to prove themselves after a failed project..."
                    value={customMotivation}
                    onChange={(e) => setCustomMotivation(e.target.value)}
                    className="min-h-[60px] bg-background/50 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Expertise / Skills</label>
                  <Input
                    placeholder="e.g. React, System Design, Team Management"
                    value={customExpertise}
                    onChange={(e) => setCustomExpertise(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <Separator />

                {/* LLM Model Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3 h-3" /> AI Model (Optional)
                  </label>
                  <p className="text-[10px] text-muted-foreground">Assign a specific AI model to this agent via OpenRouter. Leave as &quot;Default&quot; to use the global provider.</p>
                  <Select value={customModel} onValueChange={(val) => { setCustomModel(val || ""); if (val !== "__custom__") setCustomModelInput(""); }}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Default (Global Provider)" />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {customModel === "__custom__" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-1">
                      <Input
                        placeholder="e.g. anthropic/claude-3.7-sonnet"
                        value={customModelInput}
                        onChange={(e) => setCustomModelInput(e.target.value)}
                        className="bg-background/50 font-mono text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Browse models at <a href="https://openrouter.ai/models" target="_blank" rel="noopener" className="text-primary hover:underline">openrouter.ai/models</a></p>
                    </motion.div>
                  )}
                </div>

                {/* Radar Preview */}
                <div className="flex justify-center pt-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Personality Preview</p>
                    <RadarChart
                      size={160}
                      data={[
                        { label: "EMP", value: customPersonality.empathy },
                        { label: "AMB", value: customPersonality.ambition },
                        { label: "RES", value: customPersonality.stressTolerance },
                        { label: "AGR", value: customPersonality.agreeableness },
                        { label: "ASR", value: customPersonality.assertiveness },
                      ]}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveAgent}
                    disabled={!customName.trim() || !customRole.trim() || !customType.trim()}
                  >
                    {editingAgent ? "Save Changes" : "Add to Roster"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
