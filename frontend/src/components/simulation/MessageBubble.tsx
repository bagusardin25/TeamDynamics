"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Volume2, Brain, TrendingUp, TrendingDown, Activity, Zap, Sparkles, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SimMessage } from "@/app/simulation/types";

interface MessageBubbleProps {
  msg: SimMessage;
  isLatest: boolean;
  isRunning: boolean;
}

export function MessageBubble({ msg, isLatest, isRunning }: MessageBubbleProps) {
  if (msg.type === "system") {
    const isOutcome = msg.content.includes("SIMULATION OUTCOME:");
    const isDecision = msg.content.includes("TEAM DECISION REACHED:");

    if (isOutcome) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 90 }}
          className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/15 via-card to-orange-500/10 border-2 border-amber-500/40 p-6 shadow-xl shadow-amber-500/10 my-6"
        >
          {/* Decorative glowing orb behind */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start gap-4 relative z-10">
             <div className="p-3 rounded-2xl bg-amber-500/20 shrink-0 shadow-inner ring-1 ring-amber-500/30">
               <Award className="w-8 h-8 text-amber-500 drop-shadow-sm" />
             </div>
             
             <div className="pt-1">
               <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                 Simulation Outcome
               </h3>
               <div className="leading-relaxed font-semibold text-foreground/90 whitespace-pre-line text-[15px]">
                 {msg.content.replace("SIMULATION OUTCOME:", "").trim()}
               </div>
             </div>
          </div>
        </motion.div>
      );
    }

    if (isDecision) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/30 p-4 shadow-sm my-3 flex items-start gap-4"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
          <div className="p-2 rounded-xl bg-emerald-500/20 shrink-0">
             <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="pt-0.5">
            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Team Decision</h4>
            <div className="leading-relaxed font-medium text-foreground/90">{msg.content.replace("TEAM DECISION REACHED:", "").trim()}</div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-4 shadow-sm my-3 flex items-start gap-4 hover:shadow-md transition-shadow"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/80" />
        <div className="p-2 rounded-xl bg-indigo-500/10 shrink-0 shadow-inner">
           <Zap className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="pt-0.5 flex-1 text-sm">
          <h4 className="text-xs font-bold text-indigo-500/80 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> System Update
          </h4>
          <div className="leading-relaxed font-medium text-foreground/80">{msg.content}</div>
        </div>
      </motion.div>
    );
  }
  const playVoice = (text: string, stressDelta: number = 0) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Hackathon Gamification: Change voice properties under stress!
      const isHighlyStressed = stressDelta >= 5;
      utterance.pitch = isHighlyStressed ? 0.6 : 1.0; // Voice drop
      utterance.rate = isHighlyStressed ? 1.2 : 1.0;  // Speak faster
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex gap-4 w-full">
      <div className="relative shrink-0">
        {isLatest && isRunning && (
          <motion.div
            className="absolute -inset-1 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <Avatar className="h-9 w-9 mt-1 border border-border relative">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
            {(msg.agent || msg.agent_name || "??").substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{msg.agent || msg.agent_name}</span>
          <Button 
             variant="ghost" 
             size="icon" 
             className="h-5 w-5 ml-1 bg-transparent hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-full transition-colors"
             onClick={() => playVoice(msg.content, msg.changes?.stress || msg.state_changes?.stress || 0)}
             title="Listen In"
          >
             <Volume2 className="h-3 w-3" />
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -8, y: 5 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          className="text-sm bg-card border border-border/60 rounded-2xl rounded-tl-sm p-4 shadow-sm hover:shadow-md transition-shadow group-hover:border-primary/20 relative"
        >
          <div className="leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {msg.content}
          </div>
          
          {msg.thought && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-4 pt-4 border-t border-border/50 space-y-3 overflow-hidden"
            >
              <div className="flex gap-2.5 text-xs text-muted-foreground items-start bg-secondary/40 p-3 rounded-xl border border-border/30">
                <Brain className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                <span className="italic leading-relaxed flex-1">&quot;{msg.thought}&quot;</span>
              </div>
              
              {/* Impact Indicators */}
              {(msg.changes?.morale !== undefined || msg.state_changes?.morale !== undefined || msg.changes?.stress !== undefined || msg.state_changes?.stress !== undefined) && (
                (() => {
                  const mDelta = msg.changes?.morale ?? msg.state_changes?.morale ?? 0;
                  const sDelta = msg.changes?.stress ?? msg.state_changes?.stress ?? 0;
                  
                  if (mDelta === 0 && sDelta === 0) return null;
                  
                  return (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {mDelta !== 0 && (
                        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border ${mDelta > 0 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400'}`}>
                          {mDelta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>Morale {mDelta > 0 ? '+' : ''}{mDelta}</span>
                        </div>
                      )}
                      {sDelta !== 0 && (
                        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border ${sDelta > 0 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'}`}>
                          {sDelta > 0 ? <Activity className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>Stress {sDelta > 0 ? '+' : ''}{sDelta}</span>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
