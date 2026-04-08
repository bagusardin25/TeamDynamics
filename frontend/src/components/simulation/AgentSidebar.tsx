"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Loader2, AlertTriangle } from "lucide-react";
import type { Agent } from "@/app/simulation/types";

interface AgentSidebarProps {
  agents: Agent[];
  connectionError: string | null;
}

export function AgentSidebar({ agents, connectionError }: AgentSidebarProps) {
  return (
    <aside className="w-[300px] border-r border-border bg-card/20 p-4 hidden md:flex flex-col shrink-0 overflow-y-auto custom-scroll">
      <div className="space-y-1 mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Active Agents
        </h2>
        <p className="text-xs text-muted-foreground">Live psychological state</p>
      </div>

      <div className="space-y-4 flex-1">
        {agents.map((agent) => (
          <Card key={agent.id} className={`bg-background/40 border-border/50 ${agent.has_resigned ? "opacity-50" : ""}`}>
            <CardContent className="p-4 flex gap-3">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {agent.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="font-medium text-sm leading-none">
                  {agent.name}
                  {agent.has_resigned && (
                    <Badge variant="outline" className="text-red-400 border-red-500/20 text-[9px] ml-2">
                      Resigned
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                    <span>Morale</span>
                    <span className={agent.morale < 40 ? "text-red-400" : ""}>{agent.morale}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${agent.morale < 40 ? "bg-red-500" : "bg-green-500"}`}
                      style={{ width: `${agent.morale}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                    <span>Stress</span>
                    <span className={agent.stress > 70 ? "text-orange-400" : ""}>{agent.stress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${agent.stress > 70 ? "bg-orange-500" : "bg-blue-500"}`}
                      style={{ width: `${agent.stress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {agents.length === 0 && (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            {connectionError ? (
              <div className="text-center space-y-2">
                <AlertTriangle className="w-5 h-5 text-orange-500 mx-auto" />
                <p className="text-xs text-orange-400">Connection lost</p>
              </div>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading agents...
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
