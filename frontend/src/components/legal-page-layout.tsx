"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  lastUpdated: string;
  sections: LegalSection[];
  crossLink: { href: string; label: string };
}

export default function LegalPageLayout({
  title,
  subtitle,
  icon,
  lastUpdated,
  sections,
  crossLink,
}: LegalPageLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll-spy via IntersectionObserver
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 backdrop-blur-md bg-background/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden bg-[#18181b] shadow-lg shadow-violet-500/20 border border-violet-500/30 group-hover:scale-105 transition-transform">
              <Image src="/logo.svg" alt="TeamDynamics Logo" width={24} height={24} className="object-cover scale-[1.15]" priority />
            </div>
            <span className="font-bold text-lg tracking-tight">TeamDynamics</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-16 pb-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
            {icon}
            {subtitle}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </motion.div>
      </section>

      {/* ── Body: TOC + Content ── */}
      <div className="max-w-6xl mx-auto px-6 pb-24 flex gap-12">
        {/* Sidebar TOC — desktop only */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scroll">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              On this page
            </p>
            {sections.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "w-full text-left text-sm py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center gap-2",
                  activeSection === s.id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <span className="text-[10px] font-mono text-muted-foreground/60 w-5 shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="space-y-12">
            {sections.map((section, idx) => (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                className="scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold tabular-nums shrink-0">
                    {idx + 1}
                  </span>
                  <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
                </div>
                <div className="pl-11 text-[15px] leading-relaxed text-muted-foreground space-y-4 [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80">
                  {section.content}
                </div>
                {idx < sections.length - 1 && (
                  <div className="pl-11 mt-8">
                    <div className="border-t border-border/40" />
                  </div>
                )}
              </motion.section>
            ))}
          </div>
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-border/40 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 TeamDynamics Simulation Engine.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href={crossLink.href}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              {crossLink.label}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-border">·</span>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
