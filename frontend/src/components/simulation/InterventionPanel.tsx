"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Send, Zap, Coffee } from "lucide-react";

interface InterventionPanelProps {
  status: string;
  onIntervene: (type: string, customMsg?: string) => void;
}

export function InterventionPanel({ status, onIntervene }: InterventionPanelProps) {
  const [customIntervention, setCustomIntervention] = useState("");

  const handleCustomIntervention = () => {
    if (!customIntervention.trim()) return;
    onIntervene("custom", customIntervention);
    setCustomIntervention("");
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-background via-background to-transparent z-20">
      <Card className="max-w-3xl mx-auto shadow-2xl border-primary/20 bg-card/80 backdrop-blur-lg">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/20 shrink-0 font-medium">
              ✨ God Mode
            </Badge>
            <div className="h-8 w-px bg-border mx-1 shrink-0" />

            {/* Quick Interventions */}
            <TooltipProvider>
              <div className="flex gap-2 shrink-0">
                <Tooltip>
                  <TooltipTrigger
                    className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-border hover:bg-secondary disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => onIntervene("bonus")}
                    disabled={status === "completed"}
                  >
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </TooltipTrigger>
                  <TooltipContent>Give Bonus (+15 Morale, -10 Stress)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-border hover:bg-secondary disabled:opacity-50 disabled:pointer-events-none"
                    onClick={() => onIntervene("pizza")}
                    disabled={status === "completed"}
                  >
                    <Coffee className="h-4 w-4 text-orange-400" />
                  </TooltipTrigger>
                  <TooltipContent>Pizza Party (+10 Morale, -5 Stress)</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <div className="flex-1 relative">
              <Input
                placeholder="Type a custom intervention... (e.g. 'Cancel weekend work')"
                className="bg-background/50 border-border pr-10"
                value={customIntervention}
                onChange={(e) => setCustomIntervention(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCustomIntervention();
                }}
                disabled={status === "completed"}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1 h-7 w-7 text-primary hover:bg-primary/20 hover:text-primary"
                onClick={handleCustomIntervention}
                disabled={status === "completed"}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

