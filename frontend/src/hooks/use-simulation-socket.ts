"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import {
  Agent,
  SimMessage,
  Metrics,
  DEFAULT_METRICS,
  WS_BASE,
  WorldState,
  DecisionStatus,
  MetricsSnapshot,
  SimulationOutcome,
  InterventionDraft,
  InterventionPreview,
  InterventionReceipt,
  SimulationControlAction,
} from "@/app/simulation/types";
import {
  applyIntervention as requestApplyIntervention,
  controlSimulation as requestControlSimulation,
  normalizeInterventionReceipts,
  previewIntervention as requestPreviewIntervention,
  undoIntervention as requestUndoIntervention,
} from "@/lib/interventions";

const MAX_RECONNECT_ATTEMPTS = 3;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Intervention request failed.";
}

interface UseSimulationSocketReturn {
  agents: Agent[];
  messages: SimMessage[];
  metrics: Metrics;
  prevMetrics: Metrics | null;
  currentRound: number;
  totalRounds: number;
  status: string;
  companyName: string;
  mode: string;
  runtimeModel: string | null;
  isConnected: boolean;
  isTyping: boolean;
  typingAgent: string | null;
  initialMessageCount: number | null;
  connectionError: string | null;
  worldState: WorldState | null;
  decisionStatus: DecisionStatus | null;
  metricsHistory: MetricsSnapshot[];
  outcome: SimulationOutcome | null;
  interventions: InterventionReceipt[];
  previewIntervention: (draft: InterventionDraft) => Promise<InterventionPreview>;
  applyIntervention: (draft: InterventionDraft, previewToken: string, confirmed: boolean) => Promise<InterventionReceipt>;
  undoIntervention: (interventionId: string) => Promise<InterventionReceipt>;
  controlSimulation: (action: SimulationControlAction) => Promise<void>;
  interventionPending: boolean;
  interventionError: string | null;
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
  const [mode, setMode] = useState("standard");
  const [runtimeModel, setRuntimeModel] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingAgent, setTypingAgent] = useState<string | null>(null);
  const [initialMessageCount, setInitialMessageCount] = useState<number | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [prevMetrics, setPrevMetrics] = useState<Metrics | null>(null);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<MetricsSnapshot[]>([]);
  const [outcome, setOutcome] = useState<SimulationOutcome | null>(null);
  const [interventions, setInterventions] = useState<InterventionReceipt[]>([]);
  const [interventionPending, setInterventionPending] = useState(false);
  const [interventionError, setInterventionError] = useState<string | null>(null);

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
        setIsTyping(false);
        setTypingAgent(null);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.interventions) {
          setInterventions((current) => (
            normalizeInterventionReceipts(current, payload)
          ));
        }
        if (payload.control?.status) {
          setStatus(payload.control.status);
        }

        if (payload.type === "init") {
          const initialMessages = payload.messages || [];
          setAgents(payload.agents || []);
          setMessages(initialMessages);
          setInitialMessageCount(initialMessages.length);
          setMetrics(payload.metrics || DEFAULT_METRICS);
          setCurrentRound(payload.currentRound || 0);
          setTotalRounds(payload.totalRounds || 12);
          setStatus(payload.status || "idle");
          setCompanyName(payload.company?.name || "Simulation");
          setMode(payload.mode || "standard");
          setRuntimeModel(payload.runtimeModel || null);
          setIsTyping(false);
          setTypingAgent(null);
          if (payload.worldState) setWorldState(payload.worldState);
          if (payload.decisionStatus) setDecisionStatus(payload.decisionStatus);
          if (payload.metricsHistory) setMetricsHistory(payload.metricsHistory);
        } else if (payload.type === "typing_start") {
          setIsTyping(true);
          setTypingAgent(payload.agent_name || null);
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
          if (payload.worldState) setWorldState(payload.worldState);
          if (payload.decisionStatus) setDecisionStatus(payload.decisionStatus);
          setIsTyping(false);
          setTypingAgent(null);
        } else if (payload.type === "completed") {
          setStatus("completed");
          setIsTyping(false);
          setTypingAgent(null);
          if (payload.outcome) setOutcome(payload.outcome);
          if (payload.metricsHistory) setMetricsHistory(payload.metricsHistory);
          if (payload.metrics) {
            setPrevMetrics(metricsRef.current);
            setMetrics(payload.metrics);
          }
        } else if (payload.type === "error") {
          setConnectionError(payload.message || "Simulation error");
          setIsTyping(false);
          setTypingAgent(null);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsTyping(false);
        setTypingAgent(null);

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
        setTypingAgent(null);
      };
    }

    const initialConnectTimer = window.setTimeout(connect, 0);

    return () => {
      isCancelled = true;
      window.clearTimeout(initialConnectTimer);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
      }
    };
  }, [simId, playMessageTick, playNotification]);

  const previewIntervention = useCallback(
    async (draft: InterventionDraft) => {
      if (!simId) throw new Error("Simulation is not available.");
      setInterventionPending(true);
      setInterventionError(null);
      try {
        return await requestPreviewIntervention(simId, draft);
      } catch (error) {
        const message = getErrorMessage(error);
        setInterventionError(message);
        throw error;
      } finally {
        setInterventionPending(false);
      }
    },
    [simId],
  );

  const applyIntervention = useCallback(
    async (
      draft: InterventionDraft,
      previewToken: string,
      confirmed: boolean,
    ) => {
      if (!simId) throw new Error("Simulation is not available.");
      setInterventionPending(true);
      setInterventionError(null);
      try {
        const receipt = await requestApplyIntervention(
          simId,
          draft,
          previewToken,
          confirmed,
        );
        setInterventions((current) => (
          normalizeInterventionReceipts(current, receipt)
        ));
        return receipt;
      } catch (error) {
        const message = getErrorMessage(error);
        setInterventionError(message);
        throw error;
      } finally {
        setInterventionPending(false);
      }
    },
    [simId],
  );

  const undoIntervention = useCallback(
    async (interventionId: string) => {
      if (!simId) throw new Error("Simulation is not available.");
      setInterventionPending(true);
      setInterventionError(null);
      try {
        const receipt = await requestUndoIntervention(simId, interventionId);
        setInterventions((current) => (
          normalizeInterventionReceipts(current, receipt)
        ));
        return receipt;
      } catch (error) {
        const message = getErrorMessage(error);
        setInterventionError(message);
        throw error;
      } finally {
        setInterventionPending(false);
      }
    },
    [simId],
  );

  const controlSimulation = useCallback(
    async (action: SimulationControlAction) => {
      if (!simId) return;
      setInterventionPending(true);
      setInterventionError(null);
      try {
        const control = await requestControlSimulation(simId, action);
        setStatus(control.status);
      } catch (error) {
        const message = getErrorMessage(error);
        setInterventionError(message);
        throw error;
      } finally {
        setInterventionPending(false);
      }
    },
    [simId],
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
    mode,
    runtimeModel,
    isConnected,
    isTyping,
    typingAgent,
    initialMessageCount,
    connectionError,
    worldState,
    decisionStatus,
    metricsHistory,
    outcome,
    interventions,
    previewIntervention,
    applyIntervention,
    undoIntervention,
    controlSimulation,
    interventionPending,
    interventionError,
  };
}
