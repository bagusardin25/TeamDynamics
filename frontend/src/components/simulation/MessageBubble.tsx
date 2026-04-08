"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import type { SimMessage } from "@/app/simulation/types";

interface MessageBubbleProps {
  msg: SimMessage;
  isLatest: boolean;
  isRunning: boolean;
}

export function MessageBubble({ msg, isLatest, isRunning }: MessageBubbleProps) {
  if (msg.type === "system") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 flex gap-3 text-sm text-foreground my-2"
      >
        <Bell className="w-5 h-5 text-orange-500 shrink-0" />
        <div className="pt-0.5 leading-relaxed font-medium">{msg.content}</div>
      </motion.div>
    );
  }

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
        </div>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-sm bg-card border border-border border-l-primary/30 border-l-4 rounded-r-lg p-3 shadow-sm"
        >
          {msg.content}
        </motion.div>
        {msg.thought && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="pt-2 overflow-hidden"
          >
            <div className="text-xs italic text-muted-foreground bg-secondary/50 rounded-md p-2.5 border border-border/50">
              <span className="font-semibold text-primary/70 mr-2 not-italic">Internal Thought:</span>
              &quot;{msg.thought}&quot;
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {(msg.changes?.morale || msg.state_changes?.morale) && (
                <Badge
                  variant="outline"
                  className={`text-[10px] ${(msg.changes?.morale || msg.state_changes?.morale || 0) < 0 ? "text-red-400 border-red-500/20" : "text-green-400 border-green-500/20"}`}
                >
                  Morale {(msg.changes?.morale || msg.state_changes?.morale || 0) > 0 ? "+" : ""}
                  {msg.changes?.morale || msg.state_changes?.morale}
                </Badge>
              )}
              {(msg.changes?.stress || msg.state_changes?.stress) && (
                <Badge
                  variant="outline"
                  className={`text-[10px] ${(msg.changes?.stress || msg.state_changes?.stress || 0) > 0 ? "text-orange-400 border-orange-500/20" : "text-blue-400 border-blue-500/20"}`}
                >
                  Stress {(msg.changes?.stress || msg.state_changes?.stress || 0) > 0 ? "+" : ""}
                  {msg.changes?.stress || msg.state_changes?.stress}
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
