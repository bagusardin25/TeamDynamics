"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Users, Plus, Clock, Play, CheckCircle, AlertTriangle,
  LogOut, Crown, CreditCard, Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SimulationRecord {
  id: string;
  status: string;
  current_round: number;
  total_rounds: number;
  company_name: string;
  crisis_scenario: string;
  pacing: string;
  created_at: string;
}

const CRISIS_LABELS: Record<string, string> = {
  rnd1: "Mandatory Weekend Coding",
  rnd2: "Layoffs Announced",
  rnd3: "CEO Resigns",
  rnd4: "Database Deleted",
  custom: "Custom Crisis",
};

const SPARKLINE_DATA = [
  { value: 10 }, { value: 25 }, { value: 15 }, { value: 40 }, { value: 30 }, { value: 60 }
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, isAdmin, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [simulations, setSimulations] = useState<SimulationRecord[]>([]);
  const [loadingSims, setLoadingSims] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Fetch simulations
  useEffect(() => {
    if (!token) return;
    async function fetchSimulations() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me/simulations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSimulations(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingSims(false);
      }
    }
    fetchSimulations();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    idle: { icon: <Clock className="w-3.5 h-3.5" />, color: "text-blue-400 border-blue-500/20 bg-blue-500/10", label: "Idle" },
    running: { icon: <Play className="w-3.5 h-3.5" />, color: "text-orange-400 border-orange-500/20 bg-orange-500/10", label: "Running" },
    completed: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-green-400 border-green-500/20 bg-green-500/10", label: "Completed" },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-md bg-background/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden bg-[#18181b] shadow-lg shadow-violet-500/20 border border-violet-500/30 group-hover:scale-105 transition-transform">
              <Image src="/logo.svg" alt="TeamDynamics Logo" width={24} height={24} className="object-cover scale-[1.15]" priority />
            </div>
            <span className="font-bold text-lg tracking-tight">TeamDynamics</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Credits */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/40">
              <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold">
                {isAdmin ? (
                  <span className="text-primary">Unlimited</span>
                ) : (
                  <>{user.credits} credits</>
                )}
              </span>
            </div>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}</span>
            </Button>

            {/* User */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-border/40">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {user.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold leading-none flex items-center gap-1.5">
                  {user.name}
                  {isAdmin && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{user.email}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-400"
                onClick={() => { logout(); router.push("/"); }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground">
            Manage your simulations and explore team dynamics.
          </p>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          <Card className="relative bg-card/40 border-border/50 overflow-hidden group">
            <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-20 pointer-events-none transition-transform group-hover:scale-y-110 origin-bottom duration-500">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SPARKLINE_DATA}>
                  <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="currentColor" className="text-primary" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="text-xs text-muted-foreground font-medium mb-1">Total Simulations</div>
              <div className="text-2xl font-bold">{simulations.length}</div>
            </CardContent>
          </Card>
          <Card className="relative bg-card/40 border-border/50 overflow-hidden group">
             <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-20 pointer-events-none transition-transform group-hover:scale-y-110 origin-bottom duration-500">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...SPARKLINE_DATA].reverse()}>
                  <Area type="monotone" dataKey="value" stroke="#22c55e" fill="#22c55e" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="text-xs text-muted-foreground font-medium mb-1">Completed</div>
              <div className="text-2xl font-bold text-green-500">
                {simulations.filter((s) => s.status === "completed").length}
              </div>
            </CardContent>
          </Card>
          <Card className="relative bg-card/40 border-border/50 overflow-hidden group">
            <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-20 pointer-events-none transition-transform group-hover:scale-y-110 origin-bottom duration-500">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SPARKLINE_DATA.map(d=>( {value: d.value * (0.5 + Math.random()*0.5)} ))}>
                  <Area type="monotone" dataKey="value" stroke="#f97316" fill="#f97316" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="text-xs text-muted-foreground font-medium mb-1">Running</div>
              <div className="text-2xl font-bold text-orange-500">
                {simulations.filter((s) => s.status === "running").length}
              </div>
            </CardContent>
          </Card>
          <Card className="relative bg-card/40 border-border/50 overflow-hidden">
            <CardContent className="p-4 relative z-10">
              <div className="text-xs text-muted-foreground font-medium mb-1">Credits Left</div>
              <div className="text-2xl font-bold text-primary">
                {isAdmin ? "∞" : user.credits}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* New simulation + History */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Simulation History</h2>
          <Link href="/setup">
            <Button className="rounded-lg font-semibold shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> New Simulation
            </Button>
          </Link>
        </div>

        {loadingSims ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-card/40 border border-border/50 animate-pulse" />
            ))}
          </div>
        ) : simulations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 relative overflow-hidden rounded-2xl border border-dashed border-border/60 bg-card/10 backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]"
            >
              <Play className="w-8 h-8 text-primary ml-1" />
            </motion.div>
            <h3 className="text-xl font-bold mb-3 tracking-tight">Your Simulation Sandbox awaits</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
              Assemble your team and inject unexpected chaos. Watch how agents interact and make decisions under pressure.
            </p>
            <Link href="/setup">
              <Button className="rounded-full px-8 h-12 font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                <Plus className="w-4 h-4 mr-2" /> Create First Simulation
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {simulations.map((sim, idx) => {
              const cfg = statusConfig[sim.status] || statusConfig.idle;
              return (
                <motion.div
                  key={sim.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href={sim.status === "completed" ? `/simulation?id=${sim.id}` : `/simulation?id=${sim.id}`}>
                    <Card className="bg-card/40 border-border/50 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Status icon */}
                          <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${cfg.color} transition-transform group-hover:scale-110`}>
                            {cfg.icon}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                              {sim.company_name}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                              <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                                {CRISIS_LABELS[sim.crisis_scenario] || sim.crisis_scenario}
                              </span>
                              <div className="flex items-center gap-1.5 flex-1 max-w-[150px]">
                                <Progress value={(sim.current_round / sim.total_rounds) * 100} className="h-1.5" />
                                <span className="text-[10px] text-muted-foreground font-mono">{Math.round((sim.current_round / sim.total_rounds) * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {/* Date */}
                          <div className="text-[10px] text-muted-foreground hidden md:block text-right">
                            {sim.created_at ? new Date(sim.created_at).toLocaleDateString() : ""}
                          </div>

                          {/* Action Button & Badge */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] font-semibold transition-opacity group-hover:opacity-0 sm:group-hover:flex ${cfg.color}`}>
                              {cfg.label}
                            </Badge>
                            <Button size="sm" variant="secondary" className="hidden group-hover:flex h-7 text-xs rounded-full shadow-sm mx-2 absolute right-0 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                              {sim.status === "completed" ? "View Report" : "Resume"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
