"use client";

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Pause, FastForward, Activity, Users, Send, Zap, Coffee, Bell, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = API_BASE.replace("http", "ws");

interface Agent {
  id: string;
  name: string;
  morale: number;
  stress: number;
  loyalty?: number;
  productivity?: number;
  initials: string;
  has_resigned?: boolean;
}

interface SimMessage {
  id: number;
  round?: number;
  agent?: string;
  agent_name?: string;
  agent_id?: string;
  type: string;
  content: string;
  thought?: string;
  state_changes?: {
    morale?: number;
    stress?: number;
    loyalty?: number;
    productivity?: number;
  };
  changes?: {
    morale?: number;
    stress?: number;
    loyalty?: number;
    productivity?: number;
  };
}

interface Metrics {
  avgMorale: number;
  avgStress: number;
  productivity: number;
  resignations: number;
}

function SimulationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const simId = searchParams.get("id");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ avgMorale: 70, avgStress: 30, productivity: 75, resignations: 0 });
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(12);
  const [status, setStatus] = useState("idle");
  const [companyName, setCompanyName] = useState("Simulation");
  const [isPlaying, setIsPlaying] = useState(true);
  const [customIntervention, setCustomIntervention] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const prevMetricsRef = useRef<Metrics | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const MAX_RECONNECT_ATTEMPTS = 3;

  // Compute metric change deltas
  const getMetricDelta = (key: keyof Metrics) => {
    if (!prevMetricsRef.current) return null;
    const diff = metrics[key] - prevMetricsRef.current[key];
    if (diff === 0) return null;
    return diff;
  };

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

  // WebSocket connection with reconnection logic
  useEffect(() => {
    if (!simId) return;

    let isCancelled = false;

    function connect() {
      if (isCancelled) return;

      const ws = new WebSocket(`${WS_BASE}/ws/simulation/${simId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsTyping(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);

        if (payload.type === "init") {
          setAgents(payload.agents || []);
          setMessages(payload.messages || []);
          setMetrics(payload.metrics || { avgMorale: 70, avgStress: 30, productivity: 75, resignations: 0 });
          setCurrentRound(payload.currentRound || 0);
          setTotalRounds(payload.totalRounds || 12);
          setStatus(payload.status || "idle");
          setCompanyName(payload.company?.name || "Simulation");
          setIsTyping(true);
        } else if (payload.type === "message") {
          const msg = payload.data;
          // Normalize the message format
          const normalizedMsg: SimMessage = {
            ...msg,
            agent: msg.agent_name || msg.agent,
            changes: msg.state_changes || msg.changes,
          };
          setMessages((prev) => [...prev, normalizedMsg]);

          if (payload.agents) setAgents(payload.agents);
          if (payload.metrics) {
            prevMetricsRef.current = metrics;
            setMetrics(payload.metrics);
          }
          if (payload.currentRound) setCurrentRound(payload.currentRound);
          if (payload.status) setStatus(payload.status);
          setIsTyping(true);
        } else if (payload.type === "completed") {
          setStatus("completed");
          setIsTyping(false);
          setIsPlaying(false);
        } else if (payload.type === "error") {
          setConnectionError(payload.message || "Simulation error");
          setIsTyping(false);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsTyping(false);

        // Don't reconnect if simulation completed, page unmounting, or server rejected
        if (isCancelled || status === "completed" || event.code === 1000) return;

        // Attempt reconnect with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 8000);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else {
          setConnectionError("Unable to connect to the simulation server. Please check that the backend is running and try again.");
        }
      };

      ws.onerror = () => {
        // onerror is always followed by onclose, so let onclose handle reconnection
        setIsConnected(false);
        setIsTyping(false);
      };
    }

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
      }
    };
  }, [simId]);

  // Send intervention via WebSocket
  const sendIntervention = useCallback((type: string, customMsg?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: "intervene",
      intervention_type: type,
      custom_message: customMsg,
    }));
  }, []);

  // Also send via REST as fallback
  const sendInterventionRest = useCallback(async (type: string, customMsg?: string) => {
    if (!simId) return;
    try {
      const res = await fetch(`${API_BASE}/api/simulation/${simId}/intervene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, custom_message: customMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.agents) setAgents(data.agents);
        if (data.metrics) {
          prevMetricsRef.current = metrics;
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.error("Intervention failed:", err);
    }
  }, [simId, metrics]);

  const handleIntervene = (type: string) => {
    sendIntervention(type);
    sendInterventionRest(type);
  };

  const handleCustomIntervention = () => {
    if (!customIntervention.trim()) return;
    sendIntervention("custom", customIntervention);
    sendInterventionRest("custom", customIntervention);
    setCustomIntervention("");
  };

  const moraleChange = getMetricDelta("avgMorale");
  const productivityChange = getMetricDelta("productivity");

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">

      {/* Navbar area */}
      <header className="h-14 border-b border-border bg-card/40 flex items-center justify-between px-6 shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`border-primary/30 bg-primary/10 ${status === 'completed' ? 'text-green-500 border-green-500/30 bg-green-500/10' : 'text-primary'}`}>
            {status === "completed" ? "Completed" : status === "running" ? "Active Simulation" : "Connecting..."}
          </Badge>
          <span className="font-semibold text-sm text-muted-foreground mr-4">Project: {companyName}</span>
          <div className="h-4 w-px bg-border mx-2" />
          <span className="text-xs font-mono text-muted-foreground">Round {currentRound} / {totalRounds}</span>
          {!isConnected && <Badge variant="outline" className="text-orange-400 border-orange-500/20 text-[10px] ml-2">Disconnected</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Activity className="w-4 h-4" /></Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => {
              if (status === "completed") {
                router.push(`/report?id=${simId}`);
              } else {
                setShowExitConfirm(true);
              }
            }}
          >
            End &amp; View Report
          </Button>
        </div>
      </header>

      {/* Main 3 Column Layout */}
      <main className="flex-1 flex overflow-hidden min-h-0">

        {/* Left Column: Agents State */}
        <aside className="w-[300px] border-r border-border bg-card/20 p-4 flex flex-col shrink-0 overflow-y-auto">
          <div className="space-y-1 mb-6">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Active Agents</h2>
            <p className="text-xs text-muted-foreground">Live psychological state</p>
          </div>

          <div className="space-y-4 flex-1">
            {agents.map((agent) => (
              <Card key={agent.id} className={`bg-background/40 border-border/50 ${agent.has_resigned ? 'opacity-50' : ''}`}>
                <CardContent className="p-4 flex gap-3">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{agent.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="font-medium text-sm leading-none">
                      {agent.name}
                      {agent.has_resigned && <Badge variant="outline" className="text-red-400 border-red-500/20 text-[9px] ml-2">Resigned</Badge>}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                        <span>Morale</span>
                        <span className={agent.morale < 40 ? "text-red-400" : ""}>{agent.morale}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${agent.morale < 40 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${agent.morale}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                        <span>Stress</span>
                        <span className={agent.stress > 70 ? "text-orange-400" : ""}>{agent.stress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${agent.stress > 70 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${agent.stress}%` }} />
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
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading agents...</>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Center Column: Simulated Slack */}
        <section className="flex-1 flex flex-col bg-background/50 relative min-h-0">

          {/* Messages Area */}
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
                    <p className="text-xs text-muted-foreground mt-1">The simulation may have expired or the server is unreachable.</p>
                  </div>
                  <Link href="/setup">
                    <Button size="sm" variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 shrink-0">
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
                // Week separator: show divider when round changes
                const prevRound = idx > 0 ? messages[idx - 1].round : null;
                const showWeekDivider = msg.round && msg.round !== prevRound;

                return (
                  <div key={msg.id}>
                    {showWeekDivider && (
                      <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-border/50" />
                        <Badge variant="secondary" className="bg-card font-medium text-xs text-muted-foreground px-3 py-1">
                          📅 Week {msg.round}
                        </Badge>
                        <div className="flex-1 h-px bg-border/50" />
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      layout={false}
                      className="flex gap-4 group w-full overflow-hidden"
                    >
                      {msg.type === 'system' ? (
                        <div className="w-full rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 flex gap-3 text-sm text-foreground my-2">
                          <Bell className="w-5 h-5 text-orange-500 shrink-0" />
                          <div className="pt-0.5 leading-relaxed font-medium">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4 w-full">
                          <Avatar className="h-9 w-9 mt-1 border border-border shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {(msg.agent || msg.agent_name || "??").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm truncate">{msg.agent || msg.agent_name}</span>
                            </div>
                            <div className="text-sm bg-card border border-border border-l-primary/30 border-l-4 rounded-r-lg p-3 shadow-sm">
                              {msg.content}
                            </div>
                            {msg.thought && (
                              <div className="pt-2">
                                <div className="text-xs italic text-muted-foreground bg-secondary/50 rounded-md p-2.5 border border-border/50">
                                  <span className="font-semibold text-primary/70 mr-2 not-italic">Internal Thought:</span>
                                  &quot;{msg.thought}&quot;
                                </div>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  {(msg.changes?.morale || msg.state_changes?.morale) && (
                                    <Badge variant="outline" className={`text-[10px] ${(msg.changes?.morale || msg.state_changes?.morale || 0) < 0 ? 'text-red-400 border-red-500/20' : 'text-green-400 border-green-500/20'}`}>
                                      Morale {(msg.changes?.morale || msg.state_changes?.morale || 0) > 0 ? '+' : ''}{msg.changes?.morale || msg.state_changes?.morale}
                                    </Badge>
                                  )}
                                  {(msg.changes?.stress || msg.state_changes?.stress) && (
                                    <Badge variant="outline" className={`text-[10px] ${(msg.changes?.stress || msg.state_changes?.stress || 0) > 0 ? 'text-orange-400 border-orange-500/20' : 'text-blue-400 border-blue-500/20'}`}>
                                      Stress {(msg.changes?.stress || msg.state_changes?.stress || 0) > 0 ? '+' : ''}{msg.changes?.stress || msg.state_changes?.stress}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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

          {/* God Mode Interventions Panel (Sticky Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-background via-background to-transparent z-20">
            <Card className="max-w-3xl mx-auto shadow-2xl border-primary/20 bg-card/80 backdrop-blur-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/20 shrink-0 font-medium">✨ God Mode</Badge>
                  <div className="h-8 w-px bg-border mx-1 shrink-0" />

                  {/* Quick Interventions */}
                  <TooltipProvider>
                    <div className="flex gap-2 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-full hover:bg-secondary"
                            onClick={() => handleIntervene("bonus")}
                            disabled={status === "completed"}
                          >
                            <Zap className="h-4 w-4 text-yellow-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Give Bonus (+15 Morale, -10 Stress)</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-full hover:bg-secondary"
                            onClick={() => handleIntervene("pizza")}
                            disabled={status === "completed"}
                          >
                            <Coffee className="h-4 w-4 text-orange-400" />
                          </Button>
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
                      onKeyDown={(e) => { if (e.key === "Enter") handleCustomIntervention(); }}
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
        </section>

        {/* Right Column: Dashboard & Controls */}
        <aside className="w-[300px] border-l border-border bg-card/20 p-4 shrink-0 hidden lg:flex flex-col overflow-y-auto">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Metrics</h2>
          </div>

          {/* Mini Dashboard Cards */}
          <div className="space-y-4">
            <Card className="bg-background/40 border-border/50 shadow-sm">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/20">
                <CardTitle className="text-xs font-medium text-muted-foreground">Avg Company Morale</CardTitle>
                {moraleChange !== null && (
                  <Badge variant="outline" className={`text-[10px] ${moraleChange < 0 ? 'text-red-400 border-red-500/20' : 'text-green-400 border-green-500/20'}`}>
                    {moraleChange > 0 ? '+' : ''}{moraleChange}%
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-3 flex items-end gap-2">
                <span className={`text-3xl font-bold tracking-tighter ${metrics.avgMorale < 40 ? 'text-red-500' : metrics.avgMorale < 60 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {metrics.avgMorale}<span className="text-lg text-muted-foreground font-normal">%</span>
                </span>
              </CardContent>
            </Card>

            <Card className="bg-background/40 border-border/50 shadow-sm">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/20">
                <CardTitle className="text-xs font-medium text-muted-foreground">Productivity Level</CardTitle>
                {productivityChange !== null && (
                  <Badge variant="outline" className={`text-[10px] ${productivityChange < 0 ? 'text-red-400 border-red-500/20' : 'text-green-400 border-green-500/20'}`}>
                    {productivityChange > 0 ? '+' : ''}{productivityChange}%
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-3 flex items-end gap-2">
                <span className={`text-3xl font-bold tracking-tighter ${metrics.productivity < 40 ? 'text-red-500' : metrics.productivity < 60 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {metrics.productivity}<span className="text-lg text-muted-foreground font-normal">%</span>
                </span>
              </CardContent>
            </Card>

            <Card className="bg-background/40 border-border/50 shadow-sm">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/20">
                <CardTitle className="text-xs font-medium text-muted-foreground">Avg Stress Level</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-3 flex items-end gap-2">
                <span className={`text-3xl font-bold tracking-tighter ${metrics.avgStress > 70 ? 'text-red-500' : metrics.avgStress > 50 ? 'text-orange-500' : 'text-blue-500'}`}>
                  {metrics.avgStress}<span className="text-lg text-muted-foreground font-normal">%</span>
                </span>
              </CardContent>
            </Card>

            {metrics.resignations > 0 && (
              <Card className="bg-red-500/5 border-red-500/20 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Resignations</div>
                    <div className="text-2xl font-bold text-red-500">{metrics.resignations}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="pt-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</h3>
              <div className="space-y-4 border-l-2 border-border/50 ml-2 pl-4 py-1">
                <div className="relative">
                  <div className={`absolute w-2 h-2 rounded-full -left-[21px] top-1.5 ring-4 ring-background ${status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">
                    {status === 'completed' ? 'Completed' : `Week ${currentRound} • In Progress`}
                  </p>
                  <p className="text-sm">{status === 'completed' ? 'All rounds finished' : 'Simulation running'}</p>
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

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">End Simulation?</h3>
                <p className="text-sm text-muted-foreground">The simulation is still running at Week {currentRound}/{totalRounds}.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Ending now will generate a report based on the data collected so far. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowExitConfirm(false)}
              >
                Continue Simulation
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowExitConfirm(false);
                  router.push(`/report?id=${simId}`);
                }}
              >
                End &amp; View Report
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function SimulationPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SimulationContent />
    </Suspense>
  );
}
