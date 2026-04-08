"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, AlertTriangle, Play, Briefcase, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PresetAgent {
  id: string;
  name: string;
  role: string;
  type: string;
  color: string;
  personality: {
    empathy: number;
    ambition: number;
    stressTolerance: number;
    agreeableness: number;
    assertiveness: number;
  };
}

export default function SetupPage() {
  const router = useRouter();
  const [presets, setPresets] = useState<PresetAgent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<PresetAgent[]>([]);
  const [companyName, setCompanyName] = useState("Pied Piper");
  const [companyCulture, setCompanyCulture] = useState(
    "A fast-paced tech startup running low on funding. Everyone is stressed but highly motivated to ship v2.0."
  );
  const [crisis, setCrisis] = useState("");
  const [customCrisis, setCustomCrisis] = useState("");
  const [durationWeeks, setDurationWeeks] = useState([12]);
  const [pacingSpeed, setPacingSpeed] = useState([50]);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!selectedAgents.find((a) => a.id === agent.id)) {
      setSelectedAgents([...selectedAgents, agent]);
    }
  };

  const getPacingLabel = () => {
    const val = pacingSpeed[0];
    if (val <= 25) return "Slow";
    if (val <= 75) return "Normal";
    return "Fast";
  };

  const getPacingValue = (): string => {
    const val = pacingSpeed[0];
    if (val <= 25) return "slow";
    if (val <= 75) return "normal";
    return "fast";
  };

  const estimateApiCalls = () => {
    return selectedAgents.length * durationWeeks[0];
  };

  const estimateCost = () => {
    return (estimateApiCalls() * 0.0005).toFixed(2);
  };

  const handleStartSimulation = async () => {
    if (!crisis) {
      alert("Please select a crisis scenario before starting.");
      return;
    }
    if (selectedAgents.length === 0) {
      alert("Please select at least one agent.");
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
        })),
        crisis: {
          scenario: crisis,
          custom_description: crisis === "custom" ? customCrisis : null,
        },
        params: {
          duration_weeks: durationWeeks[0],
          pacing: getPacingValue(),
        },
      };

      const res = await fetch(`${API_BASE}/api/simulation/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create simulation");
      }

      const data = await res.json();
      router.push(`/simulation?id=${data.id}`);
    } catch (err) {
      console.error("Failed to start simulation:", err);
      alert("Failed to start simulation. Make sure the backend server is running on port 8000.");
      setIsLoading(false);
    }
  };

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

            {/* Step 2: Crisis Injection (moved above Team for visibility) */}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-primary" />
                    <CardTitle>Team Roster</CardTitle>
                  </div>
                  <CardDescription>Select the employees who will participate in the simulation.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedAgents.map((agent) => (
                    <motion.div
                      key={agent.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="border border-border rounded-xl p-4 bg-background/50 relative group"
                    >
                      <button
                        onClick={() => removeAgent(agent.id)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="w-3 h-3" />
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
                    </motion.div>
                  ))}

                  {/* Add from presets dropdown */}
                  {presets.filter((p) => !selectedAgents.find((s) => s.id === p.id)).length > 0 && (
                    <div
                      className="border border-dashed border-border rounded-xl p-4 bg-transparent flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer transition-colors min-h-[100px]"
                    >
                      <Plus className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium mb-2">Add from Presets</span>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {presets
                          .filter((p) => !selectedAgents.find((s) => s.id === p.id))
                          .map((p) => (
                            <button
                              key={p.id}
                              onClick={() => addPresetAgent(p)}
                              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20 transition-colors"
                            >
                              + {p.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
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
                    <span className="text-sm font-bold text-primary">{durationWeeks[0]}</span>
                  </div>
                  <Slider value={durationWeeks} onValueChange={setDurationWeeks} max={24} min={1} step={1} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Pacing Speed</label>
                    <span className="text-sm font-bold text-primary">{getPacingLabel()}</span>
                  </div>
                  <Slider value={pacingSpeed} onValueChange={setPacingSpeed} max={100} step={50} />
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
    </div>
  );
}
