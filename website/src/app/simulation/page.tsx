"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Pause, FastForward, Activity, Users, Send, MessageSquare, Zap, Coffee, RefreshCcw, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Dummy data for visual design
const AGENTS = [
  { id: "1", name: "Alex (Tech Lead)", morale: 40, stress: 80, initials: "AX" },
  { id: "2", name: "Jordan (PM)", morale: 65, stress: 55, initials: "JO" },
  { id: "3", name: "Sam (Jr Dev)", morale: 30, stress: 90, initials: "SM" }
];

const MESSAGES = [
  { 
    id: 1, 
    agent: "Jordan (PM)", 
    type: "system", 
    content: "🚨 ANNOUNCEMENT: Due to the tight v2.0 deadline, weekend coding is now mandatory for all engineering staff until further notice." 
  },
  {
    id: 2,
    agent: "Alex (Tech Lead)",
    content: "Are you serious right now? We've been working 60-hour weeks for a month.",
    thought: "I can't believe management approved this. If I push my team harder, they're going to break. I should start updating my resume.",
    changes: { morale: -15, stress: +20 }
  },
  {
    id: 3,
    agent: "Sam (Jr Dev)",
    content: "I had a family trip planned this weekend... but I guess I can cancel it to help out.",
    thought: "I'm so exhausted, but I don't want to lose my first dev job. Just nod and agree.",
    changes: { morale: -25, stress: +30, loyalty: -10 }
  }
];

export default function SimulationPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [messages, setMessages] = useState<typeof MESSAGES>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fake message pop in for layout test
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < MESSAGES.length) {
        setMessages(prev => [...prev, MESSAGES[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      
      {/* Navbar area */}
      <header className="h-14 border-b border-border bg-card/40 flex items-center justify-between px-6 shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">Active Simulation</Badge>
          <span className="font-semibold text-sm text-muted-foreground mr-4">Project: Pied Piper v2.0 Crisis</span>
          <div className="h-4 w-px bg-border mx-2" />
          <span className="text-xs font-mono text-muted-foreground">Round 1 / 12</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Activity className="w-4 h-4" /></Button>
          <Link href="/report">
            <Button size="sm" variant="outline" className="h-8">End & View Report</Button>
          </Link>
        </div>
      </header>

      {/* Main 3 Column Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Agents State */}
        <aside className="w-[300px] border-r border-border bg-card/20 p-4 flex flex-col shrink-0 overflow-y-auto">
          <div className="space-y-1 mb-6">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Active Agents</h2>
            <p className="text-xs text-muted-foreground">Live psychological state</p>
          </div>
          
          <div className="space-y-4 flex-1">
            {AGENTS.map((agent) => (
              <Card key={agent.id} className="bg-background/40 border-border/50">
                <CardContent className="p-4 flex gap-3">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{agent.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="font-medium text-sm leading-none">{agent.name}</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                        <span>Morale</span>
                        <span className={agent.morale < 40 ? "text-red-400" : ""}>{agent.morale}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${agent.morale < 40 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${agent.morale}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                        <span>Stress</span>
                        <span className={agent.stress > 70 ? "text-orange-400" : ""}>{agent.stress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${agent.stress > 70 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${agent.stress}%` }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </aside>

        {/* Center Column: Simulated Slack */}
        <section className="flex-1 flex flex-col bg-background/50 relative">
          
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-6 max-w-3xl mx-auto pb-40">
              
              <div className="flex items-center justify-center my-6">
                <Badge variant="secondary" className="bg-card font-normal text-xs text-muted-foreground">Week 1 Started</Badge>
              </div>

              {messages.filter(msg => msg !== undefined).map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 group"
                >
                  {msg.type === 'system' ? (
                    <div className="w-full rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 flex gap-3 text-sm text-foreground my-2">
                       <Bell className="w-5 h-5 text-orange-500 shrink-0" />
                       <div className="pt-0.5 leading-relaxed font-medium">
                         {msg.content}
                       </div>
                    </div>
                  ) : (
                    <>
                      <Avatar className="h-9 w-9 mt-1 border border-border shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {msg.agent.substring(0,2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{msg.agent}</span>
                          <span className="text-xs text-muted-foreground">10:42 AM</span>
                        </div>
                        <div className="text-sm bg-card border border-border border-l-primary/30 border-l-4 rounded-r-lg p-3 inline-block shadow-sm">
                          {msg.content}
                        </div>
                        {msg.thought && (
                          <div className="pt-2">
                            <div className="text-xs italic text-muted-foreground bg-secondary/50 rounded-md p-2.5 inline-block border border-border/50">
                              <span className="font-semibold text-primary/70 mr-2 not-italic">Internal Thought:</span>
                              "{msg.thought}"
                            </div>
                            <div className="flex gap-2 mt-2">
                              {msg.changes?.morale && (
                                <Badge variant="outline" className={`text-[10px] ${msg.changes.morale < 0 ? 'text-red-400 border-red-500/20' : 'text-green-400 border-green-500/20'}`}>
                                  Morale {msg.changes.morale > 0 ? '+' : ''}{msg.changes.morale}
                                </Badge>
                              )}
                              {msg.changes?.stress && (
                                <Badge variant="outline" className={`text-[10px] ${msg.changes.stress > 0 ? 'text-orange-400 border-orange-500/20' : 'text-blue-400 border-blue-500/20'}`}>
                                  Stress +{msg.changes.stress}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
              
              {/* Fake typing indicator */}
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
            </div>
          </ScrollArea>

          {/* God Mode Interventions Panel (Sticky Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-background via-background to-transparent z-20">
            <Card className="max-w-3xl mx-auto shadow-2xl border-primary/20 bg-card/80 backdrop-blur-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/20 shrink-0 font-medium">✨ God Mode</Badge>
                  <div className="h-8 w-px bg-border mx-1 shrink-0" />
                  
                  {/* Quick Interventions */}
                  <div className="flex gap-2 shrink-0">
                    <Button size="icon" variant="outline" className="h-9 w-9 rounded-full hover:bg-secondary" title="Give Bonus"><Zap className="h-4 w-4 text-yellow-500" /></Button>
                    <Button size="icon" variant="outline" className="h-9 w-9 rounded-full hover:bg-secondary" title="Pizza Party"><Coffee className="h-4 w-4 text-orange-400" /></Button>
                  </div>
                  
                  <div className="flex-1 relative">
                    <Input 
                      placeholder="Type a custom intervention... (e.g. 'Cancel weekend work')" 
                      className="bg-background/50 border-border pr-10"
                    />
                    <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-7 w-7 text-primary hover:bg-primary/20 hover:text-primary">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Right Column: Dashboard & Controls (Hidden on small screens) */}
        <aside className="w-[300px] border-l border-border bg-card/20 p-4 shrink-0 hidden lg:flex flex-col overflow-y-auto">
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Metrics</h2>
            
            {/* Playback Controls */}
            <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 border border-border/50">
              <Button size="icon" variant="ghost" className={!isPlaying ? "h-6 w-6 rounded-md bg-background shadow-sm" : "h-6 w-6 rounded-md"} onClick={() => setIsPlaying(false)}>
                <Pause className="w-3 h-3 text-muted-foreground" />
              </Button>
              <Button size="icon" variant="ghost" className={isPlaying ? "h-6 w-6 rounded-md bg-background shadow-sm text-primary" : "h-6 w-6 rounded-md"} onClick={() => setIsPlaying(true)}>
                <Play className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md text-muted-foreground">
                <FastForward className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Mini Dashboard Cards */}
          <div className="space-y-4">
            <Card className="bg-background/40 border-border/50 shadow-sm">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/20">
                <CardTitle className="text-xs font-medium text-muted-foreground">Avg Company Morale</CardTitle>
                <Badge variant="outline" className="text-red-400 border-red-500/20 text-[10px]">-15%</Badge>
              </CardHeader>
              <CardContent className="p-4 pt-3 flex items-end gap-2">
                <span className="text-3xl font-bold tracking-tighter text-red-500">45<span className="text-lg text-muted-foreground font-normal">%</span></span>
              </CardContent>
            </Card>

            <Card className="bg-background/40 border-border/50 shadow-sm">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/20">
                <CardTitle className="text-xs font-medium text-muted-foreground">Productivity Level</CardTitle>
                <Badge variant="outline" className="text-green-400 border-green-500/20 text-[10px]">+5%</Badge>
              </CardHeader>
              <CardContent className="p-4 pt-3 flex items-end gap-2">
                <span className="text-3xl font-bold tracking-tighter text-green-500">82<span className="text-lg text-muted-foreground font-normal">%</span></span>
              </CardContent>
            </Card>
            
            <div className="pt-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Log</h3>
              <div className="space-y-4 border-l-2 border-border/50 ml-2 pl-4 py-1">
                <div className="relative">
                  <div className="absolute w-2 h-2 bg-orange-500 rounded-full -left-[21px] top-1.5 ring-4 ring-background" />
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Week 1 • Crisis Initiated</p>
                  <p className="text-sm">Mandatory Weekend Work</p>
                </div>
                <div className="relative opacity-60">
                  <div className="absolute w-2 h-2 bg-primary/40 rounded-full -left-[21px] top-1.5 ring-4 ring-background" />
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Initialization</p>
                  <p className="text-sm">Team Roster Loaded</p>
                </div>
              </div>
            </div>
          </div>
          
        </aside>

      </main>
    </div>
  );
}
