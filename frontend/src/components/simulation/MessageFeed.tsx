"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { MessageBubble } from "./MessageBubble";
import type { SimMessage } from "@/app/simulation/types";

interface MessageFeedProps {
  messages: SimMessage[];
  status: string;
  isTyping: boolean;
  typingAgent: string | null;
  connectionError: string | null;
  simId: string | null;
}

const THINKING_PHRASES = [
  "is thinking...",
  "is formulating a response...",
  "is considering the situation...",
  "is composing a message...",
  "is reflecting...",
];

export function MessageFeed({ messages, status, isTyping, typingAgent, connectionError, simId }: MessageFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    }
  }, [messages, isTyping]);

  // Rotate thinking phrases
  useEffect(() => {
    if (!isTyping || status === "completed") return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % THINKING_PHRASES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isTyping, status]);

  return (
    <div className="flex-1 overflow-y-auto p-6 min-h-0 custom-scroll" ref={scrollRef}>
      <div className="space-y-6 max-w-3xl mx-auto pb-40">
        {connectionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3 text-sm text-foreground my-4"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-400">{connectionError}</p>
              <p className="text-xs text-muted-foreground mt-1">
                The simulation may have expired or the server is unreachable.
              </p>
            </div>
            <Link href="/setup">
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 shrink-0"
              >
                New Simulation
              </Button>
            </Link>
          </motion.div>
        )}

        <div className="flex items-center justify-center my-6">
          <Badge variant="secondary" className="bg-card font-normal text-xs text-muted-foreground">
            Simulation Started
          </Badge>
        </div>

        {messages.map((msg, idx) => {
          const prevRound = idx > 0 ? messages[idx - 1].round : null;
          const showWeekDivider = msg.round && msg.round !== prevRound;

          return (
            <div key={msg.id}>
              {showWeekDivider && (
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-border/50" />
                  <Badge
                    variant="secondary"
                    className="bg-card font-medium text-xs text-muted-foreground px-3 py-1"
                  >
                    📅 Week {msg.round}
                  </Badge>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                layout={false}
                className="flex gap-4 group w-full overflow-hidden"
              >
                <MessageBubble
                  msg={msg}
                  isLatest={idx === messages.length - 1}
                  isRunning={status === "running"}
                />
              </motion.div>
            </div>
          );
        })}

        {/* Enhanced Typing Indicator */}
        <AnimatePresence>
          {isTyping && status !== "completed" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex gap-4"
            >
              {/* Avatar placeholder with pulse */}
              <div className="relative shrink-0">
                <motion.div
                  className="absolute -inset-1 rounded-full bg-primary/20"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center relative">
                  <span className="text-primary text-xs font-bold">
                    {typingAgent ? typingAgent.substring(0, 2).toUpperCase() : "AI"}
                  </span>
                </div>
              </div>

              {/* Typing card with shimmer */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <motion.div
                  key={typingAgent || "generic"}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm font-semibold text-muted-foreground"
                >
                  {typingAgent || "Agent"}
                </motion.div>
                <div className="relative overflow-hidden bg-card border border-border border-l-primary/30 border-l-4 rounded-r-lg p-3 shadow-sm max-w-xs">
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 shimmer-effect" />

                  <div className="flex items-center gap-2 relative z-10">
                    {/* Bouncing dots */}
                    <div className="flex gap-1 items-center">
                      <motion.span
                        className="w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, delay: 0.15 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, delay: 0.3 }}
                      />
                    </div>
                    {/* Rotating phrase */}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={phraseIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-muted-foreground italic"
                      >
                        {THINKING_PHRASES[phraseIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {status === "completed" && (
          <div className="flex items-center justify-center my-6">
            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none font-medium">
              ✅ Simulation Completed — All Rounds Finished
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
