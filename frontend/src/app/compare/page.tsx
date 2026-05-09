"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, Loader2, Users, BarChart3,
  AlertTriangle, Trophy, Shield, Zap, Activity, TrendingDown,
  ArrowUpRight, ArrowDownRight, Minus, GitCompareArrows,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SIM_COLORS = [
  { stroke: "#8b5cf6", fill: "#8b5cf620", label: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30", dot: "bg-violet-500" },
  { stroke: "#06b6d4", fill: "#06b6d420", label: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30", dot: "bg-cyan-500" },
  { stroke: "#f59e0b", fill: "#f59e0b20", label: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", dot: "bg-amber-500" },
];

interface SimRecord {
  id: string;
  status: string;
  company_name: string;
  crisis_scenario: string;
  current_round: number;
  total_rounds: number;
  created_at: string;
}

interface ComparisonSim {
  id: string;
  company_name: string;
  crisis_name: string;
  team_size: number;
  agent_names: string[];
  agent_reports: { name: string; role: string; ending_morale: number; peak_stress: number; has_resigned: boolean; status: string }[];
  key_metrics: {
    avg_morale: number;
    avg_stress: number;
    avg_productivity: number;
    avg_loyalty: number;
    resignations: number;
    productivity_drop: number;
    simulation_weeks: number;
  };
  timeline: { round: number; morale: number; stress: number; output: number }[];
  executive_summary: string;
  created_at: string | null;
}

function CompareContent() {
  const router = useRouter();
  const { token } = useAuth();

  // Selection state
  const [simulations, setSimulations] = useState<SimRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingSims, setLoadingSims] = useState(true);

  // Comparison state
  const [comparison, setComparison] = useState<ComparisonSim[] | null>(null);
  const [comparing, setComparing] = useState(false);

  // Fetch completed sims
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/auth/me/simulations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then((data: SimRecord[]) => {
        setSimulations(data.filter((s) => s.status === "completed"));
        setLoadingSims(false);
      })
      .catch(() => setLoadingSims(false));
  }, [token]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      } else {
        toast.warning("Maximum 3 simulations can be compared");
      }
      return next;
    });
  };

  const handleCompare = async () => {
    if (selected.size < 2) {
      toast.warning("Select at least 2 simulations to compare");
      return;
    }
    setComparing(true);
    try {
      const res = await fetch(`${API_BASE}/api/simulation/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulation_ids: Array.from(selected) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Comparison failed");
        setComparing(false);
        return;
      }
      const data = await res.json();
      setComparison(data.simulations);
    } catch {
      toast.error("Network error");
    } finally {
      setComparing(false);
    }
  };

  // Build overlaid timeline data
  const buildTimelineData = () => {
    if (!comparison) return [];
    const maxRounds = Math.max(...comparison.map((s) => s.timeline.length));
    const data: Record<string, number | string>[] = [];
    for (let r = 0; r < maxRounds; r++) {
      const point: Record<string, number | string> = { round: `Wk ${r}` };
      comparison.forEach((sim, idx) => {
        const t = sim.timeline[r];
        if (t) {
          point[`morale_${idx}`] = t.morale;
          point[`stress_${idx}`] = t.stress;
        }
      });
      data.push(point);
    }
    return data;
  };

  // Find best/worst for a metric
  const getBestWorst = (metric: keyof ComparisonSim["key_metrics"], higher_is_better: boolean) => {
    if (!comparison) return { best: -1, worst: -1 };
    const values = comparison.map((s) => s.key_metrics[metric]);
    const best = higher_is_better ? Math.max(...values) : Math.min(...values);
    const worst = higher_is_better ? Math.min(...values) : Math.max(...values);
    return {
      best: values.indexOf(best),
      worst: values.indexOf(worst),
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 backdrop-blur-md bg-background/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden bg-[#18181b] shadow-lg shadow-violet-500/20 border border-violet-500/30 group-hover:scale-105 transition-transform">
              <Image src="/logo.svg" alt="Logo" width={24} height={24} className="object-cover scale-[1.15]" priority />
            </div>
            <span className="font-bold text-lg tracking-tight">TeamDynamics</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-4">
            <GitCompareArrows className="w-3.5 h-3.5" />
            Comparative Analysis
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Compare Simulations</h1>
          <p className="text-muted-foreground">
            {comparison
              ? "Side-by-side analysis of team performance under identical or similar crisis scenarios."
              : "Select 2-3 completed simulations to compare their outcomes."}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ─── SELECTION MODE ─── */}
          {!comparison && (
            <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
              {loadingSims ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : simulations.length === 0 ? (
                <Card className="bg-card/40 border-border/50">
                  <CardContent className="py-12 text-center">
                    <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No completed simulations found.</p>
                    <p className="text-xs text-muted-foreground mt-1">Run at least 2 simulations to use comparison.</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.push("/setup")}>
                      Create Simulation
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      {selected.size} of 3 selected
                    </div>
                    <Button
                      disabled={selected.size < 2 || comparing}
                      onClick={handleCompare}
                      className="shadow-lg shadow-primary/20"
                    >
                      {comparing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Comparing...</>
                      ) : (
                        <><GitCompareArrows className="w-4 h-4 mr-2" /> Compare {selected.size} Simulations</>
                      )}
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {simulations.map((sim) => {
                      const isSelected = selected.has(sim.id);
                      return (
                        <motion.div
                          key={sim.id}
                          layout
                          onClick={() => toggleSelect(sim.id)}
                          className={`cursor-pointer border rounded-xl p-4 transition-all ${
                            isSelected
                              ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10 scale-[1.01]"
                              : "border-border/50 bg-card/40 hover:border-primary/30 hover:bg-card/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                              }`}>
                                {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-sm truncate">{sim.company_name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {sim.crisis_scenario} • {sim.current_round}/{sim.total_rounds} weeks
                                </div>
                              </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground shrink-0">
                              {sim.created_at ? new Date(sim.created_at).toLocaleDateString() : ""}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {simulations.length < 2 && (
                    <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400">
                      💡 You need at least 2 completed simulations. Run another simulation with a different team to compare.
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ─── COMPARISON DASHBOARD ─── */}
          {comparison && (
            <motion.div key="dashboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              {/* Back to selection */}
              <Button variant="ghost" size="sm" onClick={() => setComparison(null)} className="text-muted-foreground -ml-2">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Selection
              </Button>

              {/* Team cards */}
              <div className={`grid gap-4 ${comparison.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {comparison.map((sim, idx) => (
                  <Card key={sim.id} className={`border ${SIM_COLORS[idx].bg} bg-card/40`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${SIM_COLORS[idx].dot}`} />
                        <CardTitle className="text-sm">Team {String.fromCharCode(65 + idx)}</CardTitle>
                      </div>
                      <CardDescription className="text-xs">{sim.company_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-muted-foreground mb-2">{sim.crisis_name}</div>
                      <div className="flex flex-wrap gap-1">
                        {sim.agent_names.map((name) => (
                          <Badge key={name} variant="secondary" className="text-[9px]">{name}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Hint for different crises */}
              {comparison.length >= 2 && new Set(comparison.map((s) => s.crisis_name)).size > 1 && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
                  💡 These simulations used different crisis scenarios. For the most meaningful comparison, run the same crisis with different teams.
                </div>
              )}

              {/* ─── Metrics Comparison Table ─── */}
              <Card className="bg-card/40 border-border/50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <CardTitle>Key Metrics Comparison</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 pr-4 text-muted-foreground font-medium text-xs">Metric</th>
                          {comparison.map((_, idx) => (
                            <th key={idx} className="text-center py-2 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${SIM_COLORS[idx].dot}`} />
                                <span className={`font-semibold ${SIM_COLORS[idx].label}`}>
                                  Team {String.fromCharCode(65 + idx)}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {([
                          { key: "avg_morale" as const, label: "Avg. Morale", icon: Shield, suffix: "%", higherBetter: true },
                          { key: "avg_stress" as const, label: "Avg. Stress", icon: Zap, suffix: "%", higherBetter: false },
                          { key: "avg_productivity" as const, label: "Avg. Productivity", icon: Activity, suffix: "%", higherBetter: true },
                          { key: "avg_loyalty" as const, label: "Avg. Loyalty", icon: Shield, suffix: "%", higherBetter: true },
                          { key: "resignations" as const, label: "Resignations", icon: AlertTriangle, suffix: "", higherBetter: false },
                          { key: "productivity_drop" as const, label: "Productivity Drop", icon: TrendingDown, suffix: "%", higherBetter: false },
                        ]).map((metric) => {
                          const bw = getBestWorst(metric.key, metric.higherBetter);
                          return (
                            <tr key={metric.key} className="border-b border-border/30 last:border-0">
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <metric.icon className="w-3.5 h-3.5" />
                                  <span className="text-xs font-medium">{metric.label}</span>
                                </div>
                              </td>
                              {comparison.map((sim, idx) => {
                                const val = sim.key_metrics[metric.key];
                                const isBest = idx === bw.best && comparison.length > 1;
                                const isWorst = idx === bw.worst && comparison.length > 1 && bw.best !== bw.worst;
                                return (
                                  <td key={idx} className="text-center py-3 px-3">
                                    <span className={`font-bold text-base ${
                                      isBest ? "text-green-400" : isWorst ? "text-red-400" : "text-foreground"
                                    }`}>
                                      {metric.key === "productivity_drop" ? `-${val}` : val}{metric.suffix}
                                    </span>
                                    {isBest && (
                                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                        <ArrowUpRight className="w-3 h-3 text-green-500" />
                                        <span className="text-[9px] text-green-500 font-semibold">BEST</span>
                                      </div>
                                    )}
                                    {isWorst && (
                                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                                        <span className="text-[9px] text-red-500 font-semibold">WORST</span>
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* ─── Overlaid Timeline ─── */}
              <Card className="bg-card/40 border-border/50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <CardTitle>Morale Timeline (Overlaid)</CardTitle>
                  </div>
                  <CardDescription>Compare how team morale evolved week by week.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={buildTimelineData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.15} vertical={false} />
                        <XAxis dataKey="round" tick={{ fontSize: 11 }} stroke="#666" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#666" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                        />
                        <Legend />
                        {comparison.map((sim, idx) => (
                          <Line
                            key={sim.id}
                            type="monotone"
                            dataKey={`morale_${idx}`}
                            name={`Team ${String.fromCharCode(65 + idx)} Morale`}
                            stroke={SIM_COLORS[idx].stroke}
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* ─── Stress Timeline ─── */}
              <Card className="bg-card/40 border-border/50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-red-400" />
                    <CardTitle>Stress Timeline (Overlaid)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={buildTimelineData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.15} vertical={false} />
                        <XAxis dataKey="round" tick={{ fontSize: 11 }} stroke="#666" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#666" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                        />
                        <Legend />
                        {comparison.map((sim, idx) => (
                          <Line
                            key={sim.id}
                            type="monotone"
                            dataKey={`stress_${idx}`}
                            name={`Team ${String.fromCharCode(65 + idx)} Stress`}
                            stroke={SIM_COLORS[idx].stroke}
                            strokeWidth={2.5}
                            strokeDasharray="6 3"
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* ─── Verdict ─── */}
              <Card className="bg-card/40 border-violet-500/30 shadow-xl border">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <CardTitle>Verdict</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    // Determine winner by composite score
                    const scores = comparison.map((sim) => {
                      const km = sim.key_metrics;
                      return km.avg_morale + km.avg_productivity + km.avg_loyalty - km.avg_stress - km.resignations * 20 - km.productivity_drop;
                    });
                    const winnerIdx = scores.indexOf(Math.max(...scores));

                    return (
                      <>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                          <div className={`w-10 h-10 rounded-full ${SIM_COLORS[winnerIdx].dot} flex items-center justify-center text-white font-bold text-sm`}>
                            {String.fromCharCode(65 + winnerIdx)}
                          </div>
                          <div>
                            <div className="font-bold text-amber-400">
                              Team {String.fromCharCode(65 + winnerIdx)} performed best overall
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {comparison[winnerIdx].agent_names.join(", ")} — {comparison[winnerIdx].company_name}
                            </div>
                          </div>
                        </div>

                        <Separator className="opacity-30" />

                        <div className="space-y-3">
                          {comparison.map((sim, idx) => (
                            <div key={sim.id} className="p-3 rounded-lg bg-background/50 border border-border/30">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${SIM_COLORS[idx].dot}`} />
                                <span className={`text-sm font-semibold ${SIM_COLORS[idx].label}`}>
                                  Team {String.fromCharCode(65 + idx)}
                                </span>
                                {idx === winnerIdx && (
                                  <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20">Winner</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                {sim.executive_summary}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
