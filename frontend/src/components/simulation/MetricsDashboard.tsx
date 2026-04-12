"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users } from "lucide-react";
import type { Metrics } from "@/app/simulation/types";

interface MetricsDashboardProps {
  metrics: Metrics;
  prevMetrics: Metrics | null;
  status: string;
  currentRound: number;
}

function getMetricDelta(metrics: Metrics, prevMetrics: Metrics | null, key: keyof Metrics): number | null {
  if (!prevMetrics) return null;
  const diff = metrics[key] - prevMetrics[key];
  if (diff === 0) return null;
  return diff;
}

export function MetricsDashboard({ metrics, prevMetrics, status, currentRound }: MetricsDashboardProps) {
  const moraleChange = getMetricDelta(metrics, prevMetrics, "avgMorale");
  const productivityChange = getMetricDelta(metrics, prevMetrics, "productivity");

  return (
    <aside className="w-[300px] border-l border-border bg-card/20 p-4 shrink-0 hidden lg:flex flex-col overflow-y-auto custom-scroll">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Metrics
        </h2>
      </div>

      <div className="space-y-4">
        {/* Avg Company Morale */}
        <Card className="bg-background/40 border-border/50 shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/20">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Company Morale</CardTitle>
            {moraleChange !== null && (
              <Badge
                variant="outline"
                className={`text-[10px] ${moraleChange < 0 ? "text-red-400 border-red-500/20" : "text-green-400 border-green-500/20"}`}
              >
                {`${moraleChange > 0 ? "+" : ""}${moraleChange}%`}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-3 flex items-end gap-2">
            <span
              className={`text-3xl font-bold tracking-tighter ${metrics.avgMorale < 40 ? "text-red-500" : metrics.avgMorale < 60 ? "text-yellow-500" : "text-green-500"}`}
            >
              {metrics.avgMorale}<span className="text-lg text-muted-foreground font-normal">%</span>
            </span>
          </CardContent>
        </Card>

        {/* Productivity Level */}
        <Card className="bg-background/40 border-border/50 shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/20">
            <CardTitle className="text-xs font-medium text-muted-foreground">Productivity Level</CardTitle>
            {productivityChange !== null && (
              <Badge
                variant="outline"
                className={`text-[10px] ${productivityChange < 0 ? "text-red-400 border-red-500/20" : "text-green-400 border-green-500/20"}`}
              >
                {`${productivityChange > 0 ? "+" : ""}${productivityChange}%`}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-3 flex items-end gap-2">
            <span
              className={`text-3xl font-bold tracking-tighter ${metrics.productivity < 40 ? "text-red-500" : metrics.productivity < 60 ? "text-yellow-500" : "text-green-500"}`}
            >
              {metrics.productivity}<span className="text-lg text-muted-foreground font-normal">%</span>
            </span>
          </CardContent>
        </Card>

        {/* Avg Stress Level */}
        <Card className="bg-background/40 border-border/50 shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/20">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Stress Level</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3 flex items-end gap-2">
            <span
              className={`text-3xl font-bold tracking-tighter ${metrics.avgStress > 70 ? "text-red-500" : metrics.avgStress > 50 ? "text-orange-500" : "text-blue-500"}`}
            >
              {metrics.avgStress}<span className="text-lg text-muted-foreground font-normal">%</span>
            </span>
          </CardContent>
        </Card>

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

        {/* Status Timeline */}
        <div className="pt-4 space-y-3">
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
