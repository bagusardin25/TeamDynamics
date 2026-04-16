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
  Lock,
  Globe,
  Cpu,
  Database,
  Dice5,
  Eye,
  FileUp,
  Swords,
  Crown,
  Timer,
  TrendingUp,
  Workflow,
  KeyRound,
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
    title: "Authentication",
    icon: Lock,
    items: [
      { id: "auth-system", label: "Auth System" },
      { id: "credits", label: "Credits & Roles" },
    ],
  },
  {
    title: "Core Concepts",
    icon: Layers,
    items: [
      { id: "agents", label: "AI Agents" },
      { id: "personas", label: "Persona Design" },
      { id: "crisis-injection", label: "Crisis Injection" },
      { id: "document-analysis", label: "Document Analysis" },
    ],
  },
  {
    title: "Simulation Engine",
    icon: Activity,
    items: [
      { id: "simulation-flow", label: "Simulation Flow" },
      { id: "simulation-phases", label: "Phases & Agenda" },
      { id: "world-state", label: "World State" },
      { id: "decision-engine", label: "Decision Engine" },
      { id: "hidden-agendas", label: "Hidden Agendas" },
      { id: "random-events", label: "Random Events" },
      { id: "god-mode", label: "God Mode" },
      { id: "outcomes", label: "Outcomes" },
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
        {step < 5 && (
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
                crisis conditions — complete with world state constraints,
                hidden agendas, power hierarchies, and dramatic outcomes.
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
            hits, agents react based on their personality, relationships, hidden
            agendas, and current state—producing realistic Slack-like
            conversations alongside their hidden internal thoughts. A dynamic
            World State engine tracks budget, deadlines, and reputation, while
            a Decision Engine manages team proposals with hierarchy-weighted
            voting.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
            {[
              {
                icon: Users,
                title: "AI Persona Agents",
                desc: "Design psychological profiles with deep personality traits, hidden agendas, and persistent memory.",
              },
              {
                icon: MessageSquare,
                title: "Live Drama Engine",
                desc: "Watch public vs. private conversations unfold in real-time with typing indicators.",
              },
              {
                icon: Globe,
                title: "World State System",
                desc: "Track budget, deadlines, team capacity, technical debt, and company reputation.",
              },
              {
                icon: Swords,
                title: "Decision Engine",
                desc: "Hierarchy-weighted proposals, voting, and team decision-making with real consequences.",
              },
              {
                icon: Dice5,
                title: "Random Events",
                desc: "Unpredictable events (client threats, positive press, security breaches) inject chaos.",
              },
              {
                icon: Activity,
                title: "Burnout Prediction",
                desc: "Identify breaking points with personality-weighted stress absorption and natural recovery.",
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
            icon={Lock}
            title="Sign In or Register"
            description="Create an account with email/password or sign in with Google OAuth. You start with 10 free simulation credits. Admin users have unlimited credits."
          />
          <StepCard
            step={2}
            icon={Settings}
            title="Configure Your Company"
            description="Navigate to the Setup page and define your company name, culture, and context. Optionally upload a document (PDF, DOCX, Excel) for AI-powered requirement extraction and crisis suggestions."
          />
          <StepCard
            step={3}
            icon={Users}
            title="Assemble Your Team"
            description="Choose from 4 preset agent personas (Alex, Sam, Jordan, Casey) or create fully custom agents with unique personality traits, motivations, expertise, and per-agent LLM model overrides. Up to 8 agents per simulation."
          />
          <StepCard
            step={4}
            icon={AlertTriangle}
            title="Inject a Crisis"
            description='Select a pre-built scenario, use the AI Auto-Generate button for a tailored crisis based on your company profile, or write your own custom crisis event.'
          />
          <StepCard
            step={5}
            icon={Play}
            title="Start & Observe"
            description="Hit 'Launch Simulation' and watch your AI team react in a live Slack-like interface. Use God Mode to intervene in real-time. Random events may inject additional chaos mid-simulation."
          />

          <InfoCallout type="tip" title="Pro Tip">
            Start with the default preset team and a pre-built crisis to get
            familiar with the system. Each agent has a hidden agenda you
            won&apos;t see until the drama unfolds.
          </InfoCallout>

          {/* Architecture */}
          <SectionHeading id="architecture" icon={Layers}>
            Architecture
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            TeamDynamics is built on a modern stack designed for real-time AI
            interactions with persistent state:
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
                <p>• Google OAuth (Client SDK)</p>
                <p>• Sonner toast notifications</p>
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
                <p>• FastAPI (Python) with Uvicorn</p>
                <p>• Multi-LLM: OpenAI / Gemini / OpenRouter</p>
                <p>• WebSocket for real-time streaming</p>
                <p>• PostgreSQL + asyncpg connection pooling</p>
                <p>• JWT Authentication (bcrypt + jose)</p>
                <p>• Personality-Weighted State Machine</p>
                <p>• Decision Engine &amp; World State System</p>
              </CardContent>
            </Card>
          </div>

          <CodeBlock
            title="System Architecture"
            language="text"
            code={`┌──────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Login / │  │  Setup   │  │Simulation│  │  Report /  │  │
│  │Register │  │  Page    │  │  Page     │  │ Dashboard  │  │
│  └────┬────┘  └─────┬────┘  └─────┬─────┘  └──────┬─────┘  │
│       │  Auth Context (JWT)  │ WebSocket   │ REST API   │  │
└───────┼──────────────────────┼─────────────┼────────────┘  │
        │                      │             │               │
┌───────┼──────────────────────┼─────────────┼───────────────┐
│       ▼     FastAPI Backend  ▼             ▼               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Auth Router ─── Simulation Router           │   │
│  │         Agent Router ── Document Router              │   │
│  │         WebSocket Router (Background Tasks)         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │              Simulation Engine (Orchestrator)       │   │
│  ├──────────┬──────────┬──────────┬───────────────────┤   │
│  │ Agent 1  │ Agent 2  │ Agent N  │ Per-Agent LLM     │   │
│  │ (LLM)    │ (LLM)    │ (LLM)    │ Model Override    │   │
│  ├──────────┴──────────┴──────────┴───────────────────┤   │
│  │   Personality-Weighted State Machine               │   │
│  │   (Morale, Stress, Loyalty, Productivity)          │   │
│  ├────────────────────────────────────────────────────┤   │
│  │   Decision Engine  │  World State  │ Round Agenda  │   │
│  │   (Proposals,      │  (Budget,     │ (5 Phases,    │   │
│  │    Voting,          │  Deadline,    │  Crisis-aware │   │
│  │    Hierarchy)       │  Reputation)  │  Modifiers)   │   │
│  ├────────────────────────────────────────────────────┤   │
│  │   Hidden Agendas │ Random Events │ Agent Memory    │   │
│  └────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (asyncpg)  │  Report Generator (LLM)  │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘`}
          />

          {/* ==================== AUTHENTICATION ==================== */}
          <Separator className="my-12 opacity-30" />

          <SectionHeading id="auth-system" icon={Lock}>
            Authentication System
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            TeamDynamics supports two authentication methods for user accounts.
            Authentication is optional for simulation access but required for
            credit tracking and simulation history.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <Card className="bg-card/40 border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-sm">Email + Password</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Register with email, name, and password (min 6 chars). Passwords are hashed with bcrypt. JWT tokens expire after 7 days.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-sm">Google OAuth</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  One-click sign-in with Google. Supports both access token and ID token flows. Auto-creates user accounts for new Google users.
                </p>
              </CardContent>
            </Card>
          </div>

          <SectionHeading id="credits" icon={Zap}>
            Credits &amp; Roles
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Every new user receives <strong className="text-foreground">10 simulation credits</strong>.
            Each simulation launch consumes 1 credit. Admin users (configured
            via <code className="bg-background/50 px-2 py-0.5 rounded text-xs">ADMIN_EMAIL</code> environment variable) have unlimited credits.
          </p>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border border-border/50 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-card/60 border-b border-border/50">
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-left px-4 py-3 font-semibold">Credits</th>
                  <th className="text-left px-4 py-3 font-semibold">Capabilities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                <tr className="hover:bg-card/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium">User</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">10 (default)</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">Create simulations, view reports, manage profile</td>
                </tr>
                <tr className="hover:bg-card/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium">Admin</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">Unlimited</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">All user capabilities + unlimited simulations</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ==================== CORE CONCEPTS ==================== */}
          <Separator className="my-12 opacity-30" />

          <SectionHeading id="agents" icon={Bot}>
            AI Agents
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Each agent in TeamDynamics is a fully autonomous AI entity powered
            by a large language model. Agents have persistent memory, emotional
            states, hidden agendas, and evolving relationships with other team
            members. State changes are <strong className="text-foreground">personality-weighted</strong> —
            agents with different traits absorb stress, morale hits, and bonuses
            differently.
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
                  ["type", "string", 'Archetype label (e.g., "Strict & Burned Out")'],
                  ["personality", "PersonalityTraits", "Deep psychological profile object (5 traits)"],
                  ["motivation", "string?", "Hidden career motivation driving behavior"],
                  ["expertise", "string?", "Domain expertise area"],
                  ["model", "string?", "Per-agent LLM model override"],
                  ["morale", "number (0-100)", "Current emotional well-being"],
                  ["stress", "number (0-100)", "Current stress/burnout level"],
                  ["loyalty", "number (0-100)", "Commitment to the company"],
                  ["productivity", "number (0-100)", "Current output efficiency"],
                  ["memory", "MemoryEntry[]", "Persistent memory across rounds (last 8 entries)"],
                  ["has_resigned", "boolean", "Whether the agent has quit"],
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

          <SubHeading>Personality-Weighted State Machine</SubHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            State changes are not applied equally to all agents. Each
            personality trait creates multipliers that modulate how agents
            absorb changes:
          </p>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border border-border/50 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-card/60 border-b border-border/50">
                  <th className="text-left px-4 py-3 font-semibold">Trait</th>
                  <th className="text-left px-4 py-3 font-semibold">Effect</th>
                  <th className="text-left px-4 py-3 font-semibold">Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  ["Stress Tolerance", "High tolerance → absorbs less stress", "0.4x – 1.6x"],
                  ["Empathy + Agreeableness", "High → morale drops less from negativity, gains more from positivity", "0.7x – 1.3x"],
                  ["Ambition", "High ambition → productivity drops less", "0.5x – 1.2x"],
                  ["Agreeableness + Assertiveness", "High agreeableness + low assertiveness → loyalty more stable", "0.6x – 1.4x"],
                ].map(([trait, effect, range], i) => (
                  <tr key={i} className="hover:bg-card/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-xs">{trait}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{effect}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-primary">{range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <InfoCallout type="info" title="Natural Recovery">
            Agents naturally recover a small amount each round based on their
            personality. High stress tolerance → up to 4 stress recovery/round.
            High empathy → morale stabilizes toward baseline when below 50%.
          </InfoCallout>

          {/* Persona Design */}
          <SectionHeading id="personas" icon={Brain}>
            Persona Design
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Personas define how agents think, communicate, and react to stress.
            TeamDynamics ships with 4 curated presets, but you can design fully
            custom personas with up to 8 agents per simulation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            {[
              {
                name: "Alex",
                role: "Tech Lead",
                type: "Strict & Burned Out",
                color: "bg-red-500/20 text-red-400 border-red-500/20",
                traits: "Low patience (EMP:30), high competence (AMB:80), extremely low stress tolerance (ST:25), very assertive (ASR:90)",
              },
              {
                name: "Sam",
                role: "Junior Dev",
                type: "Ambitious & Naive",
                color: "bg-green-500/20 text-green-400 border-green-500/20",
                traits: "High ambition (AMB:90), low experience (ST:30), people-pleaser tendencies (AGR:80), low assertiveness (ASR:25)",
              },
              {
                name: "Jordan",
                role: "Product Manager",
                type: "Empathetic",
                color: "bg-blue-500/20 text-blue-400 border-blue-500/20",
                traits: "Very high emotional intelligence (EMP:90), strong mediator (AGR:85), good stress tolerance (ST:70), risk-averse",
              },
              {
                name: "Casey",
                role: "Senior Dev",
                type: "Silent & Efficient",
                color: "bg-purple-500/20 text-purple-400 border-purple-500/20",
                traits: "Introverted, very high resilience (ST:85), low agreeableness (AGR:30), avoids conflict until critical",
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

          <InfoCallout type="tip" title="Per-Agent LLM Override">
            Each agent can use a different LLM model. Choose from GPT-4o, Claude 3.7 Sonnet, Llama 3.1, Mistral 7B, Gemini 2.0 Flash, Deepseek, or any custom OpenRouter model.
          </InfoCallout>

          {/* Crisis Injection */}
          <SectionHeading id="crisis-injection" icon={AlertTriangle}>
            Crisis Injection
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Crisis events are the catalysts that trigger agent reactions. They
            simulate real-world disruptions that test team resilience. Each
            crisis also initializes a unique World State with appropriate
            constraints.
          </p>

          <SubHeading>Built-in Crisis Scenarios</SubHeading>
          <div className="space-y-3 my-4">
            {[
              {
                name: "Mandatory Weekend Coding for v2.0",
                severity: "High",
                desc: "Forces entire engineering team to work weekends indefinitely. Budget: 60%, Deadline: 6 weeks.",
              },
              {
                name: "Budget Cut: 30% Layoffs Required",
                severity: "Critical",
                desc: "Management demands immediate headcount reduction. Budget: 35%, Reputation: 55%.",
              },
              {
                name: "CEO Resigns Unexpectedly",
                severity: "Critical",
                desc: "Leadership vacuum creates uncertainty and power struggles. Reputation: 40%.",
              },
              {
                name: "Critical Database Deleted on Friday",
                severity: "High",
                desc: "Production incident requiring emergency all-hands response. Deadline: 2 weeks, Customer Satisfaction: 30%.",
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

          <InfoCallout type="info" title="AI Auto-Generate & Custom Crises">
            Use the <strong>Auto-Generate</strong> button to create an AI-tailored crisis based on your company profile, or write free-form crisis descriptions
            that the AI engine will interpret contextually.
          </InfoCallout>

          {/* Document Analysis */}
          <SectionHeading id="document-analysis" icon={FileUp}>
            Document Upload &amp; AI Analysis
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Upload documents (PDF, DOCX, TXT, CSV, Excel — max 10MB) for
            AI-powered analysis. The system extracts text and produces:
          </p>
          <ul className="space-y-2 my-4 text-sm text-muted-foreground">
            {[
              "Document summary and key requirements",
              "Team risk identification",
              "Suggested crisis scenario tailored to the document content",
              "Suggested agent roles and rationale",
              "Actionable insights for simulation setup",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-violet-500" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* ==================== SIMULATION ENGINE ==================== */}
          <Separator className="my-12 opacity-30" />

          <SectionHeading id="simulation-flow" icon={Activity}>
            Simulation Flow
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Once configured, the simulation runs as a <strong className="text-foreground">background task</strong> that
            survives WebSocket disconnects — clients can reconnect and resume
            viewing. Each round, agents process the current situation, update
            their internal states, and produce public messages, private
            thoughts, actions, and memory updates.
          </p>

          <SubHeading>Round Lifecycle</SubHeading>
          <CodeBlock
            title="Simulation Round Flow"
            language="text"
            code={`Round Start
  │
  ├─→ World State tick (deadline approaches, budget burns, debt creeps)
  │
  ├─→ Phase transition check (broadcast phase shift announcement)
  │
  ├─→ Roll for Random Event (may inject chaos)
  │
  ├─→ Each agent processes (sequentially):
  │   ├── Typing indicator broadcast
  │   ├── Reviews personality, memory, hidden agenda
  │   ├── Reads World State constraints & round agenda
  │   ├── Evaluates hierarchy position & decision context
  │   ├── Generates via LLM (per-agent model override)
  │   └── Produces: public_message, internal_thought,
  │                  state_changes, memory_update, action, action_detail
  │
  ├─→ Apply personality-weighted state changes
  ├─→ Process action through Decision Engine (proposals/votes/consequences)
  ├─→ Check for critical events (resignation, burnout)
  ├─→ Apply resignation effects to World State
  │
  ├─→ God Mode check: Player can intervene via WebSocket
  │
  └─→ Record metrics snapshot → Check end conditions → Next Round
       └─→ If final round or all resigned → Determine Outcome`}
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
                      &ldquo;Are you serious right now? We&apos;ve been working 60-hour
                      weeks for a month.&rdquo;
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="thought">
              <Card className="bg-card/40 border-border/50 mt-4">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-3">
                    Internal thoughts reveal what the agent is truly thinking.
                    These are influenced by the agent&apos;s hidden agenda,
                    which drives selfish or strategic behavior behind the scenes.
                  </p>
                  <div className="bg-secondary/50 rounded-lg p-4 border border-border/50 text-sm italic">
                    <span className="font-semibold text-primary/70 not-italic">
                      Internal Thought:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      &ldquo;If I play this right, I can position myself as the hero who
                      saved the project. I need to make sure my proposal gets adopted, not Casey&apos;s.&rdquo;
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="system">
              <Card className="bg-card/40 border-border/50 mt-4">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-3">
                    System events include crisis announcements, phase shifts,
                    random events, decision engine updates, and critical alerts.
                  </p>
                  <div className="space-y-2">
                    <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20 text-sm flex gap-3">
                      <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-xs">
                        🎲 UNEXPECTED EVENT: Key Client Threatens to Leave
                      </span>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20 text-sm flex gap-3">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-xs">
                        ✅ TEAM DECISION REACHED: &ldquo;Implement rotating weekend shifts with comp time&rdquo;
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Simulation Phases */}
          <SectionHeading id="simulation-phases" icon={Timer}>
            Simulation Phases &amp; Round Agenda
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Each simulation progresses through 5 distinct phases based on round
            progression. Phases define the <em>purpose</em> of each round so
            conversations drive toward concrete decisions rather than aimless discussion.
          </p>

          <div className="space-y-3 my-6">
            {[
              { name: "Crisis Impact", range: "0–15%", tone: "Reactive, emotional, uncertain", desc: "The crisis just hit. Agents react emotionally and assess the damage." },
              { name: "Strategy Debate", range: "15–35%", tone: "Argumentative, strategic", desc: "Agents propose competing solutions and argue their merits." },
              { name: "Decision Point", range: "35–50%", tone: "Decisive, urgent", desc: "The team must converge on a decision. Fence-sitters must pick a side." },
              { name: "Execution & Adaptation", range: "50–75%", tone: "Focused, stressed", desc: "The team executes their decision and deals with consequences." },
              { name: "Resolution & Reflection", range: "75–100%", tone: "Reflective, honest", desc: "The crisis nears resolution. Agents reflect and decide their future." },
            ].map((phase, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-card/40 border border-border/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{phase.name}</span>
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/20">{phase.range}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{phase.desc}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 italic">Tone: {phase.tone}</p>
                </div>
              </div>
            ))}
          </div>

          <InfoCallout type="info" title="Crisis-Specific Modifiers">
            Each crisis injects specific discussion points per phase. For example,
            during the &ldquo;Decision Point&rdquo; phase of a Layoffs crisis, agents debate
            criteria like performance vs. seniority vs. role criticality.
          </InfoCallout>

          {/* World State */}
          <SectionHeading id="world-state" icon={Globe}>
            World State Engine
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The World State provides <strong className="text-foreground">concrete, measurable constraints</strong> that
            ground agent decisions in reality. Agents reference these numbers when
            proposing solutions — no proposing hiring if budget is below 30%.
          </p>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border border-border/50 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-card/60 border-b border-border/50">
                  <th className="text-left px-4 py-3 font-semibold">Metric</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Per-Round Decay</th>
                  <th className="text-left px-4 py-3 font-semibold">Affected By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  ["Budget Remaining", "0–100%", "−2% / round", "Actions, events, decisions"],
                  ["Deadline (Weeks Left)", "countdown", "−1 / round", "Time only"],
                  ["Team Capacity", "0–100%", "None", "Resignations, rally actions"],
                  ["Customer Satisfaction", "0–100%", "None", "Events, transparency, blame"],
                  ["Technical Debt", "0–100%", "+1% / round", "Rushed decisions, alarms"],
                  ["Company Reputation", "0–100%", "None", "Media, events, decisions"],
                ].map(([metric, type, decay, affected], i) => (
                  <tr key={i} className="hover:bg-card/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-xs">{metric}</td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{type}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{decay}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{affected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Decision Engine */}
          <SectionHeading id="decision-engine" icon={Swords}>
            Decision Engine
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The Decision Engine tracks proposals, votes, and team consensus using
            a <strong className="text-foreground">hierarchy-weighted influence system</strong>.
            A proposal needs 3.0+ weighted influence to pass as a team decision.
          </p>

          <SubHeading>Power Hierarchy</SubHeading>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border border-border/50 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-card/60 border-b border-border/50">
                  <th className="text-left px-4 py-3 font-semibold">Level</th>
                  <th className="text-left px-4 py-3 font-semibold">Roles</th>
                  <th className="text-left px-4 py-3 font-semibold">Influence Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  ["C-Suite", "CEO, CTO, CFO, COO", "3.0"],
                  ["VP / Director", "VP, Vice President, Director", "2.5"],
                  ["Lead / Manager", "Lead, Manager, Head, Principal", "2.0"],
                  ["Senior", "Senior, Staff, Architect", "1.5"],
                  ["Individual Contributor", "Default level", "1.0"],
                  ["Junior", "Junior, Intern, Associate, Entry", "0.7"],
                ].map(([level, roles, weight], i) => (
                  <tr key={i} className="hover:bg-card/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-xs">{level}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{roles}</td>
                    <td className="px-4 py-2.5 font-mono text-primary text-sm font-bold">{weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubHeading>Available Agent Actions</SubHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4">
            {[
              ["propose_solution", "Propose a concrete solution to the crisis"],
              ["support_proposal", "Support another team member's proposal"],
              ["oppose_proposal", "Disagree with a proposal and explain why"],
              ["negotiate", "Seek a compromise between competing proposals"],
              ["escalate", "Escalate the issue to management/leadership"],
              ["rally_team", "Boost team morale and unity"],
              ["blame", "Point fingers at who caused the problem"],
              ["resign_threat", "Threaten or hint at resignation"],
              ["report_progress", "Report on progress of the current plan"],
              ["raise_alarm", "Sound alarm that something is going wrong"],
            ].map(([action, desc], i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-card/30 border border-border/30">
                <code className="text-[10px] font-mono text-primary whitespace-nowrap">{action}</code>
                <span className="text-[11px] text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>

          {/* Hidden Agendas */}
          <SectionHeading id="hidden-agendas" icon={Eye}>
            Hidden Agendas
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Every agent has a <strong className="text-foreground">secret hidden agenda</strong> that
            colors their decisions without other agents knowing. Preset agents have
            curated agendas, while custom agents receive randomly assigned ones.
          </p>

          <div className="space-y-3 my-4">
            {[
              { name: "Alex (Tech Lead)", agenda: "Secretly angling for a VP promotion. Prefers solutions that showcase their leadership, subtly undermines proposals that would make others the hero." },
              { name: "Sam (Junior Dev)", agenda: "Secretly interviewing at other companies. Wants visible, impressive tasks for resume-building. Avoids grunt work." },
              { name: "Jordan (PM)", agenda: "Secretly promised a customer an impossible timeline. Steers conversations away from customer commitments." },
              { name: "Casey (Senior Dev)", agenda: "Wants to stay under the radar and go home at 5pm. Resists any proposal that increases their workload." },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-card/40 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold text-sm">{item.name}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic">&ldquo;{item.agenda}&rdquo;</p>
              </div>
            ))}
          </div>

          {/* Random Events */}
          <SectionHeading id="random-events" icon={Dice5}>
            Random Events
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Random events inject unpredictability into the simulation. Each round,
            there&apos;s a chance (8-15% per event) that an unexpected event fires.
            Events affect the World State and all active agents&apos; morale/stress.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <h4 className="font-semibold text-sm text-red-400 mb-2">Negative Events</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Key Client Threatens to Leave</li>
                <li>• Competitor Poaching Attempt</li>
                <li>• Additional Budget Cuts</li>
                <li>• Minor Security Incident</li>
                <li>• Negative Press Coverage</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <h4 className="font-semibold text-sm text-green-400 mb-2">Positive Events</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Investor Shows Renewed Confidence</li>
                <li>• Major Customer Sends Praise</li>
                <li>• Positive Media Coverage</li>
                <li>• Critical Resource Discovered</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <h4 className="font-semibold text-sm text-yellow-400 mb-2">Mixed Events</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Emergency Board Meeting Called</li>
                <li>• New Industry Regulation</li>
              </ul>
            </div>
          </div>

          {/* God Mode */}
          <SectionHeading id="god-mode" icon={Zap}>
            God Mode
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            During any active simulation, you have access to{" "}
            <strong className="text-foreground">God Mode</strong>—a powerful
            intervention system that lets you alter the course of the simulation
            in real-time. Interventions are personality-weighted — cynical agents
            (low agreeableness) benefit less from positive interventions.
          </p>

          <SubHeading>Quick Actions</SubHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            {[
              {
                icon: Zap,
                name: "Give Bonus",
                desc: "Award a surprise bonus. Morale +15, Stress -5, Loyalty +10 (base values, modified by personality).",
                color: "text-yellow-500",
              },
              {
                icon: Coffee,
                name: "Pizza Party",
                desc: "Lighten the mood. Morale +8, Stress -10, Loyalty +5 (personality-weighted).",
                color: "text-orange-400",
              },
              {
                icon: Shield,
                name: "Cancel Overtime",
                desc: "Revoke mandatory extra hours. Morale +20, Stress -25, but Productivity -10.",
                color: "text-blue-400",
              },
              {
                icon: Send,
                name: "Custom Message",
                desc: "Type any intervention as a management announcement. Morale +10, Stress -8.",
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
            God Mode interventions affect agent states immediately. Cynical agents
            (low agreeableness) have an effectiveness range of 0.5x–1.3x for
            interventions. Excessive positive interventions may produce unrealistic
            results.
          </InfoCallout>

          {/* Outcomes */}
          <SectionHeading id="outcomes" icon={Crown}>
            Simulation Outcomes
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            When a simulation ends (final round reached or all agents resign),
            the engine determines one of 6 possible outcomes based on agent states,
            decision status, and world health:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            {[
              { emoji: "🏆", title: "Team Triumph", desc: "High morale, no resignations, decision reached, healthy world.", color: "border-green-500/30 bg-green-500/5" },
              { emoji: "🤝", title: "Negotiated Settlement", desc: "Decision reached through debate, acceptable state.", color: "border-blue-500/30 bg-blue-500/5" },
              { emoji: "⚡", title: "Pyrrhic Victory", desc: "Crisis addressed, but at significant human cost.", color: "border-yellow-500/30 bg-yellow-500/5" },
              { emoji: "💔", title: "Team Fracture", desc: ">50% resigned or avg morale <20%. Deep fault lines exposed.", color: "border-orange-500/30 bg-orange-500/5" },
              { emoji: "🔥", title: "Total Collapse", desc: "All agents resigned or burned out. No team left.", color: "border-red-500/30 bg-red-500/5" },
              { emoji: "⏳", title: "Stalemate", desc: "No proposals made, team talked in circles while crisis deepened.", color: "border-gray-500/30 bg-gray-500/5" },
            ].map((outcome, i) => (
              <div key={i} className={cn("p-4 rounded-xl border", outcome.color)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{outcome.emoji}</span>
                  <span className="font-semibold text-sm">{outcome.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{outcome.desc}</p>
              </div>
            ))}
          </div>

          {/* Metrics */}
          <SectionHeading id="metrics" icon={BarChart3}>
            Metrics &amp; Tracking
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            During a simulation, the dashboard tracks key organizational health
            metrics in real-time with timeline history:
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
                  ["Stress", "0-100%", "> 80%", "Output quality drops, burnout threshold hit"],
                  ["Loyalty", "0-100%", "< 20%", "Agent begins job-hunting behavior"],
                  ["Productivity", "0-100%", "< 40%", "Deadlines will be missed"],
                  ["Team Cohesion", "0-100%", "< 30%", "Composite of loyalty, morale, and alignment"],
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
            AI-powered report including:
          </p>

          <ul className="space-y-3 my-6 text-sm text-muted-foreground">
            {[
              "Executive Summary with key findings and critical alerts",
              "Simulation Overview — detailed objective and scenario description",
              "Structured Key Metrics (total agents, active, resignations, averages)",
              "In-depth Analysis Insights — AI-generated paragraph analyzing patterns",
              "Agent Resiliency Profiles showing start vs. end states with status labels",
              "Conclusion — final summary and risk assessment",
              "Timeline visualization (morale, stress, output per round)",
              "Actionable Recommendations — 3-5 AI-generated management actions",
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
                Example Report Output
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <div className="bg-destructive/10 border-l-4 border-destructive rounded-r-lg p-3">
                <strong className="text-foreground">Critical Finding:</strong>{" "}
                Stress reached a dangerous 95% peak at Week 8 — a direct result
                of unresolved interpersonal blame between Dinesh and Gilfoyle.
              </div>
              <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-3">
                <strong className="text-foreground">Analysis Insight:</strong>{" "}
                The simulation revealed a critical leadership vacuum during weeks 4-8
                when the CEO defaulted to micromanagement rather than strategic delegation.
              </div>
              <div className="space-y-2 mt-4">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                  Recommended Actions:
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Implement a crisis communication protocol with designated roles.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Train leaders on conflict mediation techniques.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Establish mandatory post-incident debrief sessions within 48 hours.
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
            The TeamDynamics backend exposes a RESTful API with WebSocket support.
            All endpoints return JSON. Authentication uses Bearer JWT tokens.
          </p>

          <SubHeading>Authentication</SubHeading>
          <div className="space-y-3 my-4">
            {[
              { method: "POST", path: "/api/auth/register", desc: "Register a new user with email, name, and password.", methodColor: "bg-green-500/20 text-green-400" },
              { method: "POST", path: "/api/auth/login", desc: "Login with email and password. Returns JWT token and user profile.", methodColor: "bg-green-500/20 text-green-400" },
              { method: "POST", path: "/api/auth/google", desc: "Authenticate with Google OAuth credential. Auto-creates user if new.", methodColor: "bg-green-500/20 text-green-400" },
              { method: "GET", path: "/api/auth/me", desc: "Get current user profile (requires Bearer token).", methodColor: "bg-blue-500/20 text-blue-400" },
              { method: "GET", path: "/api/auth/me/simulations", desc: "Get all simulations for the authenticated user.", methodColor: "bg-blue-500/20 text-blue-400" },
            ].map((endpoint, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card/40 border border-border/50 hover:border-primary/20 transition-colors">
                <Badge className={cn("font-mono text-[10px] font-bold border-none shrink-0 mt-0.5", endpoint.methodColor)}>{endpoint.method}</Badge>
                <div>
                  <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                  <p className="text-xs text-muted-foreground mt-1">{endpoint.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <SubHeading>Simulation</SubHeading>
          <div className="space-y-3 my-4">
            {[
              { method: "POST", path: "/api/simulation/create", desc: "Create a new simulation with company profile, agents, crisis config, and params. Deducts 1 credit.", methodColor: "bg-green-500/20 text-green-400" },
              { method: "POST", path: "/api/simulation/generate-crisis", desc: "AI-generate a tailored crisis based on company name and culture.", methodColor: "bg-green-500/20 text-green-400" },
              { method: "GET", path: "/api/simulation/{id}/status", desc: "Get current simulation status, round, agents, messages, and metrics.", methodColor: "bg-blue-500/20 text-blue-400" },
              { method: "POST", path: "/api/simulation/{id}/intervene", desc: "Send a God Mode intervention (bonus, pizza, cancel_overtime, custom).", methodColor: "bg-green-500/20 text-green-400" },
              { method: "GET", path: "/api/simulation/{id}/report", desc: "Generate and retrieve the full post-simulation report with AI insights.", methodColor: "bg-blue-500/20 text-blue-400" },
            ].map((endpoint, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card/40 border border-border/50 hover:border-primary/20 transition-colors">
                <Badge className={cn("font-mono text-[10px] font-bold border-none shrink-0 mt-0.5", endpoint.methodColor)}>{endpoint.method}</Badge>
                <div>
                  <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                  <p className="text-xs text-muted-foreground mt-1">{endpoint.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <SubHeading>Other Endpoints</SubHeading>
          <div className="space-y-3 my-4">
            {[
              { method: "GET", path: "/api/agents/presets", desc: "List all 4 available preset agent personas.", methodColor: "bg-blue-500/20 text-blue-400" },
              { method: "POST", path: "/api/document/analyze", desc: "Upload a document (multipart) for AI-powered analysis. Max 10MB.", methodColor: "bg-green-500/20 text-green-400" },
              { method: "GET", path: "/health", desc: "Health check — returns service status, version, and LLM provider.", methodColor: "bg-blue-500/20 text-blue-400" },
              { method: "WS", path: "/ws/simulation/{id}", desc: "WebSocket for real-time simulation streaming. Supports interventions via JSON messages.", methodColor: "bg-purple-500/20 text-purple-400" },
            ].map((endpoint, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card/40 border border-border/50 hover:border-primary/20 transition-colors">
                <Badge className={cn("font-mono text-[10px] font-bold border-none shrink-0 mt-0.5", endpoint.methodColor)}>{endpoint.method}</Badge>
                <div>
                  <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                  <p className="text-xs text-muted-foreground mt-1">{endpoint.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Data Models */}
          <SectionHeading id="data-models" icon={Layers}>
            Data Models
          </SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Core data structures used across the TeamDynamics system:
          </p>

          <CodeBlock
            title="Create Simulation Request"
            language="typescript"
            code={`interface CreateSimulationRequest {
  company: {
    name: string;           // 1-100 chars
    culture: string;        // 1-1000 chars
  };
  agents: {
    id: string;
    name: string;
    role: string;
    type: string;           // e.g. "Strict & Burned Out"
    color?: string;
    personality: {
      empathy: number;           // 0-100
      ambition: number;          // 0-100
      stressTolerance: number;   // 0-100
      agreeableness: number;     // 0-100
      assertiveness: number;     // 0-100
    };
    motivation?: string;    // Career motivation text
    expertise?: string;     // Domain expertise area
    model?: string;         // Per-agent LLM model override
  }[];
  crisis: {
    scenario: "rnd1" | "rnd2" | "rnd3" | "rnd4" | "custom";
    custom_description?: string;
  };
  params: {
    duration_weeks: number; // 1-52 (default: 12)
    pacing: "slow" | "normal" | "fast";
  };
}`}
          />

          <CodeBlock
            title="WebSocket Message Payload"
            language="typescript"
            code={`// Sent on each agent message during simulation
interface WebSocketPayload {
  type: "init" | "message" | "completed" | "error" | "typing_start";
  data?: {                     // Agent message data
    id: number;
    round: number;
    agent_id: string;
    agent_name: string;
    type: "public" | "thought" | "system";
    content: string;
    thought?: string;          // Internal thought (hidden insight)
    state_changes?: {
      morale?: number;         // Delta (e.g., -5, +10)
      stress?: number;
      loyalty?: number;
      productivity?: number;
    };
    timestamp: string;
  };
  agents: AgentState[];        // Updated agent states
  metrics: {
    avgMorale: number;
    avgStress: number;
    productivity: number;
    resignations: number;
    avgLoyalty: number;
    teamCohesion: number;      // Composite metric
  };
  worldState?: {               // Dynamic world constraints
    budgetRemaining: number;
    customerSatisfaction: number;
    companyReputation: number;
    teamCapacity: number;
    technicalDebt: number;
    deadlineWeeksLeft: number;
  };
  decisionStatus?: {           // Decision engine state
    proposalCount: number;
    hasDecision: boolean;
    decidedProposal?: string;
    leadingProposal?: string;
    leadingSupport: number;
    escalationCount: number;
    resignThreats: string[];
  };
  currentRound: number;
  totalRounds: number;
  status: "idle" | "running" | "completed";
  metricsHistory?: { round: number; morale: number; stress: number;
                     productivity: number; loyalty: number; cohesion: number; }[];
}`}
          />

          <CodeBlock
            title="Report Response Model"
            language="typescript"
            code={`interface ReportResponse {
  simulation_id: string;
  company_name: string;
  crisis_name: string;
  total_rounds: number;
  completed_rounds: number;
  executive_summary: string;     // AI-generated overview
  critical_finding: string;      // Most critical issue identified
  simulation_overview: string;   // Detailed scenario description
  key_metrics: {
    total_agents: number;
    active_agents: number;
    resignations: number;
    avg_morale: number;
    avg_stress: number;
    avg_loyalty: number;
    avg_productivity: number;
    productivity_drop: number;
    simulation_weeks: number;
    total_planned_weeks: number;
  };
  analysis_insights: string;     // In-depth analysis paragraph
  conclusion: string;            // Final summary
  agent_reports: {
    id: string;
    name: string;
    role: string;
    starting_morale: number;
    ending_morale: number;
    peak_stress: number;
    has_resigned: boolean;
    resigned_week?: number;
    status: "Failed" | "Critical" | "Stressed" | "Stable" | "Thriving";
    status_label: string;        // e.g., "Resigned • Week 9"
  }[];
  productivity_drop: number;
  recommendations: string[];     // 3-5 AI-generated actions
  timeline: {                    // Per-round metrics for charts
    round: number;
    morale: number;
    stress: number;
    output: number;
  }[];
}`}
          />

          <InfoCallout type="info" title="WebSocket Streaming">
            For real-time message streaming during simulations, connect to{" "}
            <code className="bg-background/50 px-2 py-0.5 rounded text-xs">
              ws://localhost:8000/ws/simulation/{"{id}"}
            </code>
            . The simulation runs as a background task — disconnecting does NOT stop
            the simulation. Reconnect anytime to resume viewing.
          </InfoCallout>

          <InfoCallout type="tip" title="Multi-LLM Provider Support">
            The backend supports three LLM providers configured via the{" "}
            <code className="bg-background/50 px-2 py-0.5 rounded text-xs">LLM_PROVIDER</code> env variable:
            <strong> OpenAI</strong> (gpt-4o-mini, gpt-4o), <strong>Google Gemini</strong> (gemini-2.0-flash),
            and <strong>OpenRouter</strong> (any model including free options like Llama 3.1 8B).
          </InfoCallout>

          {/* Footer CTA */}
          <div className="mt-20 rounded-3xl border border-border/50 bg-linear-to-br from-primary/5 via-card/60 to-card/40 p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Ready to simulate?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Configure your team, inject a crisis, and discover the breaking
              point of your organization — complete with hidden agendas, random events,
              and dramatic outcomes.
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
