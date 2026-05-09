"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2, Play, Pause, SkipForward, SkipBack,
  FastForward, Rewind, ArrowLeft, FileText, ChevronRight,
} from "lucide-react";
import { AgentSidebar } from "@/components/simulation/AgentSidebar";
import { MobileAgentBar } from "@/components/simulation/MobileAgentBar";
import { MessageFeed } from "@/components/simulation/MessageFeed";
import { MetricsDashboard } from "@/components/simulation/MetricsDashboard";
import { useReplayEngine, PlaybackSpeed } from "@/hooks/use-replay-engine";

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 2, 4];

function ReplayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const simId = searchParams.get("id");

  const {
    agents,
    messages,
    metrics,
    prevMetrics,
    currentRound,
    totalRounds,
    companyName,
    metricsHistory,
    isPlaying,
    speed,
    isLoading,
    error,
    progress,
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
  } = useReplayEngine(simId);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading simulation replay...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-destructive text-lg font-semibold">Failed to load replay</div>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden relative">
      {/* Replay Navbar */}
      <header className="h-14 shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-5 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-sm font-semibold tracking-tight">{companyName}</span>
            <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
              Replay
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            Round {currentRound}/{totalRounds}
          </span>
          <div className="h-5 w-px bg-border/50" />
          <span className="text-xs text-muted-foreground font-mono">
            {currentMessageIndex + (totalMessages > 0 ? 1 : 0)}/{totalMessages} msgs
          </span>
          <div className="h-5 w-px bg-border/50" />
          <button
            onClick={() => router.push(`/report?id=${simId}`)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary/50"
          >
            <FileText className="w-3.5 h-3.5" />
            Report
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-secondary/50 shrink-0 relative overflow-hidden">
        <motion.div
          className="h-full bg-violet-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Main 3-Column Layout (reuses simulation UI) */}
      <main className="flex-1 flex overflow-hidden min-h-0 relative z-10">
        {/* Left: Agent Sidebar */}
        <AgentSidebar agents={agents} connectionError={null} typingAgentId={null} />

        {/* Center: Chat Feed */}
        <section className="flex-1 flex flex-col bg-background/50 relative min-h-0 backdrop-blur-xs">
          <MobileAgentBar agents={agents} />
          <MessageFeed
            messages={messages}
            status="completed"
            isTyping={false}
            typingAgent={null}
            connectionError={null}
            simId={simId}
            outcome={null}
            metricsHistory={metricsHistory}
            metrics={metrics}
          />
        </section>

        {/* Right: Metrics Dashboard */}
        <MetricsDashboard
          metrics={metrics}
          prevMetrics={prevMetrics}
          status="completed"
          currentRound={currentRound}
          agents={agents}
          worldState={null}
          decisionStatus={null}
          metricsHistory={metricsHistory}
        />
      </main>

      {/* Playback Controls Bar */}
      <div className="h-16 shrink-0 border-t border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-center gap-3 px-4 relative z-10">
        {/* Left: Speed selector */}
        <div className="absolute left-4 flex items-center gap-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`
                px-2 py-1 rounded-md text-xs font-mono font-semibold transition-all
                ${speed === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }
              `}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Center: Transport controls */}
        <div className="flex items-center gap-2">
          {/* Seek to start */}
          <button
            onClick={seekToStart}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            title="Restart"
          >
            <Rewind className="w-4 h-4" />
          </button>

          {/* Step back (seek to previous round) */}
          <button
            onClick={() => seekToRound(Math.max(0, currentRound - 1))}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            title="Previous round"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg
              ${isPlaying
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }
            `}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          {/* Step forward */}
          <button
            onClick={stepForward}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            title="Next message"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Seek to end */}
          <button
            onClick={seekToEnd}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            title="Skip to end"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Round scrubber */}
        <div className="absolute right-4 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">Round</span>
          <input
            type="range"
            min={0}
            max={totalRounds}
            value={currentRound}
            onChange={(e) => seekToRound(Number(e.target.value))}
            className="w-24 h-1.5 accent-primary cursor-pointer"
            title={`Round ${currentRound}`}
          />
        </div>
      </div>
    </div>
  );
}

export default function ReplayPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ReplayContent />
    </Suspense>
  );
}
