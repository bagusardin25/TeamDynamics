"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  Loader2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { LandingNav } from "@/components/landing/landing-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createDemoSimulation } from "@/lib/demo-api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEMO_AGENTS = [
  {
    name: "Alex",
    role: "Tech Lead",
    trait: "Direct, exacting, already near burnout",
    accent: "border-red-500/30 bg-red-500/10 text-red-400 dark:text-red-400",
  },
  {
    name: "Sam",
    role: "Junior Developer",
    trait: "Ambitious, eager to help, still inexperienced",
    accent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "Jordan",
    role: "Product Manager",
    trait: "Empathetic, pragmatic, focused on alignment",
    accent: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
] as const;

const DEMO_STEPS = [
  "18 scripted messages run through the real simulation engine",
  "Two discussion exchanges unfold in each of three rounds",
  "A mock report summarizes the calculated outcome",
] as const;

export default function DemoPage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartDemo() {
    if (isStarting) {
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const simulation = await createDemoSimulation(API_BASE);
      router.push(`/simulation?id=${simulation.id}&demo=1`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Quick Demo is temporarily unavailable",
      );
      setIsStarting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* ── Background Grid & Ambient Glows ── */}
      <div className="pointer-events-none fixed inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,#80808018_1px,transparent_1px),linear-gradient(to_bottom,#80808018_1px,transparent_1px)] opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-[-14rem] h-[36rem] w-[56rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-violet-500/20 to-primary/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-14rem] right-[-8rem] h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-[130px]" />

      {/* ── Global Header Navigation ── */}
      <LandingNav />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-28 sm:px-6 sm:pt-32 pb-16 md:pb-24">
        {/* ── Mode Selector Banner ── */}
        <div className="mx-auto mb-10 flex max-w-md items-center justify-center gap-1.5 rounded-full border border-border/60 bg-card/60 p-1.5 shadow-sm backdrop-blur-md">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition-colors"
          >
            <Zap className="size-3.5" />
            Quick Demo (Preset)
          </button>
          <Link
            href="/setup"
            className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <SlidersHorizontal className="size-3.5" />
            Custom Setup
          </Link>
        </div>

        {/* ── Hero & Preview Grid ── */}
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <span className="relative mr-1.5 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                Scripted Mock Simulation
              </Badge>
              <Badge
                variant="outline"
                className="border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400"
              >
                <Sparkles className="mr-1 size-3" />
                OpenAI Build Week
              </Badge>
            </div>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl">
              See a team respond to a{" "}
              <span className="bg-gradient-to-r from-violet-500 via-primary to-orange-400 bg-clip-text text-transparent">
                production crisis.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Northstar Labs, three synthetic teammates, eighteen messages,
              and zero setup required. Watch how decisions, stress, morale, and team alliances shift in real time as the incident unfolds.
            </p>

            {/* Feature Pills */}
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 shadow-xs backdrop-blur-md">
                <ShieldCheck className="size-4 text-emerald-500" />
                No login required
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 shadow-xs backdrop-blur-md">
                <Zap className="size-4 text-orange-500" />
                Fixed three-round scenario
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 shadow-xs backdrop-blur-md">
                <Users className="size-4 text-violet-500" />
                18 agent messages
              </span>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <Button
                type="button"
                size="lg"
                className="h-12 px-7 text-base font-semibold shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
                onClick={handleStartDemo}
                disabled={isStarting}
              >
                {isStarting ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Zap className="size-4 mr-2" />
                )}
                {isStarting ? "Starting Demo..." : "Run Quick Demo"}
                {isStarting ? null : <ArrowRight className="size-4 ml-2" />}
              </Button>
              <Link href="/setup" className="w-full sm:w-auto">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-12 w-full border-border/80 px-6 text-base font-medium shadow-xs transition-colors hover:bg-accent/50 sm:w-auto"
                >
                  <SlidersHorizontal className="size-4 mr-2 text-primary" />
                  Configure Custom Scenario
                </Button>
              </Link>
            </div>

            {/* Error Message Container */}
            <div className="mt-4 min-h-6" aria-live="polite">
              {error ? (
                <p
                  role="alert"
                  className="text-sm font-medium text-destructive"
                >
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          {/* ── Scenario Card Preview ── */}
          <Card className="relative overflow-hidden border border-border/70 bg-card/70 py-0 shadow-2xl backdrop-blur-xl">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/80 to-transparent" />
            <CardHeader className="border-b border-border/60 px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardDescription className="mb-1 uppercase tracking-[0.18em] font-semibold text-primary/80">
                    Scenario Preview
                  </CardDescription>
                  <CardTitle className="text-xl font-bold">Northstar Labs</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="border-orange-500/30 bg-orange-500/10 text-orange-500 font-semibold"
                >
                  3 Rounds
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-6 py-6">
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-500">
                  <Database className="size-4" />
                  Critical Database Incident
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Production data has been wiped on Friday evening. Customer
                  impact is unknown, backups need verification, and leadership
                  demands immediate answers.
                </p>
              </div>

              <div className="space-y-3">
                {DEMO_AGENTS.map((agent) => (
                  <div
                    key={agent.name}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition-colors hover:bg-background/80"
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${agent.accent}`}
                    >
                      <Bot className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="font-semibold text-foreground">
                          {agent.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {agent.role}
                        </p>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {agent.trait}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-violet-500 font-medium">
                      Mock Agent
                    </span>
                  </div>
                ))}
              </div>

              <ol className="grid gap-3 border-t border-border/60 pt-5">
                {DEMO_STEPS.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 font-mono text-[11px] font-bold text-violet-500">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        <p className="mx-auto mt-16 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
          This is a synthetic decision-rehearsal scenario. Dialogue uses deterministic mock data
          to showcase how TeamDynamics tracks risk metrics without consuming live LLM credits.
        </p>
      </main>

      {/* ── Footer Section ── */}
      <footer className="relative z-10 border-t border-border/50 bg-card/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="font-bold text-foreground hover:text-primary transition-colors">
              TeamDynamics
            </Link>
            <span>•</span>
            <span>AI Team Scenario Simulator</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/setup" className="hover:text-foreground transition-colors">
              Custom Setup
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

