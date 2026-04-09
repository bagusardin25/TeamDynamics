"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users, Plus, Clock, Play, CheckCircle, AlertTriangle,
  LogOut, Crown, CreditCard, Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, isAdmin, logout } = useAuth();
  const { theme, setTheme } = useTheme();
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
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
              <Users className="w-5 h-5 text-primary-foreground" />
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
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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
          <Card className="bg-card/40 border-border/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground font-medium mb-1">Total Simulations</div>
              <div className="text-2xl font-bold">{simulations.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/40 border-border/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground font-medium mb-1">Completed</div>
              <div className="text-2xl font-bold text-green-500">
                {simulations.filter((s) => s.status === "completed").length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/40 border-border/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground font-medium mb-1">Running</div>
              <div className="text-2xl font-bold text-orange-500">
                {simulations.filter((s) => s.status === "running").length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/40 border-border/50">
            <CardContent className="p-4">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No simulations yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first simulation to see how your team reacts under pressure.
            </p>
            <Link href="/setup">
              <Button className="rounded-lg font-semibold">
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
                    <Card className="bg-card/40 border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-5 flex items-center gap-4">
                        {/* Status icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.color}`}>
                          {cfg.icon}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                            {sim.company_name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {CRISIS_LABELS[sim.crisis_scenario] || sim.crisis_scenario} •
                            Week {sim.current_round}/{sim.total_rounds}
                          </div>
                        </div>

                        {/* Status badge */}
                        <Badge variant="outline" className={`text-[10px] font-semibold ${cfg.color}`}>
                          {cfg.label}
                        </Badge>

                        {/* Date */}
                        <span className="text-[10px] text-muted-foreground hidden sm:block">
                          {sim.created_at ? new Date(sim.created_at).toLocaleDateString() : ""}
                        </span>
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
