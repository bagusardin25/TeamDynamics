"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Agent,
  SimMessage,
  Metrics,
  DEFAULT_METRICS,
  API_BASE,
  MetricsSnapshot,
} from "@/app/simulation/types";

interface ReplayRound {
  round: number;
  messages: SimMessage[];
  metrics?: Record<string, number> | null;
}

interface ReplayData {
  simulation_id: string;
  company: { name: string; culture: string };
  crisis_scenario: string;
  crisis_description: string;
  total_rounds: number;
  agents: Array<{
    id: string;
    name: string;
    role: string;
    type: string;
    color?: string;
    final_state: { morale: number; stress: number; loyalty: number; productivity: number };
    has_resigned: boolean;
    resigned_week?: number;
  }>;
  rounds: ReplayRound[];
  metrics_history: MetricsSnapshot[];
  report_summary?: string;
}

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

interface UseReplayEngineReturn {
  // State (same shape as useSimulationSocket for component reuse)
  agents: Agent[];
  messages: SimMessage[];
  metrics: Metrics;
  prevMetrics: Metrics | null;
  currentRound: number;
  totalRounds: number;
  status: string;
  companyName: string;
  metricsHistory: MetricsSnapshot[];

  // Replay-specific
  isPlaying: boolean;
  speed: PlaybackSpeed;
  isLoading: boolean;
  error: string | null;
  progress: number; // 0-100
  totalMessages: number;
  currentMessageIndex: number;

  // Controls
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  seekToRound: (round: number) => void;
  seekToStart: () => void;
  seekToEnd: () => void;
  stepForward: () => void;
}

export function useReplayEngine(simId: string | null): UseReplayEngineReturn {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(DEFAULT_METRICS);
  const [prevMetrics, setPrevMetrics] = useState<Metrics | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(12);
  const [companyName, setCompanyName] = useState("Simulation");
  const [metricsHistory, setMetricsHistory] = useState<MetricsSnapshot[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Ref for replay data
  const dataRef = useRef<ReplayData | null>(null);
  const allMessagesRef = useRef<SimMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(speed);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Fetch replay data
  useEffect(() => {
    if (!simId) return;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/simulation/${simId}/replay`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Failed to load replay (${res.status})`);
        }
        const data: ReplayData = await res.json();
        dataRef.current = data;

        // Set initial state
        setCompanyName(data.company.name);
        setTotalRounds(data.total_rounds);
        setMetricsHistory(data.metrics_history || []);

        // Build initial agents (starting state: default values before simulation ran)
        const initialAgents: Agent[] = data.agents.map((a) => ({
          id: a.id,
          name: `${a.name} (${a.role})`,
          morale: 70,
          stress: 30,
          loyalty: 70,
          productivity: 75,
          initials: a.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase(),
          has_resigned: false,
        }));
        setAgents(initialAgents);

        // Flatten all messages in order
        const flat: SimMessage[] = [];
        for (const round of data.rounds) {
          for (const msg of round.messages) {
            flat.push({
              ...msg,
              agent: msg.agent_name,
              changes: msg.state_changes,
            });
          }
        }
        allMessagesRef.current = flat;

        setIsLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load replay");
        setIsLoading(false);
      }
    }

    fetchData();
  }, [simId]);

  // Update agent states based on cumulative state_changes up to current index
  const updateAgentStatesForIndex = useCallback((idx: number) => {
    const data = dataRef.current;
    if (!data) return;

    // Start from defaults and apply all changes up to idx
    const agentStates: Record<string, { morale: number; stress: number; loyalty: number; productivity: number; has_resigned: boolean }> = {};
    for (const a of data.agents) {
      agentStates[a.id] = { morale: 70, stress: 30, loyalty: 70, productivity: 75, has_resigned: false };
    }

    const msgs = allMessagesRef.current;
    for (let i = 0; i <= idx && i < msgs.length; i++) {
      const msg = msgs[i];
      if (msg.agent_id && msg.state_changes) {
        const s = agentStates[msg.agent_id];
        if (s) {
          if (msg.state_changes.morale !== undefined) s.morale = Math.max(0, Math.min(100, s.morale + msg.state_changes.morale));
          if (msg.state_changes.stress !== undefined) s.stress = Math.max(0, Math.min(100, s.stress + msg.state_changes.stress));
          if (msg.state_changes.loyalty !== undefined) s.loyalty = Math.max(0, Math.min(100, s.loyalty + msg.state_changes.loyalty));
          if (msg.state_changes.productivity !== undefined) s.productivity = Math.max(0, Math.min(100, s.productivity + msg.state_changes.productivity));
        }
      }
    }

    setAgents(data.agents.map((a) => ({
      id: a.id,
      name: `${a.name} (${a.role})`,
      morale: agentStates[a.id]?.morale ?? 70,
      stress: agentStates[a.id]?.stress ?? 30,
      loyalty: agentStates[a.id]?.loyalty ?? 70,
      productivity: agentStates[a.id]?.productivity ?? 75,
      initials: a.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase(),
      has_resigned: agentStates[a.id]?.has_resigned ?? false,
    })));
  }, []);

  // Update metrics for a given round
  const updateMetricsForRound = useCallback((round: number) => {
    const data = dataRef.current;
    if (!data) return;

    const history = data.metrics_history || [];
    const snap = history.find((h) => h.round === round) || history.find((h) => h.round <= round);

    if (snap) {
      setPrevMetrics(metrics);
      setMetrics({
        avgMorale: snap.morale ?? 70,
        avgStress: snap.stress ?? 30,
        productivity: snap.productivity ?? 75,
        resignations: 0,
        avgLoyalty: snap.loyalty ?? 70,
        teamCohesion: snap.cohesion ?? 70,
      });
    }
  }, [metrics]);

  // Play next message
  const playNextMessage = useCallback(() => {
    const msgs = allMessagesRef.current;
    const idx = currentIndexRef.current;

    if (idx >= msgs.length) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    const msg = msgs[idx];
    setMessages((prev) => [...prev, msg]);
    setCurrentMessageIndex(idx);
    currentIndexRef.current = idx + 1;

    // Update round
    if (msg.round !== undefined) {
      setCurrentRound(msg.round);
      updateMetricsForRound(msg.round);
    }

    // Update agent states
    updateAgentStatesForIndex(idx);

    // Schedule next message
    if (isPlayingRef.current && idx + 1 < msgs.length) {
      const baseDelay = msg.type === "system" ? 1500 : 2000;
      const delay = baseDelay / speedRef.current;
      timerRef.current = setTimeout(playNextMessage, delay);
    } else if (idx + 1 >= msgs.length) {
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, [updateAgentStatesForIndex, updateMetricsForRound]);

  // Controls
  const play = useCallback(() => {
    if (currentIndexRef.current >= allMessagesRef.current.length) return;
    setIsPlaying(true);
    isPlayingRef.current = true;
    playNextMessage();
  }, [playNextMessage]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const seekToRound = useCallback((round: number) => {
    pause();
    const msgs = allMessagesRef.current;

    // Find the index of the first message AFTER the given round
    let targetIdx = 0;
    for (let i = 0; i < msgs.length; i++) {
      if ((msgs[i].round ?? 0) <= round) {
        targetIdx = i + 1;
      }
    }

    // Show all messages up to target
    setMessages(msgs.slice(0, targetIdx));
    currentIndexRef.current = targetIdx;
    setCurrentMessageIndex(Math.max(0, targetIdx - 1));
    setCurrentRound(round);
    updateAgentStatesForIndex(Math.max(0, targetIdx - 1));
    updateMetricsForRound(round);
  }, [pause, updateAgentStatesForIndex, updateMetricsForRound]);

  const seekToStart = useCallback(() => {
    pause();
    setMessages([]);
    currentIndexRef.current = 0;
    setCurrentMessageIndex(0);
    setCurrentRound(0);
    setMetrics(DEFAULT_METRICS);
    setPrevMetrics(null);
    if (dataRef.current) {
      setAgents(dataRef.current.agents.map((a) => ({
        id: a.id,
        name: `${a.name} (${a.role})`,
        morale: 70,
        stress: 30,
        loyalty: 70,
        productivity: 75,
        initials: a.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase(),
        has_resigned: false,
      })));
    }
  }, [pause]);

  const seekToEnd = useCallback(() => {
    pause();
    const data = dataRef.current;
    const msgs = allMessagesRef.current;
    if (!data || msgs.length === 0) return;

    setMessages([...msgs]);
    currentIndexRef.current = msgs.length;
    setCurrentMessageIndex(msgs.length - 1);
    setCurrentRound(data.total_rounds);
    updateAgentStatesForIndex(msgs.length - 1);
    updateMetricsForRound(data.total_rounds);
  }, [pause, updateAgentStatesForIndex, updateMetricsForRound]);

  const stepForward = useCallback(() => {
    pause();
    const msgs = allMessagesRef.current;
    const idx = currentIndexRef.current;
    if (idx >= msgs.length) return;

    const msg = msgs[idx];
    setMessages((prev) => [...prev, msg]);
    currentIndexRef.current = idx + 1;
    setCurrentMessageIndex(idx);
    if (msg.round !== undefined) {
      setCurrentRound(msg.round);
      updateMetricsForRound(msg.round);
    }
    updateAgentStatesForIndex(idx);
  }, [pause, updateAgentStatesForIndex, updateMetricsForRound]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const totalMessages = allMessagesRef.current.length;
  const progress = totalMessages > 0 ? (currentMessageIndex / (totalMessages - 1)) * 100 : 0;

  return {
    agents,
    messages,
    metrics,
    prevMetrics,
    currentRound,
    totalRounds,
    status: "completed",
    companyName,
    metricsHistory,

    isPlaying,
    speed,
    isLoading,
    error,
    progress: isNaN(progress) ? 0 : progress,
    totalMessages,
    currentMessageIndex,

    play,
    pause,
    togglePlayPause,
    setSpeed,
    seekToRound,
    seekToStart,
    seekToEnd,
    stepForward,
  };
}
