"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, AlertTriangle, Play, Briefcase, Plus, X, Loader2, UserPlus, Pencil, ChevronDown, Cpu } from "lucide-react";
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
  { label: "Claude 3.5 Sonnet", value: "anthropic/claude-3.5-sonnet" },
  { label: "Claude 3 Haiku", value: "anthropic/claude-3-haiku" },
  { label: "Llama 3.1 8B (Free)", value: "meta-llama/llama-3.1-8b-instruct:free" },
  { label: "Llama 3.1 70B", value: "meta-llama/llama-3.1-70b-instruct" },
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
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [pacingSpeed, setPacingSpeed] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

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
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configure Simulation</h1>
            <p className="text-muted-foreground">Setup your team, inject the crisis, and watch the chaos.</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* Main Form Column */}
          <div className="md:col-span-8 space-y-8">

            {/* Step 1: Company Profile */}
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
                  <Input
                    placeholder="e.g. Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Culture / Context</label>
                  <Textarea
                    placeholder="Describe the current state of the company..."
                    value={companyCulture}
                    onChange={(e) => setCompanyCulture(e.target.value)}
                    className="min-h-[100px] bg-background/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Crisis Injection */}
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
                  <label className="text-sm font-medium">Select Scenario</label>
                  <Select value={crisis} onValueChange={(val) => setCrisis(val || "")}>
                    <SelectTrigger className="bg-background/50">
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
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2 pt-2"
                  >
                    <label className="text-sm font-medium">Describe Custom Event</label>
                    <Textarea
                      placeholder="e.g. We just lost our biggest client and everyone's panic-blaming each other..."
                      value={customCrisis}
                      onChange={(e) => setCustomCrisis(e.target.value)}
                      className="min-h-[100px] bg-background/50"
                    />
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Step 3: The Team */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-primary" />
                    <CardTitle>Team Roster</CardTitle>
                  </div>
                  <CardDescription>
                    Select preset employees or create custom ones. You can customize personality, motivation, and expertise for each member.
                  </CardDescription>
                </div>
                <Badge variant={rosterFull ? "destructive" : "secondary"} className="shrink-0 mt-1">
                  {selectedAgents.length}/{MAX_ROSTER_SIZE}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedAgents.map((agent) => (
                    <motion.div
                      key={agent.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="border border-border rounded-xl p-4 bg-background/50 relative group cursor-pointer transition-colors hover:border-primary/30"
                      onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                    >
                      {/* Remove button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeAgent(agent.id); }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* Edit button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(agent); }}
                        className="absolute top-2 right-10 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground z-10"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>

                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">{agent.role}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`${agent.color} border-none font-medium text-xs`}>
                        {agent.type}
                      </Badge>

                      {/* Extra info badges */}
                      {(agent.expertise || agent.motivation || agent.model) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.model && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 flex items-center gap-0.5">
                              <Cpu className="w-2.5 h-2.5" />
                              {POPULAR_MODELS.find(m => m.value === agent.model)?.label || agent.model}
                            </span>
                          )}
                          {agent.expertise && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">🎯 {agent.expertise}</span>
                          )}
                          {agent.motivation && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">🔥 {agent.motivation.length > 30 ? agent.motivation.slice(0, 30) + "..." : agent.motivation}</span>
                          )}
                        </div>
                      )}

                      {/* Radar Chart (expanded) */}
                      <AnimatePresence>
                        {expandedAgent === agent.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-border/50 flex flex-col items-center">
                              <RadarChart
                                size={160}
                                data={[
                                  { label: "EMP", value: agent.personality.empathy },
                                  { label: "AMB", value: agent.personality.ambition },
                                  { label: "RES", value: agent.personality.stressTolerance },
                                  { label: "AGR", value: agent.personality.agreeableness },
                                  { label: "ASR", value: agent.personality.assertiveness },
                                ]}
                              />
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10px] text-muted-foreground">
                                <span>EMP = Empathy</span>
                                <span>AMB = Ambition</span>
                                <span>RES = Resilience</span>
                                <span>AGR = Agreeableness</span>
                                <span className="col-span-2 text-center">ASR = Assertiveness</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}

                  {/* Action buttons: Add from Presets + Create Custom */}
                  {!rosterFull && (
                    <>
                      {/* Add from Presets */}
                      {availablePresets.length > 0 && (
                        <div className="relative">
                          <button
                            onClick={() => setShowPresetPicker(!showPresetPicker)}
                            className="w-full border border-dashed border-border rounded-xl p-4 bg-transparent flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer transition-colors min-h-[100px]"
                          >
                            <ChevronDown className={`w-5 h-5 mb-1 transition-transform ${showPresetPicker ? "rotate-180" : ""}`} />
                            <span className="text-sm font-medium">Add from Presets</span>
                            <span className="text-xs text-muted-foreground mt-1">{availablePresets.length} available</span>
                          </button>
                          <AnimatePresence>
                            {showPresetPicker && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="absolute z-20 top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl p-3 shadow-xl space-y-2"
                              >
                                {availablePresets.map((p) => (
                                  <button
                                    key={p.id}
                                    onClick={() => { addPresetAgent(p); setShowPresetPicker(false); }}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                      {p.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium">{p.name}</div>
                                      <div className="text-xs text-muted-foreground">{p.role} · {p.type}</div>
                                    </div>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Create Custom Agent */}
                      <button
                        onClick={openCreateModal}
                        className="border border-dashed border-primary/30 rounded-xl p-4 bg-primary/5 flex flex-col items-center justify-center text-primary hover:bg-primary/10 cursor-pointer transition-colors min-h-[100px]"
                      >
                        <UserPlus className="w-6 h-6 mb-2" />
                        <span className="text-sm font-semibold">Create Custom Agent</span>
                        <span className="text-xs text-primary/60 mt-1">Define personality & skills</span>
                      </button>
                    </>
                  )}
                </div>

                {rosterFull && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Maximum roster size of {MAX_ROSTER_SIZE} reached. Remove an agent to add more.
                  </p>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Sidebar Column */}
          <div className="md:col-span-4 space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Simulation Params</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Duration (Weeks)</label>
                    <span className="text-sm font-bold text-primary">{durationWeeks}</span>
                  </div>
                  <Slider
                    value={durationWeeks}
                    onValueChange={(val) => setDurationWeeks(val as number)}
                    max={24}
                    min={1}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Pacing Speed</label>
                    <span className="text-sm font-bold text-primary">{getPacingLabel()}</span>
                  </div>
                  <Slider
                    value={pacingSpeed}
                    onValueChange={(val) => setPacingSpeed(val as number)}
                    max={100}
                    step={50}
                  />
                  <p className="text-xs text-muted-foreground">Determines how fast agents reply in the simulated chat UI.</p>
                </div>

                <Separator />

                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <h4 className="font-semibold text-sm text-primary mb-2">Cost Estimation</h4>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Est. API Calls:</span>
                    <span className="font-mono">~{estimateApiCalls()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-muted-foreground">Est. Cost:</span>
                    <span className="font-mono text-green-500 font-medium">~${estimateCost()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-6 px-6">
                <Button
                  className="w-full h-12 text-md font-medium"
                  onClick={handleStartSimulation}
                  disabled={isLoading || selectedAgents.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" /> Start Simulation
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

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
                  <Select value={customModel} onValueChange={(val) => { setCustomModel(val); if (val !== "__custom__") setCustomModelInput(""); }}>
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
                        placeholder="e.g. anthropic/claude-3.5-sonnet"
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
