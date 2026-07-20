import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  FileText,
  MessageSquare,
  Shield,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

import { InteractiveHero } from "@/components/landing/interactive-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "TeamDynamics — AI Team Scenario Simulator",
  description:
    "Stress-test team scenarios with configurable AI personas and review how morale, communication, and output respond under pressure.",
};

const workflowSteps: Array<{
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    number: "01",
    icon: SlidersHorizontal,
    title: "Configure the scenario",
    description:
      "Set the team roles, operating context, and crisis you want to rehearse.",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Observe the response",
    description:
      "Watch each persona reason, communicate, and adapt as pressure changes.",
  },
  {
    number: "03",
    icon: Activity,
    title: "Review risk signals",
    description:
      "Compare morale, output, and communication patterns before making a real decision.",
  },
];

const decisionOutputs: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: MessageSquare,
    title: "Live team response",
    description:
      "Follow public messages, internal reasoning, and decision changes round by round.",
  },
  {
    icon: Activity,
    title: "Risk timeline",
    description:
      "Review how morale, stress, output, and team stability move across the scenario.",
  },
  {
    icon: FileText,
    title: "Decision brief",
    description:
      "Leave with critical findings, resiliency profiles, recommended actions, and a shareable report.",
  },
];

const useCases = [
  "Aggressive delivery plan",
  "Leadership or team change",
  "Crisis communication",
];

const personas = [
  {
    name: "Alex",
    role: "Senior Engineer",
    traits: ["High output", "Direct", "Debt-sensitive"],
    description:
      "Surfaces delivery risks early and becomes resistant when technical debt is repeatedly ignored.",
  },
  {
    name: "Jordan",
    role: "Product Manager",
    traits: ["Outcome-focused", "Optimistic", "Scope-aware"],
    description:
      "Keeps the team aligned on outcomes while testing how added scope affects delivery pressure.",
  },
  {
    name: "Taylor",
    role: "Junior Developer",
    traits: ["Curious", "Developing", "Support-sensitive"],
    description:
      "Learns quickly and benefits from explicit priorities when the scenario becomes ambiguous.",
  },
  {
    name: "Morgan",
    role: "Tech Lead",
    traits: ["Protective", "Experienced", "Load-bearing"],
    description:
      "Balances delivery and team health while absorbing coordination pressure from both sides.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,#80808018_1px,transparent_1px),linear-gradient(to_bottom,#80808018_1px,transparent_1px)] opacity-60"
      />

      <LandingNav />

      <main className="relative z-10">
        <InteractiveHero />

        <section
          aria-labelledby="workflow-title"
          className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-6 md:py-28"
        >
          <div className="grid items-end gap-6 border-t border-border/60 pt-10 md:grid-cols-[0.9fr_1.1fr] md:gap-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                How it works
              </p>
              <h2
                id="workflow-title"
                className="mt-4 max-w-xl text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl md:text-5xl"
              >
                Rehearse the decision before the real pressure arrives.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:justify-self-end md:text-lg">
              TeamDynamics turns a management assumption into a visible,
              repeatable scenario—so you can examine trade-offs without
              experimenting on a real team.
            </p>
          </div>

          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step) => (
              <WorkflowStep key={step.number} {...step} />
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="outcomes-title"
          className="relative border-y border-border/50 bg-card/25"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-24 sm:px-6 md:py-28 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                What you leave with
              </p>
              <h2
                id="outcomes-title"
                className="mt-4 max-w-xl text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl md:text-5xl"
              >
                Not another dashboard. A decision brief.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Each run turns a live simulation into a structured scenario
                record you can review, discuss, and use to challenge the
                original plan.
              </p>

              <div className="mt-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
                  Useful when testing
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {useCases.map((useCase) => (
                    <span
                      key={useCase}
                      className="rounded-full border border-border/70 bg-background/55 px-3 py-2 text-xs font-bold text-foreground/80"
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>

              <aside className="mt-8 flex max-w-xl gap-3 rounded-2xl border border-border/60 bg-background/40 p-4">
                <Shield
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Built for scenario rehearsal—not employee surveillance,
                  diagnosis, or prediction.
                </p>
              </aside>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-background/70 shadow-2xl shadow-black/10">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 px-6 py-5 sm:px-8">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                    Scenario output
                  </p>
                  <p className="mt-1 text-lg font-extrabold">
                    What one completed run produces
                  </p>
                </div>
                <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary sm:block">
                  Post-sim
                </span>
              </div>

              <div className="divide-y divide-border/55 px-6 sm:px-8">
                {decisionOutputs.map((output) => (
                  <OutcomeItem key={output.title} {...output} />
                ))}
              </div>

              <div className="border-t border-border/60 bg-secondary/20 px-6 py-5 sm:px-8">
                <Link
                  href="/docs#reports"
                  className="inline-flex items-center gap-2 rounded-md text-sm font-extrabold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
                >
                  Explore report details
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="roster-title"
          className="relative border-b border-border/50 bg-secondary/20"
        >
          <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-6 md:py-28">
            <div className="grid gap-6 md:grid-cols-[1fr_0.9fr] md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Example team model
                </p>
                <h2
                  id="roster-title"
                  className="mt-4 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl md:text-5xl"
                >
                  Meet your simulation roster.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:justify-self-end md:text-lg">
                Configurable AI personas respond to management style,
                deadlines, and scope through distinct roles, priorities, and
                stress tolerances.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {personas.map((persona) => (
                <PersonaCard key={persona.name} {...persona} />
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="final-cta-title"
          className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 md:py-24"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-primary/8 px-6 py-12 text-center sm:px-10 md:py-16">
            <div
              aria-hidden="true"
              className="absolute inset-x-1/4 -top-32 h-64 rounded-full bg-primary/15 blur-3xl"
            />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Start with a low-stakes rehearsal
              </p>
              <h2
                id="final-cta-title"
                className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl md:text-5xl"
              >
                Pressure-test the plan before it becomes a people problem.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Run the guided demo first, or use the Quick Start guide when
                you are ready to configure your own team and scenario.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/demo"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-extrabold text-primary-foreground shadow-lg shadow-primary/15 transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
                >
                  Run 2-minute demo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/docs#quick-start"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-border/80 bg-background/60 px-6 text-sm font-extrabold transition-[background-color,border-color] hover:border-primary/30 hover:bg-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
                >
                  Read Quick Start
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 w-full border-t border-border/40 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-center text-sm font-medium text-muted-foreground sm:px-6 md:flex-row md:text-left">
          <span>
            © 2026 TeamDynamics. Built for founders and people leaders.
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/terms"
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
            >
              Terms of Service
            </Link>
            <span aria-hidden="true" className="text-border">
              ·
            </span>
            <Link
              href="/privacy"
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function WorkflowStep({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <li className="group rounded-3xl border border-border/60 bg-card/45 p-6 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-1 hover:border-primary/30 hover:bg-card/70 motion-reduce:transition-none md:p-7">
      <div className="flex items-center justify-between">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="text-xs font-extrabold tracking-[0.18em] text-muted-foreground/55">
          {number}
        </span>
      </div>
      <h3 className="mt-8 text-xl font-bold tracking-[-0.02em]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>
    </li>
  );
}

function OutcomeItem({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 py-6">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-extrabold tracking-[-0.01em]">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function PersonaCard({
  name,
  role,
  traits,
  description,
}: {
  name: string;
  role: string;
  traits: string[];
  description: string;
}) {
  return (
    <article className="group flex min-h-72 flex-col rounded-3xl border border-border/60 bg-card/55 p-6 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-1 hover:border-primary/30 hover:bg-card/75 motion-reduce:transition-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold tracking-[-0.02em]">{name}</h3>
          <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {role}
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/8 text-primary transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
          <Bot className="size-5" aria-hidden="true" />
        </span>
      </div>

      <p className="mt-6 flex-1 text-sm font-medium leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="mt-6 flex flex-wrap gap-2" aria-label={`${name} traits`}>
        {traits.map((trait) => (
          <span
            key={trait}
            className={cn(
              "w-max rounded-md border border-border/70 bg-background/45 px-2.5 py-1.5",
              "text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground",
            )}
          >
            {trait}
          </span>
        ))}
      </div>
    </article>
  );
}
