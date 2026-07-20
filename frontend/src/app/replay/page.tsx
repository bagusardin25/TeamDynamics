'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  FastForward,
  FileText,
  Loader2,
  Pause,
  Play,
  Rewind,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { AgentSidebar } from '@/components/simulation/AgentSidebar';
import { MessageFeed } from '@/components/simulation/MessageFeed';
import { MetricsDashboard } from '@/components/simulation/MetricsDashboard';
import { MobileAgentBar } from '@/components/simulation/MobileAgentBar';
import { useReplayEngine, type PlaybackSpeed } from '@/hooks/use-replay-engine';
import { getSimulationTimeLabels } from '@/lib/simulation-labels';

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 2, 4];

function ReplayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const simId = searchParams.get('id');
  const {
    agents,
    messages,
    metrics,
    prevMetrics,
    currentRound,
    totalRounds,
    status,
    mode,
    companyName,
    metricsHistory,
    isPlaying,
    speed,
    isLoading,
    error,
    progress,
    totalMessages,
    currentMessageIndex,
    togglePlayPause,
    setSpeed,
    seekToRound,
    seekToStart,
    seekToEnd,
    stepForward,
  } = useReplayEngine(simId);
  const isDemo = mode === 'demo';
  const labels = getSimulationTimeLabels(isDemo);

  if (isLoading) {
    return (
      <div className='flex h-screen w-full flex-col items-center justify-center gap-4 bg-background'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <p className='text-sm text-muted-foreground'>Loading simulation replay...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6'>
        <div className='text-lg font-semibold text-destructive'>Failed to load replay</div>
        <p className='max-w-md text-center text-sm text-muted-foreground'>{error}</p>
        <button type='button' onClick={() => router.back()} className='mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'>Go Back</button>
      </div>
    );
  }

  return (
    <div className='relative flex h-screen w-full flex-col overflow-hidden bg-background'>
      <header className='relative z-10 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-background/85 px-3 py-2 backdrop-blur-md sm:px-4'>
        <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
          <button type='button' onClick={() => router.back()} className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground' aria-label='Back from replay'>
            <ArrowLeft className='h-4 w-4' />
          </button>
          <div className='h-5 w-px shrink-0 bg-border/50' />
          <div className='min-w-0'>
            <div className='flex min-w-0 items-center gap-2'>
              <div className={`h-2 w-2 shrink-0 rounded-full ${isPlaying ? 'animate-pulse bg-violet-500' : 'bg-muted-foreground/50'}`} />
              <span className='truncate text-sm font-semibold tracking-tight'>{companyName}</span>
              <span className='shrink-0 rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground'>Replay</span>
            </div>
            <div className='mt-0.5 text-[9px] font-mono text-muted-foreground sm:hidden'>
              {labels.shortRound}{currentRound}/{totalRounds} · {currentMessageIndex + (totalMessages > 0 ? 1 : 0)}/{totalMessages}
            </div>
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-2'>
          <span className='hidden text-xs font-mono text-muted-foreground sm:inline'>
            {labels.round} {currentRound}/{totalRounds}
          </span>
          <span className='hidden text-xs font-mono text-muted-foreground md:inline'>
            {currentMessageIndex + (totalMessages > 0 ? 1 : 0)}/{totalMessages} messages
          </span>
          <button type='button' onClick={() => router.push(`/report?id=${simId}`)} className='flex h-9 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground' aria-label='Open simulation report'>
            <FileText className='h-4 w-4' />
            <span className='hidden sm:inline'>Report</span>
            <ChevronRight className='hidden h-3 w-3 sm:block' />
          </button>
        </div>
      </header>

      <div className='h-1 w-full shrink-0 overflow-hidden bg-secondary/50'>
        <motion.div className='h-full bg-violet-500' animate={{ width: `${progress}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} />
      </div>

      <main className='relative z-10 flex min-h-0 flex-1 overflow-hidden'>
        <AgentSidebar agents={agents} connectionError={null} typingAgentId={null} />
        <section className='relative flex min-h-0 flex-1 flex-col bg-background/50 backdrop-blur-xs'>
          <MobileAgentBar agents={agents} metrics={metrics} />
          <MessageFeed
            messages={messages}
            status={status}
            isTyping={false}
            typingAgent={null}
            connectionError={null}
            simId={simId}
            outcome={null}
            metricsHistory={metricsHistory}
            metrics={metrics}
            isDemo={isDemo}
            showPacingControls={false}
          />
        </section>
        <MetricsDashboard
          metrics={metrics}
          prevMetrics={prevMetrics}
          status={status}
          currentRound={currentRound}
          agents={agents}
          worldState={null}
          decisionStatus={null}
          metricsHistory={metricsHistory}
          isDemo={isDemo}
        />
      </main>

      <div className='relative z-20 flex min-h-16 shrink-0 items-center justify-center border-t border-border/40 bg-background/90 px-3 py-2 backdrop-blur-md sm:px-4'>
        <div className='absolute left-3 hidden items-center gap-1 md:flex'>
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option}
              type='button'
              onClick={() => setSpeed(option)}
              aria-pressed={speed === option}
              className={`rounded-md px-2 py-1 text-xs font-mono font-semibold transition-colors ${speed === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
            >
              {option}x
            </button>
          ))}
        </div>

        <div className='flex items-center gap-1 sm:gap-2'>
          <button type='button' onClick={seekToStart} className='flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/50 hover:text-foreground' aria-label='Restart replay'><Rewind className='h-4 w-4' /></button>
          <button type='button' onClick={() => seekToRound(Math.max(0, currentRound - 1))} className='flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/50 hover:text-foreground' aria-label={`Previous ${labels.round.toLowerCase()}`}><SkipBack className='h-4 w-4' /></button>
          <button type='button' onClick={togglePlayPause} className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-colors ${isPlaying ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-primary/90'}`} aria-label={isPlaying ? 'Pause replay' : 'Play replay'}>
            {isPlaying ? <Pause className='h-5 w-5' /> : <Play className='ml-0.5 h-5 w-5' />}
          </button>
          <button type='button' onClick={stepForward} className='flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/50 hover:text-foreground' aria-label='Next message'><SkipForward className='h-4 w-4' /></button>
          <button type='button' onClick={seekToEnd} className='flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/50 hover:text-foreground' aria-label='Skip to replay end'><FastForward className='h-4 w-4' /></button>
        </div>

        <div className='absolute right-4 hidden items-center gap-2 lg:flex'>
          <span className='text-[10px] font-mono text-muted-foreground'>{labels.round}</span>
          <input type='range' min={0} max={totalRounds} value={currentRound} onChange={(event) => seekToRound(Number(event.target.value))} className='h-1.5 w-24 cursor-pointer accent-primary' aria-label={`Seek to ${labels.round.toLowerCase()}`} />
        </div>
      </div>
    </div>
  );
}

export default function ReplayPage() {
  return (
    <Suspense fallback={<div className='flex h-screen w-full items-center justify-center bg-background'><Loader2 className='h-8 w-8 animate-spin text-primary' /></div>}>
      <ReplayContent />
    </Suspense>
  );
}
