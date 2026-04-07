"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Users, Activity, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-background antialiased">
      {/* Background Subtle Gradient Grid or very subtle accent */}
      <div className="absolute inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]"></div>

      {/* Navbar/Header Simple */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10 max-w-7xl mx-auto border-b border-border/40 backdrop-blur-md bg-background/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-xl tracking-tight text-foreground">TeamDynamics</span>
        </div>
        <nav>
          <Link href="/setup">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-medium">
              Dashboard
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="z-10 flex flex-col items-center text-center px-6 max-w-5xl mt-24">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border text-foreground text-sm font-medium mb-10 shadow-sm"
        >
          <Bot className="w-4 h-4 text-primary" />
          <span>V1 Early Access Simulation Sandbox</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-foreground leading-[1.1]"
        >
          What happens when you <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">push your team too hard?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 font-medium"
        >
          Define your startup's culture, inject a crisis, and watch an entire 
          AI-driven team react in real-time. Explore office politics, morale crashes, 
          and productivity spikes in a risk-free sandbox.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
        >
          <Link href="/setup">
            <Button size="lg" className="h-14 px-8 text-base font-semibold w-full sm:w-auto shadow-sm rounded-xl hover:opacity-90">
              Run First Simulation <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto rounded-xl">
              See How It Works
            </Button>
          </Link>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 mb-10 w-full"
        >
          <div className="bg-card/50 backdrop-blur-sm border border-border p-6 rounded-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Assemble AI Personas</h3>
            <p className="text-muted-foreground text-sm">Design 5-axis psychological profiles for your virtual employees.</p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border p-6 rounded-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Simulated Slack Chat</h3>
            <p className="text-muted-foreground text-sm">Watch the drama unfold live. Read their internal thoughts as they work.</p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border p-6 rounded-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Actionable Reports</h3>
            <p className="text-muted-foreground text-sm">Analyze hidden relationships, identify burnout points, and optimize morale.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
