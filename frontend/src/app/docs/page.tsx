"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Bot,
  Zap,
  Activity,
  AlertTriangle,
  MessageSquare,
  Play,
  Settings,
  FileText,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Layers,
  Target,
  Lightbulb,
  Coffee,
  Send,
  Brain,
  Shield,
  BarChart3,
  Hash,
  ChevronLeft,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Docs navigation structure
const NAV_SECTIONS = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [
      { id: "overview", label: "Overview" },
      { id: "quick-start", label: "Quick Start" },
      { id: "architecture", label: "Architecture" },
    ],
  },
  {
    title: "Core Concepts",
    icon: Layers,
    items: [
      { id: "agents", label: "AI Agents" },
      { id: "personas", label: "Persona Design" },
      { id: "crisis-injection", label: "Crisis Injection" },
    ],
  },
  {
    title: "Simulation",
    icon: Activity,
    items: [
      { id: "simulation-flow", label: "Simulation Flow" },
      { id: "god-mode", label: "God Mode" },
      { id: "metrics", label: "Metrics & Tracking" },
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    items: [
      { id: "reports", label: "Post-Sim Reports" },
      { id: "insights", label: "AI Insights" },
    ],
  },
  {
    title: "API Reference",
    icon: Hash,
    items: [
      { id: "api-endpoints", label: "Endpoints" },
      { id: "data-models", label: "Data Models" },
    ],
  },
];

function CodeBlock({
  code,
  language = "typescript",
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative rounded-xl overflow-hidden border border-border/60 bg-[oklch(0.13_0.01_255)] my-6">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-[oklch(0.15_0.01_255)]">
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] h-5 bg-primary/10 text-primary border-none"
          >
            {language}
          </Badge>
        </div>
      )}
      <div className="relative">
        <pre className="p-4 text-sm overflow-x-auto font-mono leading-relaxed text-[oklch(0.80_0.01_255)]">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-lg bg-background/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background/80 opacity-0 group-hover:opacity-100 transition-all"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function SectionHeading({
  id,
  children,
  icon: Icon,
}: {
  id: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <h2
      id={id}
      className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3 pt-16 pb-4 scroll-mt-24"
    >
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
      {children}
    </h2>
  );
}

function SubHeading({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      id={id}
      className="text-lg md:text-xl font-semibold tracking-tight pt-8 pb-3 scroll-mt-24 text-foreground/90"
    >
      {children}
    </h3>
  );
}

function InfoCallout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warning" | "tip";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: {
      bg: "bg-primary/5",
      border: "border-l-primary",
      icon: <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />,
    },
    warning: {
      bg: "bg-orange-500/5",
      border: "border-l-orange-500",
      icon: (
        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
      ),
    },
    tip: {
      bg: "bg-green-500/5",
      border: "border-l-green-500",
      icon: <Zap className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />,
    },
  };

  const s = styles[type];

  return (
    <div
      className={cn(
        "rounded-r-xl p-4 flex gap-3 text-sm my-6 border-l-4",
        s.bg,
        s.border
      )}
    >
      {s.icon}
      <div>
        <span className="font-semibold text-foreground">{title}</span>
        <div className="text-muted-foreground mt-1 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: step * 0.1 }}
      className="relative flex gap-4"
    >
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-bold text-sm shrink-0">
          {step}
        </div>
        {step < 4 && (
          <div className="w-px flex-1 bg-linear-to-b from-primary/40 to-transparent mt-2" />
        )}
      </div>
      <div className="pb-10">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-primary" />
          <h4 className="font-semibold">{title}</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    const headings = document.querySelectorAll("h2[id], h3[id]");
    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background antialiased">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full blur-[200px] bg-primary/5 pointer-events-none" />

      {/* Top Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 backdrop-blur-xl bg-background/70">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
                <Users className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                TeamDynamics
              </span>
            </Link>
            <div className="h-5 w-px bg-border hidden md:block" />
            <div className="hidden md:flex items-center gap-1">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-none font-medium text-xs"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Documentation
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">v1.0</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground font-medium"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Home
              </Button>
            </Link>
            <Link href="/setup">
              <Button
                size="sm"
                className="shadow-sm rounded-lg font-semibold px-5"
              >
                Launch App
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto flex pt-16">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto border-r border-border/30">
          <nav className="p-6 space-y-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-3">
                  <section.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {section.title}
                  </span>
                </div>
                <ul className="space-y-1 ml-6">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollTo(item.id)}
                        className={cn(
                          "block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all",
                          activeSection === item.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation Toggle */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-2xl shadow-primary/30"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <BookOpen className="w-5 h-5" />
          </Button>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute bottom-16 right-0 w-64 bg-card border border-border rounded-2xl shadow-2xl p-4 max-h-[60vh] overflow-y-auto"
            >
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {section.title}
                  </span>
                  <ul className="mt-1 space-y-0.5">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => scrollTo(item.id)}
                          className={cn(
                            "block w-full text-left px-3 py-1.5 rounded-lg text-sm",
                            activeSection === item.id
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-6 md:px-12 lg:px-16 py-12 pb-32">
          {/* Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-border/50 bg-linear-to-br from-primary/10 via-card/80 to-card/40 p-8 md:p-12 mb-12"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
            <div className="relative z-10">
              <Badge
                variant="secondary"
                className="bg-primary/20 text-primary border-none mb-4"
              >
                <Bot className="w-3 h-3 mr-1" />
                V1 Documentation
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">
                TeamDynamics{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
                  Docs
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed mb-6">
                Learn how to build, run, and analyze multi-agent AI simulations
                that predict team dynamics, breakdowns, and resilience under
                crisis conditions.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => scrollTo("quick-start")}
                  className="rounded-xl font-semibold"
                >
                  Quick Start
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => scrollTo("api-endpoints")}
                  className="rounded-xl font-semibold border-border/60"
                >
                  API Reference
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ==================== GETTING STARTED ==================== */}
          <SectionHeading id="overview" icon={BookOpen}>
            Overview
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground">TeamDynamics</strong> is a
            multi-agent AI simulation sandbox designed for founders, HR leaders,
            and organizational strategists. It lets you create a virtual team of
            AI-driven employees, inject real-world crises, and observe how your
            team would react—before it happens in real life.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Each agent has deep psychological profiles including traits like
            empathy, ambition, stress tolerance, and loyalty. When a crisis
            hits, agents react based on their personality, relationships, and
            current state—producing realistic Slack-like conversations alongside
            their hidden internal thoughts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
            {[
              {
                icon: Users,
                title: "AI Persona Agents",
                desc: "Design psychological profiles with deep personality traits.",
              },
              {
                icon: MessageSquare,
                title: "Live Drama Engine",
                desc: "Watch public vs. private conversations unfold in real-time.",
              },
              {
                icon: Activity,
                title: "Burnout Prediction",
                desc: "Identify breaking points before they happen in real life.",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="bg-card/40 border-border/50 hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Start */}
          <SectionHeading id="quick-start" icon={Play}>
            Quick Start
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Get your first simulation running in under 5 minutes. Follow these
            steps:
          </p>

          <StepCard
            step={1}
            icon={Settings}
            title="Configure Your Company"
            description="Navigate to the Setup page and define your company name, culture, and context. This sets the backdrop for how agents interpret events."
          />
          <StepCard
            step={2}
            icon={Users}
            title="Assemble Your Team"
            description="Choose from preset agent personas (Tech Lead, Junior Dev, PM, etc.) or create custom agents with unique personality traits and stress thresholds."
          />
          <StepCard
            step={3}
            icon={AlertTriangle}
            title="Inject a Crisis"
            description='Select a pre-built scenario like "Mandatory Weekend Coding" or "CEO Resigns Unexpectedly", or write your own custom crisis event.'
          />
          <StepCard
            step={4}
            icon={Play}
            title="Start & Observe"
            description="Hit 'Start Simulation' and watch your AI team react in a live Slack-like interface. Use God Mode to intervene in real-time."
          />

          <InfoCallout type="tip" title="Pro Tip">
            Start with the default preset team and a pre-built crisis to get
            familiar with the system, then customize from there.
          </InfoCallout>

          {/* Architecture */}
          <SectionHeading id="architecture" icon={Layers}>
            Architecture
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            TeamDynamics is built on a modern stack designed for real-time AI
            interactions:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Frontend
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>• Next.js 16 (App Router)</p>
                <p>• React 19 with Server Components</p>
                <p>• Tailwind CSS v4 + shadcn/ui</p>
                <p>• Framer Motion for animations</p>
                <p>• Recharts for data visualization</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Backend (AI Engine)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>• FastAPI (Python)</p>
                <p>• Multi-Agent LLM Orchestration</p>
                <p>• WebSocket for real-time streaming</p>
                <p>• Psychological State Machine</p>
                <p>• Structured JSON output parsing</p>
              </CardContent>
            </Card>
          </div>

          <CodeBlock
            title="System Architecture"
            language="text"
            code={`┌─────────────────────────────────────────────────────┐
│                 Next.js Frontend                     │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  Setup   │→ │ Simulation│→ │  Report/Analysis │  │
│  │  Page    │  │  Page     │  │      Page        │  │
│  └──────────┘  └─────┬─────┘  └──────────────────┘  │
│                      │ WebSocket                     │
└──────────────────────┼───────────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────────┐
│              FastAPI Backend                          │
│  ┌───────────────────┴────────────────────────────┐  │
│  │          Simulation Engine (Orchestrator)       │  │
│  ├────────────┬────────────┬─────────────────────┤  │
│  │  Agent 1   │  Agent 2   │  Agent N            │  │
│  │  (LLM)     │  (LLM)     │  (LLM)              │  │
│  ├────────────┴────────────┴─────────────────────┤  │
│  │       Psychological State Machine              │  │
│  │   (Morale, Stress, Loyalty, Productivity)      │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘`}
          />

          {/* ==================== CORE CONCEPTS ==================== */}
          <Separator className="my-12 opacity-30" />

          <SectionHeading id="agents" icon={Bot}>
            AI Agents
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Each agent in TeamDynamics is a fully autonomous AI entity powered
            by a large language model. Agents have persistent memory, emotional
            states, and evolving relationships with other team members.
          </p>

          <SubHeading>Agent Properties</SubHeading>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border border-border/50 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-card/60 border-b border-border/50">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Property
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  ["name", "string", "Agent display name"],
                  ["role", "string", 'Job title (e.g., "Tech Lead", "Junior Dev")'],
                  ["personality", "PersonalityTraits", "Deep psychological profile object"],
                  ["morale", "number (0-100)", "Current emotional well-being"],
                  ["stress", "number (0-100)", "Current stress/burnout level"],
                  ["loyalty", "number (0-100)", "Commitment to the company"],
                  ["productivity", "number (0-100)", "Current output efficiency"],
                ].map(([prop, type, desc], i) => (
                  <tr
                    key={i}
                    className="hover:bg-card/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-primary text-xs">
                      {prop}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                      {type}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CodeBlock
            title="Agent Definition Example"
            language="typescript"
            code={`interface Agent {
  id: string;
  name: string;
  role: string;
  personality: {
    empathy: number;       // 0-100
    ambition: number;      // 0-100
    stressTolerance: number; // 0-100
    agreeableness: number; // 0-100
    assertiveness: number; // 0-100
  };
  state: {
    morale: number;
    stress: number;
    loyalty: number;
    productivity: number;
  };
  type: string; // e.g. "Strict & Burned Out"
}`}
          />

          {/* Persona Design */}
          <SectionHeading id="personas" icon={Brain}>
            Persona Design
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Personas define how agents think, communicate, and react to stress.
            TeamDynamics ships with curated presets, but you can design fully
            custom personas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            {[
              {
                name: "Alex",
                role: "Tech Lead",
                type: "Strict & Burned Out",
                color: "bg-red-500/20 text-red-400 border-red-500/20",
                traits: "Low patience, high competence, on the edge of quitting",
              },
              {
                name: "Sam",
                role: "Junior Dev",
                type: "Ambitious & Naive",
                color: "bg-green-500/20 text-green-400 border-green-500/20",
                traits: "High ambition, low experience, people-pleaser tendencies",
              },
              {
                name: "Jordan",
                role: "Product Manager",
                type: "Empathetic",
                color: "bg-blue-500/20 text-blue-400 border-blue-500/20",
                traits: "High emotional intelligence, strong mediator, risk-averse",
              },
              {
                name: "Casey",
                role: "Senior Dev",
                type: "Silent & Efficient",
                color: "bg-purple-500/20 text-purple-400 border-purple-500/20",
                traits: "Introverted, highly productive, avoids conflict until critical",
              },
            ].map((persona, i) => (
              <Card
                key={i}
                className="bg-card/40 border-border/50 hover:border-primary/20 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {persona.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{persona.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {persona.role}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs mb-3", persona.color)}
                  >
                    {persona.type}
                  </Badge>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {persona.traits}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Crisis Injection */}
          <SectionHeading id="crisis-injection" icon={AlertTriangle}>
            Crisis Injection
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Crisis events are the catalysts that trigger agent reactions. They
            simulate real-world disruptions that test team resilience.
          </p>

          <SubHeading>Built-in Crisis Scenarios</SubHeading>
          <div className="space-y-3 my-4">
            {[
              {
                name: "Mandatory Weekend Coding for v2.0",
                severity: "High",
                desc: "Forces entire engineering team to work weekends indefinitely.",
              },
              {
                name: "Budget Cut: 30% Layoffs Required",
                severity: "Critical",
                desc: "Management demands immediate headcount reduction.",
              },
              {
                name: "CEO Resigns Unexpectedly",
                severity: "Critical",
                desc: "Leadership vacuum creates uncertainty and power struggles.",
              },
              {
                name: "Critical Database Deleted on Friday",
                severity: "High",
                desc: "Production incident requiring emergency all-hands response.",
              },
            ].map((crisis, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-card/40 border border-border/50"
              >
                <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{crisis.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {crisis.desc}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] shrink-0",
                    crisis.severity === "Critical"
                      ? "text-red-400 border-red-500/20"
                      : "text-orange-400 border-orange-500/20"
                  )}
                >
                  {crisis.severity}
                </Badge>
              </div>
            ))}
          </div>

          <InfoCallout type="info" title="Custom Crises">
            You can write free-form crisis descriptions that the AI engine will
            interpret contextually. Example: "The team discovers that the CTO has
            been secretly interviewing at a competitor."
          </InfoCallout>

          {/* ==================== SIMULATION ==================== */}
          <Separator className="my-12 opacity-30" />

          <SectionHeading id="simulation-flow" icon={Activity}>
            Simulation Flow
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Once configured, the simulation runs in discrete rounds (each
            representing a virtual week). During each round, agents process the
            current situation, update their internal states, and produce both
            public messages and private thoughts.
          </p>

          <SubHeading>Round Lifecycle</SubHeading>
          <CodeBlock
            title="Simulation Round Flow"
            language="text"
            code={`Round Start
  │
  ├─→ Crisis/Event is announced to all agents
  │
  ├─→ Each agent processes:
  │   ├── Reviews their personality traits
  │   ├── Evaluates current morale/stress/loyalty
  │   ├── Considers relationships with others
  │   └── Generates response
  │
  ├─→ Agent outputs:
  │   ├── Public Message (visible in Slack chat)
  │   ├── Internal Thought (hidden insight)
  │   └── State Changes (morale ±, stress ±, etc.)
  │
  ├─→ God Mode check: Player can intervene
  │
  └─→ Round End → Metrics updated → Next Round`}
          />

          <SubHeading>Message Types</SubHeading>
          <Tabs defaultValue="public" className="my-6">
            <TabsList className="bg-card/60 border border-border/50">
              <TabsTrigger value="public">Public Message</TabsTrigger>
              <TabsTrigger value="thought">Internal Thought</TabsTrigger>
              <TabsTrigger value="system">System Event</TabsTrigger>
            </TabsList>
            <TabsContent value="public">
              <Card className="bg-card/40 border-border/50 mt-4">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-3">
                    Public messages are what agents say in the team Slack channel.
                    These are filtered through their personality—an agent with
                    high agreeableness might sugarcoat their frustration.
                  </p>
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50 border-l-4 border-l-primary/30 text-sm">
                    <span className="font-semibold">Alex (Tech Lead):</span>{" "}
                    <span className="text-muted-foreground">
                      "Are you serious right now? We've been working 60-hour
                      weeks for a month."
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="thought">
              <Card className="bg-card/40 border-border/50 mt-4">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-3">
                    Internal thoughts reveal what the agent is truly thinking but
                    not saying. This is the key insight for understanding team
                    dynamics.
                  </p>
                  <div className="bg-secondary/50 rounded-lg p-4 border border-border/50 text-sm italic">
                    <span className="font-semibold text-primary/70 not-italic">
                      Internal Thought:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      "I can't believe management approved this. If I push my
                      team harder, they're going to break. I should start
                      updating my resume."
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="system">
              <Card className="bg-card/40 border-border/50 mt-4">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-3">
                    System events are crisis announcements or significant events
                    that affect all agents simultaneously.
                  </p>
                  <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20 text-sm flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                    <span className="text-muted-foreground">
                      🚨 ANNOUNCEMENT: Due to the tight v2.0 deadline, weekend
                      coding is now mandatory for all engineering staff.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* God Mode */}
          <SectionHeading id="god-mode" icon={Zap}>
            God Mode
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            During any active simulation, you have access to{" "}
            <strong className="text-foreground">God Mode</strong>—a powerful
            intervention system that lets you alter the course of the simulation
            in real-time.
          </p>

          <SubHeading>Quick Actions</SubHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            {[
              {
                icon: Zap,
                name: "Give Bonus",
                desc: "Award a surprise bonus to boost morale across the team.",
                color: "text-yellow-500",
              },
              {
                icon: Coffee,
                name: "Pizza Party",
                desc: "Lighten the mood with a team-building event.",
                color: "text-orange-400",
              },
              {
                icon: Shield,
                name: "Cancel Overtime",
                desc: "Revoke the mandatory extra hours policy.",
                color: "text-blue-400",
              },
              {
                icon: Send,
                name: "Custom Message",
                desc: "Type any intervention as a management announcement.",
                color: "text-primary",
              },
            ].map((action, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-card/40 border border-border/50"
              >
                <div className="w-9 h-9 rounded-full border border-border/50 flex items-center justify-center shrink-0">
                  <action.icon className={cn("w-4 h-4", action.color)} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{action.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <InfoCallout type="warning" title="Use Responsibly">
            God Mode interventions affect agent states immediately. Excessive
            positive interventions may produce unrealistic results, while
            negative ones can cause cascading failures.
          </InfoCallout>

          {/* Metrics */}
          <SectionHeading id="metrics" icon={BarChart3}>
            Metrics & Tracking
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            During a simulation, the dashboard tracks key organizational health
            metrics in real-time:
          </p>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border border-border/50 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-card/60 border-b border-border/50">
                  <th className="text-left px-4 py-3 font-semibold">Metric</th>
                  <th className="text-left px-4 py-3 font-semibold">Range</th>
                  <th className="text-left px-4 py-3 font-semibold">
                    Critical Threshold
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  ["Morale", "0-100%", "< 30%", "Agent may resign or become uncooperative"],
                  ["Stress", "0-100%", "> 80%", "Output quality drops, errors increase"],
                  ["Loyalty", "0-100%", "< 20%", "Agent begins job-hunting behavior"],
                  ["Productivity", "0-100%", "< 40%", "Deadlines will be missed"],
                ].map(([metric, range, threshold, impact], i) => (
                  <tr key={i} className="hover:bg-card/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{metric}</td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                      {range}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant="outline"
                        className="text-red-400 border-red-500/20 text-[10px]"
                      >
                        {threshold}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                      {impact}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ==================== REPORTS ==================== */}
          <Separator className="my-12 opacity-30" />

          <SectionHeading id="reports" icon={FileText}>
            Post-Simulation Reports
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            After a simulation completes, TeamDynamics generates a comprehensive
            report including:
          </p>

          <ul className="space-y-3 my-6 text-sm text-muted-foreground">
            {[
              "Executive Summary with key findings and critical alerts",
              "Agent Resiliency Profiles showing start vs. end states",
              "Productivity impact analysis with trend visualization",
              "Recommended management actions (AI-generated insights)",
              "Full conversation transcript with internal thoughts",
              "Exportable to PDF for stakeholder sharing",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* Insights */}
          <SectionHeading id="insights" icon={Lightbulb}>
            AI Insights
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The AI engine analyzes simulation data to produce actionable
            recommendations. These insights help leaders understand what went
            wrong and how to prevent similar outcomes.
          </p>

          <Card className="bg-card/40 border-border/50 my-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Example Insight Output
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <div className="bg-destructive/10 border-l-4 border-destructive rounded-r-lg p-3">
                <strong className="text-foreground">Critical Finding:</strong>{" "}
                The Junior Dev (Sam) reached critical burnout in Week 4, causing
                productivity to permanently flatline.
              </div>
              <div className="space-y-2 mt-4">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                  Recommended Actions:
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Provide compensation (bonus/time-off) immediately after
                    deadline pressure.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Protect Tech Leads from middle-management sandwiching.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Establish a "no-crunch" policy for junior employees during
                    their first 6 months.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* ==================== API REFERENCE ==================== */}
          <Separator className="my-12 opacity-30" />

          <SectionHeading id="api-endpoints" icon={Hash}>
            API Endpoints
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The TeamDynamics backend exposes a RESTful API for programmatic
            access. All endpoints return JSON.
          </p>

          <div className="space-y-4 my-6">
            {[
              {
                method: "POST",
                path: "/api/simulation/create",
                desc: "Create a new simulation with company profile, agents, and crisis config.",
                methodColor: "bg-green-500/20 text-green-400",
              },
              {
                method: "POST",
                path: "/api/simulation/{id}/start",
                desc: "Start the simulation engine. Returns a WebSocket URL for streaming.",
                methodColor: "bg-green-500/20 text-green-400",
              },
              {
                method: "GET",
                path: "/api/simulation/{id}/status",
                desc: "Get current simulation status, round number, and agent states.",
                methodColor: "bg-blue-500/20 text-blue-400",
              },
              {
                method: "POST",
                path: "/api/simulation/{id}/intervene",
                desc: "Send a God Mode intervention to the active simulation.",
                methodColor: "bg-green-500/20 text-green-400",
              },
              {
                method: "GET",
                path: "/api/simulation/{id}/report",
                desc: "Retrieve the post-simulation report with all metrics and insights.",
                methodColor: "bg-blue-500/20 text-blue-400",
              },
              {
                method: "GET",
                path: "/api/agents/presets",
                desc: "List all available preset agent personas.",
                methodColor: "bg-blue-500/20 text-blue-400",
              },
            ].map((endpoint, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-card/40 border border-border/50 hover:border-primary/20 transition-colors"
              >
                <Badge
                  className={cn(
                    "font-mono text-[10px] font-bold border-none shrink-0 mt-0.5",
                    endpoint.methodColor
                  )}
                >
                  {endpoint.method}
                </Badge>
                <div>
                  <code className="text-sm font-mono text-foreground">
                    {endpoint.path}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    {endpoint.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <CodeBlock
            title="Example: Create Simulation"
            language="json"
            code={`POST /api/simulation/create

{
  "company": {
    "name": "Pied Piper",
    "culture": "Fast-paced tech startup running low on funding."
  },
  "agents": [
    {
      "name": "Alex",
      "role": "Tech Lead",
      "type": "Strict & Burned Out",
      "personality": {
        "empathy": 30,
        "ambition": 80,
        "stressTolerance": 25,
        "agreeableness": 20,
        "assertiveness": 90
      }
    }
  ],
  "crisis": {
    "scenario": "mandatory_weekend",
    "custom_description": null
  },
  "params": {
    "duration_weeks": 12,
    "pacing": "normal"
  }
}`}
          />

          {/* Data Models */}
          <SectionHeading id="data-models" icon={Layers}>
            Data Models
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Core data structures used across the TeamDynamics system:
          </p>

          <CodeBlock
            title="Simulation Response Model"
            language="typescript"
            code={`interface SimulationResponse {
  id: string;
  status: "idle" | "running" | "paused" | "completed";
  currentRound: number;
  totalRounds: number;
  company: CompanyProfile;
  agents: AgentState[];
  messages: Message[];
  metrics: {
    avgMorale: number;
    avgStress: number;
    productivity: number;
    resignations: number;
  };
}

interface Message {
  id: number;
  round: number;
  agentId: string;
  type: "public" | "thought" | "system";
  content: string;
  stateChanges?: {
    morale?: number;
    stress?: number;
    loyalty?: number;
    productivity?: number;
  };
  timestamp: string;
}

interface CompanyProfile {
  name: string;
  culture: string;
  crisisScenario: string;
  crisisDescription?: string;
}`}
          />

          <InfoCallout type="info" title="WebSocket Streaming">
            For real-time message streaming during simulations, connect to{" "}
            <code className="bg-background/50 px-2 py-0.5 rounded text-xs">
              ws://localhost:8000/ws/simulation/{"{id}"}
            </code>
            . Messages are sent as JSON frames matching the Message interface
            above.
          </InfoCallout>

          {/* Footer CTA */}
          <div className="mt-20 rounded-3xl border border-border/50 bg-linear-to-br from-primary/5 via-card/60 to-card/40 p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Ready to simulate?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Configure your team, inject a crisis, and discover the breaking
              point of your organization.
            </p>
            <Link href="/setup">
              <Button
                size="lg"
                className="h-14 px-10 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20"
              >
                Launch Simulation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
