"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useSimulationSocket } from "@/hooks/use-simulation-socket";
import { SimulationNavbar } from "@/components/simulation/SimulationNavbar";
import { AgentSidebar } from "@/components/simulation/AgentSidebar";
import { MobileAgentBar } from "@/components/simulation/MobileAgentBar";
import { MessageFeed } from "@/components/simulation/MessageFeed";
import { InterventionPanel } from "@/components/simulation/InterventionPanel";
import { MetricsDashboard } from "@/components/simulation/MetricsDashboard";
import { ExitConfirmModal } from "@/components/simulation/ExitConfirmModal";

function SimulationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const simId = searchParams.get("id");

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
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
    typingAgent,
    connectionError,
    worldState,
    decisionStatus,
    metricsHistory,
    outcome,
    sendIntervention,
  } = useSimulationSocket(simId, soundEnabled);

  const handleIntervene = useCallback(
    (type: string, customMsg?: string) => {
      // Use WebSocket to send intervention natively
      sendIntervention(type, customMsg);
    },
    [sendIntervention]
  );

  const handleEndSimulation = useCallback(() => {
    if (status === "completed") {
      router.push(`/report?id=${simId}`);
    } else {
      setShowExitConfirm(true);
    }
  }, [status, simId, router]);

  // Ambient calculation
  const isCrisis = metrics?.avgStress > 75;
  const isWarning = metrics?.avgStress > 50 && metrics?.avgStress <= 75;

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden relative">
      {/* Ambient Vignette Overlay */}
      {status !== "completed" && (
        <div 
          className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000 ${isCrisis ? "opacity-100 animate-pulse" : isWarning ? "opacity-100" : "opacity-0"}`}
          style={{
            backgroundImage: isCrisis 
              ? "radial-gradient(ellipse at center, transparent 40%, rgba(220,38,38,0.18) 100%)"
              : "radial-gradient(ellipse at center, transparent 50%, rgba(245,158,11,0.12) 100%)",
            boxShadow: isCrisis ? "inset 0 0 100px rgba(220,38,38,0.1)" : "none"
          }}
        />
      )}

      {/* Navbar */}
      <div className="relative z-10">
        <SimulationNavbar
          status={status}
          companyName={companyName}
          currentRound={currentRound}
          totalRounds={totalRounds}
          isConnected={isConnected}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onEndSimulation={handleEndSimulation}
          onExit={() => router.push("/dashboard")}
        />
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-secondary/50 shrink-0 relative overflow-hidden">
        <motion.div
          className={`h-full ${status === "completed" ? "bg-green-500" : "bg-primary"}`}
          initial={{ width: 0 }}
          animate={{ width: `${totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        {status === "running" && (
          <motion.div
            className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-80px", "calc(100vw + 80px)"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* Main 3-Column Layout */}
      <main className="flex-1 flex overflow-hidden min-h-0 relative z-10">
        {/* Left: Agent Sidebar (desktop) */}
        <AgentSidebar agents={agents} connectionError={connectionError} typingAgentId={typingAgent} />

        {/* Center: Chat Feed */}
        <section className="flex-1 flex flex-col bg-background/50 relative min-h-0 backdrop-blur-xs">
          <MobileAgentBar agents={agents} />
          <MessageFeed
            messages={messages}
            status={status}
            isTyping={isTyping}
            typingAgent={typingAgent}
            connectionError={connectionError}
            simId={simId}
            outcome={outcome}
            metricsHistory={metricsHistory}
            metrics={metrics}
          />
          <InterventionPanel status={status} onIntervene={handleIntervene} metrics={metrics} worldState={worldState} />
        </section>

        {/* Right: Metrics Dashboard */}
        <MetricsDashboard
          metrics={metrics}
          prevMetrics={prevMetrics}
          status={status}
          currentRound={currentRound}
          agents={agents}
          worldState={worldState}
          decisionStatus={decisionStatus}
          metricsHistory={metricsHistory}
        />
      </main>

      {/* Exit Confirmation Modal */}
      <ExitConfirmModal
        open={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={() => {
          setShowExitConfirm(false);
          router.push(`/report?id=${simId}`);
        }}
        currentRound={currentRound}
        totalRounds={totalRounds}
      />
    </div>
  );
}

export default function SimulationPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SimulationContent />
    </Suspense>
  );
}
