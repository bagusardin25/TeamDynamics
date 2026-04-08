"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import {
  Agent,
  SimMessage,
  Metrics,
  DEFAULT_METRICS,
  API_BASE,
  WS_BASE,
} from "@/app/simulation/types";

const MAX_RECONNECT_ATTEMPTS = 3;

interface UseSimulationSocketReturn {
  agents: Agent[];
  messages: SimMessage[];
  metrics: Metrics;
  prevMetrics: Metrics | null;
  currentRound: number;
  totalRounds: number;
  status: string;
  companyName: string;
  isConnected: boolean;
  isTyping: boolean;
  connectionError: string | null;
  sendIntervention: (type: string, customMsg?: string) => void;
  sendInterventionRest: (type: string, customMsg?: string) => Promise<void>;
}

export function useSimulationSocket(
  simId: string | null,
  soundEnabled: boolean
): UseSimulationSocketReturn {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(DEFAULT_METRICS);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(12);
  const [status, setStatus] = useState("idle");
  const [companyName, setCompanyName] = useState("Simulation");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [prevMetrics, setPrevMetrics] = useState<Metrics | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const metricsRef = useRef<Metrics>(DEFAULT_METRICS);
  const statusRef = useRef("idle");

  const { playNotification, playMessageTick } = useSoundEffects();

  // Keep refs in sync with state
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

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
          setMetrics(payload.metrics || DEFAULT_METRICS);
          setCurrentRound(payload.currentRound || 0);
          setTotalRounds(payload.totalRounds || 12);
          setStatus(payload.status || "idle");
          setCompanyName(payload.company?.name || "Simulation");
          setIsTyping(true);
        } else if (payload.type === "message") {
          const msg = payload.data;
          const normalizedMsg: SimMessage = {
            ...msg,
            agent: msg.agent_name || msg.agent,
            changes: msg.state_changes || msg.changes,
          };
          setMessages((prev) => [...prev, normalizedMsg]);

          // Sound effects
          if (soundEnabledRef.current) {
            if (msg.type === "system") {
              playNotification();
            } else {
              playMessageTick();
            }
          }

          if (payload.agents) setAgents(payload.agents);
          if (payload.metrics) {
            setPrevMetrics(metricsRef.current);
            setMetrics(payload.metrics);
          }
          if (payload.currentRound) setCurrentRound(payload.currentRound);
          if (payload.status) setStatus(payload.status);
          setIsTyping(true);
        } else if (payload.type === "completed") {
          setStatus("completed");
          setIsTyping(false);
        } else if (payload.type === "error") {
          setConnectionError(payload.message || "Simulation error");
          setIsTyping(false);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsTyping(false);

        if (isCancelled || statusRef.current === "completed" || event.code === 1000) return;

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 8000);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else {
          setConnectionError(
            "Unable to connect to the simulation server. Please check that the backend is running and try again."
          );
        }
      };

      ws.onerror = () => {
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
  const sendIntervention = useCallback(
    (type: string, customMsg?: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      wsRef.current.send(
        JSON.stringify({
          type: "intervene",
          intervention_type: type,
          custom_message: customMsg,
        })
      );
    },
    []
  );

  // Send intervention via REST as fallback
  const sendInterventionRest = useCallback(
    async (type: string, customMsg?: string) => {
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
            setPrevMetrics(metricsRef.current);
            setMetrics(data.metrics);
          }
        }
      } catch (err) {
        console.error("Intervention failed:", err);
      }
    },
    [simId]
  );

  return {
    agents,
    messages,
    metrics,
    prevMetrics,
    currentRound,
    totalRounds,
    status,
    companyName,
    isConnected,
    isTyping,
    connectionError,
    sendIntervention,
    sendInterventionRest,
  };
}
