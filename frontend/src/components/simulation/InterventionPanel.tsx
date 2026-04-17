"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Send, Zap, Coffee, Terminal, Sparkles, Heart, CalendarPlus, ShieldAlert, ChevronRight } from "lucide-react";
import type { Metrics, WorldState } from "@/app/simulation/types";

interface InterventionPanelProps {
  status: string;
  onIntervene: (type: string, customMsg?: string) => void;
  metrics?: Metrics;
  worldState?: WorldState | null;
}

export function InterventionPanel({ status, onIntervene, metrics, worldState }: InterventionPanelProps) {
  const [customIntervention, setCustomIntervention] = useState("");

  const handleCustomIntervention = () => {
    if (!customIntervention.trim()) return;
    onIntervene("custom", customIntervention);
    setCustomIntervention("");
  };

  const suggestions = [];

  if (metrics && metrics.avgStress > 70) {
    suggestions.push({
      id: "wellness",
      label: "Wellness Day Off",
      icon: Heart,
      color: "text-rose-500",
      tooltip: "-15 Stress, small Productivity dip"
    });
  } else {
     suggestions.push({
      id: "pizza",
      label: "Pizza Party",
      icon: Coffee,
      color: "text-orange-400",
      tooltip: "+10 Morale, -5 Stress"
    });
  }

  if (metrics && metrics.avgMorale < 40) {
    suggestions.push({
      id: "bonus",
      label: "Emergency Bonus",
      icon: Zap,
      color: "text-amber-500",
      tooltip: "+20 Morale, heavily impacts Budget"
    });
  }

  if (worldState && worldState.deadlineWeeksLeft <= 2) {
    suggestions.push({
      id: "extend_deadline",
      label: "Extend Deadline",
      icon: CalendarPlus,
      color: "text-blue-500",
      tooltip: "Reduces Stress, but hurts Reputation"
    });
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-background via-background/90 to-transparent z-20">
      <div className="max-w-4xl mx-auto space-y-2">
        
        {/* Dynamic Context Suggestions */}
        {suggestions.length > 0 && status !== "completed" && (
           <div className="flex justify-center gap-2 mb-2">
             {suggestions.map(s => {
               const Icon = s.icon;
               return (
                  <TooltipProvider key={s.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          role="button"
                          tabIndex={0}
                          className="inline-flex items-center justify-center h-8 px-3 rounded-md text-[10px] uppercase tracking-wider font-semibold border border-primary/20 bg-card hover:bg-primary/10 shadow-sm transition-all cursor-pointer select-none"
                          onClick={() => onIntervene(s.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onIntervene(s.id); }}
                        >
                          <Icon className={`w-3 h-3 mr-1.5 ${s.color}`} />
                          {s.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{s.tooltip}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
               );
             })}
           </div>
        )}

        <Card className="shadow-2xl border-primary/30 bg-card/90 backdrop-blur-xl ring-1 ring-primary/10 overflow-hidden group focus-within:ring-primary/50 transition-all">
          <CardContent className="p-0">
            <div className="flex items-center">
              <div className="flex items-center gap-2 pl-4 pr-3 py-3 border-r border-border/50 bg-secondary/30 shrink-0">
                <Terminal className="w-4 h-4 text-primary" />
                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/20 text-[10px] uppercase tracking-widest font-bold">
                  God Mode
                </Badge>
              </div>

              <div className="flex-1 relative flex items-center bg-black/5 dark:bg-black/20">
                <ChevronRight className="w-4 h-4 text-primary/50 ml-3 shrink-0" />
                <Input
                  placeholder="Execute override command... (e.g. 'Cancel weekend work', 'Hire consultant')"
                  className="bg-transparent border-0 focus-visible:ring-0 shadow-none font-mono text-[13px] placeholder:text-muted-foreground/60 h-12 rounded-none px-3 text-primary"
                  value={customIntervention}
                  onChange={(e) => setCustomIntervention(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCustomIntervention();
                  }}
                  disabled={status === "completed"}
                />
                
                <Button
                  size="icon"
                  className="h-9 w-9 my-1.5 mr-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md transition-transform active:scale-95"
                  onClick={handleCustomIntervention}
                  disabled={status === "completed" || !customIntervention.trim()}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

