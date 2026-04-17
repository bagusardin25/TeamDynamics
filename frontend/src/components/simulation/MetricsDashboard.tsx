"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Users, Heart, Shield, TrendingUp, Zap,
  DollarSign, Star, Clock, MessageSquare, AlertTriangle, Target, LineChart
} from "lucide-react";
import type { Metrics, Agent, WorldState, DecisionStatus, MetricsSnapshot } from "@/app/simulation/types";
import { RadialGauge } from "./RadialGauge";

interface MetricsDashboardProps {
  metrics: Metrics;
  prevMetrics: Metrics | null;
  status: string;
  currentRound: number;
  agents: Agent[];
  worldState: WorldState | null;
  decisionStatus: DecisionStatus | null;
  metricsHistory: MetricsSnapshot[];
}

function getMetricDelta(metrics: Metrics, prevMetrics: Metrics | null, key: keyof Metrics): number | null {
  if (!prevMetrics) return null;
  const diff = metrics[key] - prevMetrics[key];
  if (diff === 0) return null;
  return diff;
}

function MetricCard({
  label, value, unit = "%", icon: Icon, color, delta,
}: {
  label: string; value: number; unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; delta?: number | null;
}) {
  return (
    <Card className="bg-background/40 border-border/50 shadow-sm">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/20">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Icon className={`w-3 h-3 ${color}`} />
          {label}
        </CardTitle>
        {delta !== null && delta !== undefined && (
          <Badge
            variant="outline"
            className={`text-[10px] ${delta < 0 ? "text-red-400 border-red-500/20" : "text-green-400 border-green-500/20"}`}
          >
            {`${delta > 0 ? "+" : ""}${delta}%`}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <span
          className={`text-3xl font-bold tracking-tighter ${
            value < 30 ? "text-red-500" :
            value < 50 ? "text-yellow-500" :
            value < 70 ? "text-blue-500" : "text-green-500"
          }`}
        >
          {value}<span className="text-lg text-muted-foreground font-normal">{unit}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MetricsDashboard({
  metrics, prevMetrics, status, currentRound, agents,
  worldState, decisionStatus, metricsHistory,
}: MetricsDashboardProps) {
  const moraleChange = getMetricDelta(metrics, prevMetrics, "avgMorale");
  const productivityChange = getMetricDelta(metrics, prevMetrics, "productivity");
  const loyaltyChange = getMetricDelta(metrics, prevMetrics, "avgLoyalty");
  const cohesionChange = getMetricDelta(metrics, prevMetrics, "teamCohesion");

  const moraleData = metricsHistory.map(m => m.morale);
  const stressData = metricsHistory.map(m => m.stress);

  return (
    <aside className="w-[300px] border-l border-border bg-card/20 shrink-0 hidden lg:flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-2 shrink-0">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Metrics
        </h2>
        <Badge variant="secondary" className="text-[10px]">
          W{currentRound}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-3 custom-scroll">
        {/* Team Health Center */}
        <Card className="bg-background/40 border-border/50 shadow-sm overflow-visible my-4">
          <CardHeader className="py-3 px-4 border-b border-border/20 bg-secondary/20">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Heart className="w-3.5 h-3.5" /> Team Vitality
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-6 pb-10 flex items-center justify-around gap-2">
            <RadialGauge value={metrics.avgMorale} label="Morale" color="text-emerald-500" size={72} />
            <RadialGauge value={metrics.avgStress} label="Stress" color={metrics.avgStress > 70 ? "text-rose-500" : "text-amber-500"} size={72} />
            <RadialGauge value={metrics.productivity} label="Output" color="text-blue-500" size={72} />
          </CardContent>
        </Card>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Cohesion" value={metrics.teamCohesion}
            icon={Users} color="text-violet-500" delta={cohesionChange}
          />
          <MetricCard
            label="Loyalty" value={metrics.avgLoyalty}
            icon={Shield} color="text-cyan-500" delta={loyaltyChange}
          />
        </div>

        {/* Resignations */}
        {metrics.resignations > 0 && (
          <Card className="bg-red-500/5 border-red-500/20 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Resignations</div>
                <div className="text-2xl font-bold text-red-500">{metrics.resignations}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trend Sparklines */}
        {metricsHistory.length > 1 && (
          <Card className="bg-background/40 border-border/50 shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/20">
              <CardTitle className="text-xs font-medium text-muted-foreground">Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Morale</span>
                <MiniSparkline data={moraleData} color="#22c55e" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Stress</span>
                <MiniSparkline data={stressData} color="#ef4444" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* World State */}
        {worldState && (
          <Card className="bg-background/40 border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Target className="w-24 h-24" />
            </div>
            <CardHeader className="py-3 px-4 border-b border-border/20 bg-secondary/20">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                🌍 Project State
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Budget</span>
                  <span className={`font-semibold ${worldState.budgetRemaining < 30 ? "text-red-500" : "text-foreground"}`}>{worldState.budgetRemaining}%</span>
                </div>
                <Progress value={worldState.budgetRemaining} className="h-1.5" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> Reputation</span>
                  <span className={`font-semibold ${worldState.companyReputation < 30 ? "text-red-500" : "text-foreground"}`}>{worldState.companyReputation}%</span>
                </div>
                <Progress value={worldState.companyReputation} className="h-1.5" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Customer Sat.</span>
                  <span className="font-semibold">{worldState.customerSatisfaction}%</span>
                </div>
                <Progress value={worldState.customerSatisfaction} className="h-1.5" />
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/20">
                <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Deadline</span>
                <span className={`font-semibold ${worldState.deadlineWeeksLeft <= 2 ? "text-red-500" : "text-foreground"}`}>
                  {worldState.deadlineWeeksLeft}w left
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tech Debt</span>
                <span className={`font-semibold ${worldState.technicalDebt > 60 ? "text-orange-500" : "text-foreground"}`}>
                  {worldState.technicalDebt}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Decision Progress */}
        {decisionStatus && (
          <Card className="bg-background/40 border-border/50 shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/20">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Decision Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {decisionStatus.hasDecision ? (
                <div className="text-xs">
                  <Badge variant="outline" className="text-green-400 border-green-500/20 bg-green-500/10 text-[10px] mb-2">
                    ✅ Decision Reached
                  </Badge>
                  <p className="text-muted-foreground leading-relaxed">
                    {decisionStatus.decidedProposal}
                  </p>
                </div>
              ) : decisionStatus.leadingProposal ? (
                <div className="text-xs">
                  <Badge variant="outline" className="text-orange-400 border-orange-500/20 bg-orange-500/10 text-[10px] mb-2">
                    📋 Leading Proposal
                  </Badge>
                  <p className="text-muted-foreground leading-relaxed">
                    {decisionStatus.leadingProposal}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-muted-foreground">Support:</span>
                    <Progress value={Math.min(100, (decisionStatus.leadingSupport / 3.0) * 100)} className="h-1 flex-1" />
                    <span className="text-[10px] font-mono">{decisionStatus.leadingSupport}/3.0</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {decisionStatus.proposalCount > 0
                    ? `${decisionStatus.proposalCount} proposals on the table`
                    : "No proposals yet"}
                </p>
              )}
              {decisionStatus.resignThreats > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-orange-400 pt-1">
                  <AlertTriangle className="w-3 h-3" />
                  {decisionStatus.resignThreats} resign threat{decisionStatus.resignThreats > 1 ? "s" : ""}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Per-Agent Status */}
        {agents.length > 0 && (
          <Card className="bg-background/40 border-border/50 shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/20">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Agent Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${agent.has_resigned ? "opacity-40" : "bg-background/30"}`}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold shrink-0">
                    {agent.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium truncate">
                      {agent.name}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            agent.morale < 30 ? "bg-red-500" :
                            agent.morale < 50 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${agent.morale}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-muted-foreground w-6 text-right">{agent.morale}</span>
                    </div>
                  </div>
                  {agent.has_resigned && (
                    <Badge variant="outline" className="text-[8px] text-red-400 border-red-500/20 shrink-0">
                      Left
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Status Timeline */}
        <div className="pt-2 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</h3>
          <div className="space-y-4 border-l-2 border-border/50 ml-2 pl-4 py-1">
            <div className="relative">
              <div
                className={`absolute w-2 h-2 rounded-full -left-[21px] top-1.5 ring-4 ring-background ${status === "completed" ? "bg-green-500" : "bg-orange-500"}`}
              />
              <p className="text-xs text-muted-foreground font-medium mb-0.5">
                {status === "completed" ? "Completed" : `Week ${currentRound} • In Progress`}
              </p>
              <p className="text-sm">{status === "completed" ? "All rounds finished" : "Simulation running"}</p>
            </div>
            <div className="relative opacity-60">
              <div className="absolute w-2 h-2 bg-primary/40 rounded-full -left-[21px] top-1.5 ring-4 ring-background" />
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Initialization</p>
              <p className="text-sm">Team Roster Loaded</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
