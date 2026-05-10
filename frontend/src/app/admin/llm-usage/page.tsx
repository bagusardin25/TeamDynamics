/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  DollarSign,
  Loader2,
  RefreshCw,
  Save,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UsageSummary {
  date: string;
  total_calls: number;
  total_tokens_in: number;
  total_tokens_out: number;
  total_tokens: number;
  estimated_cost_usd: number;
  calls_by_provider: Record<string, number>;
  calls_by_model: Record<string, number>;
  calls_blocked: number;
  budget_remaining_usd: number;
  budget_used_pct: number;
}

interface LlmUsageStats {
  daily_cap_usd: number;
  cap_enabled: boolean;
  today: UsageSummary;
  history: UsageSummary[];
}

function formatUsd(value: number): string {
  return `$${value.toFixed(value < 1 ? 4 : 2)}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function objectEntries(data: Record<string, number>): Array<[string, number]> {
  return Object.entries(data).sort((a, b) => b[1] - a[1]);
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return typeof data?.detail === "string" ? data.detail : fallback;
  } catch {
    return fallback;
  }
}

export default function LlmUsageAdminPage() {
  const router = useRouter();
  const { user, token, isLoading, isAdmin } = useAuth();
  const [stats, setStats] = useState<LlmUsageStats | null>(null);
  const [dailyCap, setDailyCap] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
    if (!isLoading && user && !isAdmin) router.replace("/dashboard");
  }, [isLoading, user, isAdmin, router]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/llm-usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(await readError(res, "Failed to load LLM usage"));
      }
      const data = (await res.json()) as LlmUsageStats;
      setStats(data);
      setDailyCap(String(data.daily_cap_usd));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load LLM usage");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && isAdmin) void fetchStats();
  }, [token, isAdmin, fetchStats]);

  async function updateBudget() {
    if (!token) return;
    const parsed = Number(dailyCap);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Daily budget must be a number greater than or equal to 0.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/llm-budget`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ daily_cap_usd: parsed }),
      });
      if (!res.ok) {
        throw new Error(await readError(res, "Failed to update budget"));
      }
      const data = await res.json();
      setNotice(typeof data.message === "string" ? data.message : "Budget updated.");
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update budget");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading admin access...</div>
      </div>
    );
  }

  const today = stats?.today;
  const providerRows = today ? objectEntries(today.calls_by_provider) : [];
  const modelRows = today ? objectEntries(today.calls_by_model) : [];

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8"
        >
          <div>
            <Badge variant="outline" className="mb-3 text-yellow-500 border-yellow-500/20 bg-yellow-500/10">
              Admin only
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-primary" />
              LLM Cost Monitoring
            </h1>
            <p className="text-muted-foreground mt-2">
              Track LLM calls, estimated token spend, budget usage, and blocked calls.
            </p>
          </div>
          <Button variant="outline" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {notice}
          </div>
        )}

        {loading && !stats ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-32 rounded-xl bg-card/40 border border-border/50 animate-pulse" />
            ))}
          </div>
        ) : today ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard
                icon={<DollarSign className="w-5 h-5" />}
                label="Estimated Cost Today"
                value={formatUsd(today.estimated_cost_usd)}
                detail={`${today.budget_used_pct}% of daily cap`}
              />
              <MetricCard
                icon={<Zap className="w-5 h-5" />}
                label="LLM Calls"
                value={formatNumber(today.total_calls)}
                detail={`${formatNumber(today.calls_blocked)} blocked`}
              />
              <MetricCard
                icon={<BarChart3 className="w-5 h-5" />}
                label="Total Tokens"
                value={formatNumber(today.total_tokens)}
                detail={`${formatNumber(today.total_tokens_in)} in / ${formatNumber(today.total_tokens_out)} out`}
              />
              <MetricCard
                icon={<ShieldAlert className="w-5 h-5" />}
                label="Budget Remaining"
                value={formatUsd(today.budget_remaining_usd)}
                detail={stats?.cap_enabled ? "Cap enabled" : "Cap disabled"}
              />
            </div>

            <Card className="bg-card/40 border-border/50">
              <CardHeader>
                <CardTitle>Daily Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Used {formatUsd(today.estimated_cost_usd)} of {formatUsd(stats.daily_cap_usd)}
                    </span>
                    <span className="font-semibold">{today.budget_used_pct}%</span>
                  </div>
                  <Progress value={Math.min(100, today.budget_used_pct)} className="h-2" />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyCap}
                    onChange={(event) => setDailyCap(event.target.value)}
                    placeholder="Daily cap in USD"
                    className="sm:max-w-xs"
                  />
                  <Button onClick={updateBudget} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Budget
                  </Button>
                  <p className="text-xs text-muted-foreground sm:self-center">
                    Set to 0 to disable budget enforcement.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <BreakdownCard title="Calls by Provider" rows={providerRows} emptyLabel="No provider usage yet" />
              <BreakdownCard title="Calls by Model" rows={modelRows} emptyLabel="No model usage yet" />
            </div>

            <Card className="bg-card/40 border-border/50">
              <CardHeader>
                <CardTitle>30-Day History</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No archived daily history yet. History appears after UTC day rollover.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.history.map((day) => (
                      <div key={day.date} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-4 py-3 text-sm">
                        <span className="font-medium">{day.date}</span>
                        <span className="text-muted-foreground">{formatNumber(day.total_calls)} calls</span>
                        <span className="font-semibold">{formatUsd(day.estimated_cost_usd)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="bg-card/40 border-border/50">
      <CardContent className="p-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          {icon}
        </div>
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{detail}</div>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: Array<[string, number]>;
  emptyLabel: string;
}) {
  const max = Math.max(...rows.map(([, value]) => value), 1);

  return (
    <Card className="bg-card/40 border-border/50">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="space-y-4">
            {rows.map(([name, count]) => (
              <div key={name}>
                <div className="flex items-center justify-between gap-3 text-sm mb-2">
                  <span className="font-medium truncate">{name}</span>
                  <span className="text-muted-foreground">{formatNumber(count)}</span>
                </div>
                <Progress value={(count / max) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
