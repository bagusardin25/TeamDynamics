"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ChevronDown, ChevronUp } from "lucide-react";
import type { Agent } from "@/app/simulation/types";

interface MobileAgentBarProps {
  agents: Agent[];
}

export function MobileAgentBar({ agents }: MobileAgentBarProps) {
  const [showMobileAgents, setShowMobileAgents] = useState(false);

  return (
    <div className="md:hidden border-b border-border bg-card/30 shrink-0">
      <button
        onClick={() => setShowMobileAgents(!showMobileAgents)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="font-medium">Agents</span>
          <div className="flex -space-x-2">
            {agents.map((agent) => (
              <Avatar key={agent.id} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                  {agent.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
        {showMobileAgents ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {showMobileAgents && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-t border-border/50"
        >
          <div className="p-3 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scroll">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`flex items-center gap-2 p-2 rounded-lg bg-background/40 border border-border/50 ${agent.has_resigned ? "opacity-50" : ""}`}
              >
                <Avatar className="h-7 w-7 border border-border shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                    {agent.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{agent.name}</div>
                  <div className="flex gap-2 text-[9px] text-muted-foreground">
                    <span className={agent.morale < 40 ? "text-red-400" : "text-green-400"}>
                      M:{agent.morale}%
                    </span>
                    <span className={agent.stress > 70 ? "text-orange-400" : "text-blue-400"}>
                      S:{agent.stress}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
