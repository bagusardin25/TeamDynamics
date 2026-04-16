"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bot, Users, Activity, MessageSquare, Zap, AlertTriangle, Sun, Moon, LogIn } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

export default function LandingPage() {
  const [pressure, setPressure] = useState([20]);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamic styles based on pressure
  const pressureValue = pressure[0];
  const isDark = resolvedTheme === "dark";
  const isHighPressure = pressureValue > 70;
  const isExtreme = pressureValue > 90;

  const getHeadlineColor = () => {
    if (isExtreme) return "from-red-600 to-orange-600";
    if (isHighPressure) return "from-orange-500 to-amber-500";
    return "from-primary to-primary/60";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-background antialiased overflow-x-hidden">
      {/* Background Grid - Subtle Animation */}
      <div className="absolute inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,#80808025_1px,transparent_1px),linear-gradient(to_bottom,#80808025_1px,transparent_1px)] opacity-80"></div>
      
      {/* Ambient Glow */}
      <div className={cn(
        "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000 opacity-20",
        isHighPressure ? "bg-red-500" : "bg-primary"
      )}></div>

      {/* Navbar/Header */}
      <header className="fixed top-0 w-full p-4 md:p-6 flex justify-center z-50">
        <div className="w-full max-w-7xl flex justify-between items-center px-6 py-3 rounded-2xl border border-border/40 backdrop-blur-md bg-background/60 shadow-sm">
          <div className="flex items-center gap-3 group cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden bg-[#18181b] shadow-lg shadow-violet-500/20 border border-violet-500/30"
            >
              <Image src="/logo.svg" alt="TeamDynamics Logo" width={28} height={28} className="object-cover scale-[1.15]" priority />
            </motion.div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-foreground">TeamDynamics</span>
              <span className="hidden sm:flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">Beta</span>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/docs">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground font-medium rounded-lg">
                Docs
              </Button>
            </Link>
            <Link href="https://github.com/bagusardin25/TeamDynamics" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hidden sm:flex border border-border/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                <span className="sr-only">GitHub Repository</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={mounted ? (isDark ? 'Switch to light theme' : 'Switch to dark theme') : 'Toggle theme'}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{mounted ? (isDark ? 'Switch to light theme' : 'Switch to dark theme') : 'Toggle theme'}</span>
            </Button>
            {user ? (
              <Link href="/dashboard">
                <Button size="sm" className="shadow-sm rounded-lg font-semibold px-5">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground font-medium rounded-lg">
                    <LogIn className="w-4 h-4 mr-1.5" /> Sign In
                  </Button>
                </Link>
                <Link href="/setup">
                  <Button size="sm" className="shadow-sm rounded-lg font-semibold px-5">
                    Start Simulation
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="z-10 flex flex-col items-center px-6 max-w-7xl mx-auto mt-24 md:mt-32 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 w-full items-center mb-24">
          
          {/* Left Column: Copy & CTAs */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium mb-8 shadow-sm transition-colors duration-300",
                isHighPressure ? "bg-orange-500/10 border-orange-500/20 text-orange-600" : "bg-secondary border-border text-foreground"
              )}
            >
              {isHighPressure ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Bot className="w-4 h-4 text-primary" />}
              <span>{isHighPressure ? "System Warning: Burnout Imminent" : "The AI-Powered Simulation Engine for Engineering Teams"}</span>
            </motion.div>

            <div className="relative mb-6 w-full">
              <motion.h1
                animate={isExtreme ? { x: [0, -1, 1, -1, 1, 0], transition: { repeat: Infinity, duration: 0.1 } } : {}}
                className={cn(
                  "text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter transition-all duration-500 leading-[0.95]",
                  isHighPressure ? "scale-[1.02]" : "scale-100"
                )}
              >
                What happens when you <br className="hidden md:block" />
                <span className={cn(
                  "text-transparent bg-clip-text bg-[linear-gradient(to_right,var(--color-primary),var(--color-primary)_60%)] transition-all duration-700",
                  getHeadlineColor()
                )}>
                  push them too hard?
                </span>
              </motion.h1>
              
              {/* Stress Particles */}
              <AnimatePresence>
                {isHighPressure && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-4 right-0 lg:-right-8"
                  >
                    <Zap className="w-8 h-8 text-orange-500 animate-bounce" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 font-medium leading-relaxed"
            >
              Simulate team dynamics, inject crises, and predict burnout before it costs you your best talent.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link href="/setup" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-8 text-base font-bold w-full shadow-xl shadow-primary/20 rounded-xl group hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Start Your Free Simulation 
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </motion.span>
                </Button>
              </Link>
              <Link href="/report?id=demo" className="w-full sm:w-auto">
                <Button size="lg" variant="ghost" className="h-14 px-8 text-base font-semibold w-full rounded-xl hover:bg-secondary/80 group border border-border/40">
                  <Zap className="mr-2 w-4 h-4 text-orange-500 group-hover:animate-pulse" />
                  View Interactive Demo Report
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Interactive Sandbox */}
          <div className="flex justify-center lg:justify-end w-full relative lg:-mt-16 xl:-mt-24">
            {/* Glowing backing for the sandbox to make it pop */}
            <div className={cn(
              "absolute inset-0 blur-[80px] rounded-full transition-colors duration-1000 opacity-20 -z-10",
              isHighPressure ? "bg-orange-500" : "bg-primary"
            )}></div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border/60 p-8 rounded-3xl shadow-2xl relative group hover:border-primary/20 transition-colors"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Pressure Simulator</span>
                <span className={cn(
                  "text-2xl font-black tabular-nums transition-colors",
                  isHighPressure ? "text-orange-500" : "text-primary"
                )}>
                  {pressureValue}%
                </span>
              </div>
              
              <Slider 
                value={pressure} 
                onValueChange={(val) => setPressure(val as number[])}
                max={100}
                step={1}
                className="mb-4"
              />
              
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter mb-5">
                <span>Chill</span>
                <span>Crunch</span>
                <span>Burnout</span>
              </div>

              {/* Reactive stats based on pressure */}
              <div className="flex justify-between gap-3">
                <div className={cn(
                  "flex-1 rounded-xl p-3 flex items-center gap-3 border transition-colors duration-300",
                  pressureValue > 70 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                )}>
                  <div className={cn("p-1.5 rounded-lg text-white", pressureValue > 70 ? "bg-red-500" : "bg-emerald-500")}>
                    <Users className="w-3 h-3" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">Morale</span>
                    <span className="text-sm font-black tabular-nums">{Math.max(0, Math.round(100 - (pressureValue * 0.8)))}%</span>
                  </div>
                </div>
                <div className={cn(
                  "flex-1 rounded-xl p-3 flex items-center gap-3 border transition-colors duration-300",
                  pressureValue >= 80 ? "bg-orange-500/10 border-orange-500/20" : "bg-blue-500/10 border-blue-500/20"
                )}>
                  <div className={cn("p-1.5 rounded-lg text-white", pressureValue >= 80 ? "bg-orange-500" : "bg-blue-500")}>
                    <Activity className="w-3 h-3" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">Output</span>
                    <span className="text-sm font-black tabular-nums">{Math.max(0, Math.round(pressureValue < 80 ? pressureValue + 20 : 40))}%</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        </div>

        {/* Feature Highlights - Enhanced Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 mb-20 w-full"
        >
          <FeatureCard 
            icon={<Users className="w-6 h-6" />}
            title="Assemble Personas"
            description="Design deep psychological profiles from empathy to raw ambition."
          />
          <FeatureCard 
            icon={<MessageSquare className="w-6 h-6" />}
            title="Live Drama"
            description="Watch internal thoughts vs. public Slack chats unfold in real-time."
            highlight
          />
          <FeatureCard 
            icon={<Activity className="w-6 h-6" />}
            title="Burnout Analysis"
            description="Predict exactly when your best talent will quit before they do."
          />
        </motion.div>
        {/* Agent Registry / Social Proof Section */}
        <section className="w-full mt-20 mb-32 relative">
          <div className="absolute inset-0 bg-secondary/30 rounded-3xl -z-10 blur-3xl"></div>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Meet Your Simulation Roster</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">These custom-trained AI Personas react to your management style, deadlines, and project scope based on real engineering archetypes.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AgentCard 
              name="Alex" 
              role="Sr. Engineer" 
              traits={["High Performer", "Cynical", "Flight Risk"]} 
              description="The 10x engineer who ships fast but complains endlessly about tech debt." 
            />
            <AgentCard 
              name="Jordan" 
              role="Product Manager" 
              traits={["Optimist", "Metrics-Driven", "Scope Creep"]} 
              description="Always trying to squeeze one more small feature into the sprint." 
            />
            <AgentCard 
              name="Taylor" 
              role="Junior Dev" 
              traits={["Eager", "Overwhelmed", "Fast Learner"]} 
              description="Enthusiastic but constantly blocked by obscure setup issues." 
            />
            <AgentCard 
              name="Morgan" 
              role="Tech Lead" 
              traits={["Protector", "Exhausted", "Wise"]} 
              description="Shields the team from upper management but is secretly burning out." 
            />
          </div>
        </section>

      </main>

      {/* Footer minimal */}
      <footer className="w-full py-12 border-t border-border/40 text-center text-muted-foreground text-sm font-medium">
        © 2026 TeamDynamics Simulation Engine. Built for High-Stakes Founders.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, highlight = false }: { icon: React.ReactNode, title: string, description: string, highlight?: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className={cn(
        "group p-8 rounded-3xl flex flex-col items-center text-center transition-all duration-300 border backdrop-blur-sm",
        highlight 
          ? "bg-primary/[0.03] border-primary/20 shadow-lg shadow-primary/5" 
          : "bg-card/40 border-border/60 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-inner",
        highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
      )}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-base leading-relaxed">{description}</p>
    </motion.div>
  );
}

function FloatingStat({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <motion.div 
      animate={{ x: [0, 5, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      className="bg-background/80 backdrop-blur-md border border-border/60 p-3 rounded-xl shadow-lg flex items-center gap-3 w-32"
    >
      <div className={cn("p-1.5 rounded-lg text-white", color)}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-bold uppercase text-muted-foreground">{label}</span>
        <span className="text-xs font-black tabular-nums">{Math.max(0, Math.round(value))}%</span>
      </div>
    </motion.div>
  );
}

function AgentCard({ name, role, traits, description }: { name: string, role: string, traits: string[], description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group flex flex-col bg-card/40 backdrop-blur-md border border-border/60 hover:border-primary/40 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="flex justify-between items-start mb-5">
        <div>
          <h4 className="text-lg font-black tracking-tight mb-1">{name}</h4>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">{role}</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-inner">
          <Bot className="w-5 h-5" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6 flex-grow leading-relaxed font-medium">
        {description}
      </p>
      <div className="flex flex-wrap gap-2 mt-auto">
        {traits.map(trait => (
          <span key={trait} className="px-2 py-1 rounded-md bg-secondary/50 border border-border text-[9px] font-bold uppercase tracking-wider text-muted-foreground w-max">
            {trait}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
