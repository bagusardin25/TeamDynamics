"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Database,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

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
    accent: "border-red-500/30 bg-red-500/10 text-red-400",
  },
  {
    name: "Sam",
    role: "Junior Developer",
    trait: "Ambitious, eager to help, still inexperienced",
    accent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  {
    name: "Jordan",
    role: "Product Manager",
    trait: "Empathetic, pragmatic, focused on alignment",
    accent: "border-blue-500/30 bg-blue-500/10 text-blue-400",
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-size-[48px_48px] bg-[linear-gradient(to_right,#80808018_1px,transparent_1px),linear-gradient(to_bottom,#80808018_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-violet-500/15 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-16rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-orange-500/10 blur-[120px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          TeamDynamics
        </Link>
        <Badge
          variant="outline"
          className="border-violet-500/30 bg-violet-500/10 text-violet-400"
        >
          <Sparkles className="size-3" />
          OpenAI Build Week
        </Badge>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-8 md:pb-24 md:pt-16">
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <Badge
              variant="outline"
              className="mb-6 border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Scripted Mock Simulation
            </Badge>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl">
              See a team respond to a{" "}
              <span className="bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">
                production crisis.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Northstar Labs, three synthetic teammates, eighteen messages,
              and no setup. Watch their decisions, stress, morale, and alliances
              change as the incident unfolds.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5">
                <ShieldCheck className="size-4 text-emerald-400" />
                No login required
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5">
                <Zap className="size-4 text-orange-400" />
                Fixed three-round scenario
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5">
                <Users className="size-4 text-violet-400" />
                18 agent messages
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                className="h-12 px-6 text-base font-semibold shadow-lg shadow-violet-500/20"
                onClick={handleStartDemo}
                disabled={isStarting}
              >
                {isStarting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Zap className="size-4" />
                )}
                {isStarting ? "Starting demo..." : "Run Quick Demo"}
                {isStarting ? null : <ArrowRight className="size-4" />}
              </Button>
              <Link href="/setup">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-12 w-full px-6 text-base sm:w-auto"
                >
                  Configure My Own Simulation
                </Button>
              </Link>
            </div>

            <div className="mt-4 min-h-6" aria-live="polite">
              {error ? (
                <p
                  role="alert"
                  className="text-sm font-medium text-red-400"
                >
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <Card className="relative border border-border/70 bg-card/70 py-0 shadow-2xl backdrop-blur-xl">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/80 to-transparent" />
            <CardHeader className="border-b border-border/60 px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardDescription className="mb-1 uppercase tracking-[0.18em]">
                    Scenario preview
                  </CardDescription>
                  <CardTitle className="text-xl">Northstar Labs</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="border-orange-500/30 bg-orange-500/10 text-orange-400"
                >
                  3 rounds
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-6 py-6">
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-400">
                  <Database className="size-4" />
                  Critical database incident
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Production data has been wiped on Friday evening. Customer
                  impact is unknown, backups need verification, and leadership
                  wants answers now.
                </p>
              </div>

              <div className="space-y-3">
                {DEMO_AGENTS.map((agent) => (
                  <div
                    key={agent.name}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3"
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
                    <span className="font-mono text-[10px] uppercase tracking-wider text-violet-400">
                      Mock data
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
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 font-mono text-[10px] text-violet-400">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        <p className="mx-auto mt-14 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
          This is a synthetic decision-rehearsal scenario. It does not diagnose
          employees or scientifically predict burnout. Its dialogue is
          deterministic mock data and makes no external LLM request.
        </p>
      </main>
    </div>
  );
}
