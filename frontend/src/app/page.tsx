"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bot, Users, Activity, MessageSquare, Zap, AlertTriangle, Sun, Moon, LogIn } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

export default function LandingPage() {
  const [pressure, setPressure] = useState([20]);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  // Dynamic styles based on pressure
  const pressureValue = pressure[0];
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
      <div className="absolute inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] opacity-50"></div>
      
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
              whileHover={{ rotate: 15 }}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Users className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <span className="font-bold text-xl tracking-tight text-foreground">TeamDynamics</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/docs">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-foreground font-medium rounded-lg">
                Docs
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
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
                    Launch App
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="z-10 flex flex-col items-center text-center px-6 max-w-5xl mt-32 md:mt-40">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium mb-10 shadow-xs transition-colors duration-300",
            isHighPressure ? "bg-orange-500/10 border-orange-500/20 text-orange-600" : "bg-secondary border-border text-foreground"
          )}
        >
          {isHighPressure ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Bot className="w-4 h-4 text-primary" />}
          <span>{isHighPressure ? "System Warning: Burnout Imminent" : "V1 Early Access Simulation Sandbox"}</span>
        </motion.div>

        <div className="relative mb-8">
          <motion.h1
            animate={isExtreme ? { x: [0, -1, 1, -1, 1, 0], transition: { repeat: Infinity, duration: 0.1 } } : {}}
            className={cn(
              "text-5xl md:text-8xl font-black tracking-tighter transition-all duration-500 leading-[0.95]",
              isHighPressure ? "scale-105" : "scale-100"
            )}
          >
            What happens when you <br className="hidden md:block" />
            <span className={cn(
              "text-transparent bg-clip-text bg-linear-to-r transition-all duration-700",
              getHeadlineColor()
            )}>
              push them too hard?
            </span>
          </motion.h1>
          
          {/* Stress Particles (only at high pressure) */}
          <AnimatePresence>
            {isHighPressure && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-4 -right-4"
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
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 font-medium leading-relaxed"
        >
          Inject a crisis, redefine culture, and watch your AI-driven team react in real-time. 
          Identify the exact breaking point of your startup before it happens in real life.
        </motion.p>

        {/* Interactive Stress Sandbox UI */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md bg-card/40 backdrop-blur-xl border border-border/60 p-8 rounded-3xl shadow-2xl mb-16 relative group"
        >
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Pressure Level Simulator</span>
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
          
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
            <span>Chill Culture</span>
            <span>Crunch Time</span>
            <span>Mass Resignation</span>
          </div>

          {/* Floating UI Elements based on pressure */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3">
             <FloatingStat icon={<Users className="w-3 h-3"/>} label="Morale" value={100 - (pressureValue * 0.8)} color="bg-emerald-500" />
             <FloatingStat icon={<Activity className="w-3 h-3"/>} label="Output" value={pressureValue < 80 ? pressureValue + 20 : 40} color="bg-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
        >
          <Link href="/setup">
            <Button size="lg" className="h-16 px-10 text-lg font-bold w-full sm:w-auto shadow-xl shadow-primary/20 rounded-2xl group hover:scale-[1.02] active:scale-[0.98] transition-all">
              Run First Simulation 
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <ArrowRight className="ml-2 w-6 h-6" />
              </motion.span>
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-semibold w-full sm:w-auto rounded-2xl border-border/60 hover:bg-secondary/50 backdrop-blur-sm">
              Explore Sandbox
            </Button>
          </Link>
        </motion.div>

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
