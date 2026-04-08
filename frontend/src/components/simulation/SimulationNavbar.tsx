"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Volume2, VolumeX } from "lucide-react";

interface SimulationNavbarProps {
  status: string;
  companyName: string;
  currentRound: number;
  totalRounds: number;
  isConnected: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onEndSimulation: () => void;
}

export function SimulationNavbar({
  status,
  companyName,
  currentRound,
  totalRounds,
  isConnected,
  soundEnabled,
  onToggleSound,
  onEndSimulation,
}: SimulationNavbarProps) {
  return (
    <header className="h-14 border-b border-border bg-card/40 flex items-center justify-between px-6 shrink-0 z-10 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={`border-primary/30 bg-primary/10 ${status === "completed" ? "text-green-500 border-green-500/30 bg-green-500/10" : "text-primary"}`}
        >
          {status === "completed" ? "Completed" : status === "running" ? "Active Simulation" : "Connecting..."}
        </Badge>
        <span className="font-semibold text-sm text-muted-foreground mr-4">
          Project: {companyName}
        </span>
        <div className="h-4 w-px bg-border mx-2" />
        <span className="text-xs font-mono text-muted-foreground">
          Round {currentRound} / {totalRounds}
        </span>
        {!isConnected && (
          <Badge variant="outline" className="text-orange-400 border-orange-500/20 text-[10px] ml-2">
            Disconnected
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              className={`inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground ${soundEnabled ? "text-primary" : "text-muted-foreground"}`}
              onClick={onToggleSound}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </TooltipTrigger>
            <TooltipContent>{soundEnabled ? "Mute sounds" : "Enable sounds"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button size="sm" variant="outline" className="h-8" onClick={onEndSimulation}>
          End &amp; View Report
        </Button>
      </div>
    </header>
  );
}
