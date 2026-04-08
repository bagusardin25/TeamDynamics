"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
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
  connectionError: string | null;
  simId: string | null;
}

export function MessageFeed({ messages, status, isTyping, connectionError, simId }: MessageFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [messages]);

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

        {/* Typing indicator */}
        {isTyping && status !== "completed" && (
          <div className="flex gap-4 opacity-50">
            <div className="h-9 w-9 rounded-full bg-secondary animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

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
