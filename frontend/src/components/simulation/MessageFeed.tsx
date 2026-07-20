'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Bot,
  CheckCircle2,
  Gauge,
  Loader2,
  MessageSquareText,
  Pause,
  Play,
  Settings2,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type {
  Metrics,
  MetricsSnapshot,
  InterventionReceipt,
  SimMessage,
  SimulationOutcome,
} from '@/app/simulation/types';
import {
  filterSimulationMessages,
  getFeedRevealDelay,
  getInitialFeedVisibleCount,
  getNextFeedVisibleCount,
  getQueuedAgentName,
  isFeedNearBottom,
  type FeedFilter,
  type FeedSpeed,
} from '@/lib/simulation-feed';
import { getSimulationTimeLabels } from '@/lib/simulation-labels';
import { MessageBubble } from './MessageBubble';

interface MessageFeedProps {
  messages: SimMessage[];
  status: string;
  isTyping: boolean;
  typingAgent: string | null;
  connectionError: string | null;
  simId: string | null;
  outcome: SimulationOutcome | null;
  metricsHistory: MetricsSnapshot[];
  metrics: Metrics;
  interventions?: InterventionReceipt[];
  initialMessageCount?: number | null;
  onPresentedAgentChange?: (agentName: string | null) => void;
  isDemo?: boolean;
  showPacingControls?: boolean;
}

const SPEEDS: FeedSpeed[] = [0.75, 1, 1.5, 2];
const FILTERS: Array<{ value: FeedFilter; label: string; icon: typeof Bot }> = [
  { value: 'all', label: 'All', icon: MessageSquareText },
  { value: 'agents', label: 'Agents', icon: Bot },
  { value: 'system', label: 'System', icon: Settings2 },
];

function OutcomeSummaryCard({
  outcome,
  metrics,
  metricsHistory,
  simId,
  interventions,
}: {
  outcome: SimulationOutcome;
  metrics: Metrics;
  metricsHistory: MetricsSnapshot[];
  simId: string | null;
  interventions: InterventionReceipt[];
}) {
  const moraleData = metricsHistory.map((snapshot) => snapshot.morale);
  const width = 200;
  const height = 40;
  let sparklinePath = '';
  const influentialInterventions = interventions.filter(
    (receipt) => receipt.status === 'applied',
  );

  if (moraleData.length > 1) {
    const max = Math.max(...moraleData, 100);
    const min = Math.min(...moraleData, 0);
    const range = max - min || 1;
    sparklinePath = moraleData
      .map((value, index) => {
        const x = (index / (moraleData.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className='mx-auto my-8 w-full max-w-xl'
    >
      <Card className='relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl shadow-primary/10'>
        <CardContent className='relative space-y-5 p-6'>
          <div className='space-y-2 text-center'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500'>
              <Trophy className='h-7 w-7' aria-hidden='true' />
            </div>
            <h3 className='text-xl font-bold tracking-tight'>{outcome.title}</h3>
            <p className='mx-auto max-w-md text-sm leading-relaxed text-muted-foreground'>
              {outcome.description}
            </p>
          </div>

          <div className='h-px bg-border/50' />
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {[
              ['Morale', `${metrics.avgMorale}%`],
              ['Stress', `${metrics.avgStress}%`],
              ['Output', `${metrics.productivity}%`],
              ['Resigned', String(metrics.resignations)],
            ].map(([label, value]) => (
              <div key={label} className='rounded-xl border border-border/60 bg-background/40 p-3 text-center'>
                <div className='text-lg font-bold'>{value}</div>
                <div className='text-[10px] text-muted-foreground'>{label}</div>
              </div>
            ))}
          </div>

          {sparklinePath && (
            <div className='flex flex-col items-center gap-1'>
              <span className='text-[10px] text-muted-foreground'>Morale timeline</span>
              <svg width={width} height={height} aria-label='Morale timeline chart'>
                <path d={sparklinePath} fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-emerald-500' />
              </svg>
            </div>
          )}

          {influentialInterventions.length > 0 ? (
            <div className='flex flex-col gap-2 rounded-xl border border-border p-3'>
              <p className='font-medium'>Influential interventions</p>
              {influentialInterventions.slice(-3).map((receipt) => (
                <div key={receipt.id} className='flex items-start justify-between gap-3'>
                  <div>
                    <p>{receipt.command}</p>
                    <p className='text-muted-foreground'>Target: {receipt.target.label}</p>
                  </div>
                  <Badge variant='outline'>{receipt.response_status}</Badge>
                </div>
              ))}
            </div>
          ) : null}

          <Link href={`/report?id=${simId}`} className='block'>
            <Button className='h-11 w-full font-semibold'>
              View Full Report <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function MessageFeed({
  messages,
  status,
  isTyping,
  typingAgent,
  connectionError,
  simId,
  outcome,
  metricsHistory,
  metrics,
  interventions = [],
  initialMessageCount,
  onPresentedAgentChange,
  isDemo = false,
  showPacingControls = true,
}: MessageFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const renderedCountRef = useRef(0);
  const firstAutoScrollRef = useRef(true);
  const messageCountRef = useRef(messages.length);
  const shouldReduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [speed, setSpeed] = useState<FeedSpeed>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(
    showPacingControls ? 0 : messages.length,
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const timeLabels = getSimulationTimeLabels(isDemo);
  const resolvedInitialMessageCount = initialMessageCount === undefined
    ? messages.length
    : initialMessageCount;

  useEffect(() => {
    messageCountRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (!showPacingControls || initializedRef.current) return;
    const nextVisibleCount = getInitialFeedVisibleCount(
      messages.length,
      visibleCount,
      initializedRef.current,
      resolvedInitialMessageCount,
    );
    if (nextVisibleCount === null) return;

    initializedRef.current = true;
    setVisibleCount(nextVisibleCount);
  }, [messages.length, resolvedInitialMessageCount, showPacingControls, visibleCount]);

  const nextMessage = showPacingControls ? messages[visibleCount] : undefined;
  const previousMessage = visibleCount > 0 ? messages[visibleCount - 1] : undefined;
  const nextMessageId = nextMessage?.id ?? null;
  const nextRevealDelay = nextMessage
    ? getFeedRevealDelay(speed, nextMessage, previousMessage)
    : null;

  useEffect(() => {
    if (
      !showPacingControls
      || !initializedRef.current
      || nextMessageId === null
      || nextRevealDelay === null
    ) return;

    const timer = window.setTimeout(
      () => setVisibleCount((count) => (
        getNextFeedVisibleCount(messageCountRef.current, count) ?? count
      )),
      nextRevealDelay,
    );
    return () => window.clearTimeout(timer);
  }, [nextMessageId, nextRevealDelay, showPacingControls]);

  const effectiveVisibleCount = showPacingControls
    ? visibleCount
    : messages.length;
  const visibleMessages = useMemo(
    () => filterSimulationMessages(messages.slice(0, effectiveVisibleCount), filter),
    [effectiveVisibleCount, filter, messages],
  );
  const pendingCount = Math.max(0, messages.length - effectiveVisibleCount);
  const newUpdateCount = pendingCount + unreadCount;
  const presentationComplete = status === 'completed' && pendingCount === 0;
  const outcomeScrollKey = outcome?.title ?? null;
  const showNewUpdateButton = isPaused && newUpdateCount > 0;
  const queuedAgentName = showPacingControls
    ? getQueuedAgentName(messages, effectiveVisibleCount)
    : null;
  const presentationTypingAgent = !isPaused && filter !== 'system'
    ? queuedAgentName || (pendingCount === 0 && isTyping ? typingAgent : null)
    : null;

  useEffect(() => {
    const delta = Math.max(0, effectiveVisibleCount - renderedCountRef.current);
    renderedCountRef.current = effectiveVisibleCount;
    if (delta > 0 && isPaused) {
      setUnreadCount((count) => count + delta);
    }
  }, [effectiveVisibleCount, isPaused]);

  useEffect(() => {
    onPresentedAgentChange?.(presentationTypingAgent);
  }, [onPresentedAgentChange, presentationTypingAgent]);

  const scrollToLatest = useCallback((behavior: ScrollBehavior) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTo({
      top: scroller.scrollHeight,
      behavior,
    });
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const behavior: ScrollBehavior = firstAutoScrollRef.current || shouldReduceMotion
      ? 'auto'
      : 'smooth';
    firstAutoScrollRef.current = false;
    const frame = requestAnimationFrame(() => {
      scrollToLatest(behavior);
    });
    return () => cancelAnimationFrame(frame);
  }, [effectiveVisibleCount, filter, isPaused, outcomeScrollKey, presentationComplete, presentationTypingAgent, scrollToLatest, shouldReduceMotion]);

  const jumpToLatest = useCallback(() => {
    setUnreadCount(0);
    requestAnimationFrame(() => {
      scrollToLatest(shouldReduceMotion ? 'auto' : 'smooth');
    });
  }, [scrollToLatest, shouldReduceMotion]);

  const toggleAutoFollow = () => {
    if (isPaused) {
      setIsPaused(false);
      jumpToLatest();
      return;
    }
    setIsPaused(true);
  };

  return (
    <div className='relative flex min-h-0 flex-1 flex-col'>
      <div className='flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-3 py-2 backdrop-blur sm:px-5'>
        <div className='flex items-center gap-1' aria-label='Message filter'>
          {FILTERS.map((option) => {
            const Icon = option.icon;
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type='button'
                onClick={() => setFilter(option.value)}
                aria-pressed={active}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-colors ${active ? 'bg-primary/12 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon className='h-3.5 w-3.5' aria-hidden='true' />
                {option.label}
              </button>
            );
          })}
        </div>

        {showPacingControls && (!presentationComplete || isPaused) && (
          <div className='flex items-center gap-1.5'>
            <div className='hidden items-center gap-0.5 sm:flex' aria-label='Update speed'>
              <Gauge className='mr-1 h-3.5 w-3.5 text-muted-foreground' aria-hidden='true' />
              {SPEEDS.map((value) => (
                <button
                  key={value}
                  type='button'
                  onClick={() => setSpeed(value)}
                  aria-pressed={speed === value}
                  className={`h-7 rounded-md px-2 text-[10px] font-semibold ${speed === value ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {value}x
                </button>
              ))}
            </div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 gap-1.5 px-2.5 text-[11px]'
              onClick={toggleAutoFollow}
              aria-label={isPaused ? 'Resume follow and show latest updates' : 'Pause follow'}
            >
              {isPaused ? <Play className='h-3.5 w-3.5' /> : <Pause className='h-3.5 w-3.5' />}
              <span>{isPaused ? 'Resume follow' : 'Pause follow'}</span>
            </Button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className='min-h-0 flex-1 overflow-y-auto p-4 custom-scroll sm:p-6'
        onScroll={(event) => {
          if (isFeedNearBottom(event.currentTarget)) setUnreadCount(0);
        }}
      >
        <div className='mx-auto max-w-3xl space-y-5 pb-8'>
          {connectionError && (
            <div className='my-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm'>
              <AlertTriangle className='h-5 w-5 shrink-0 text-red-500' />
              <div className='flex-1'>
                <p className='font-medium text-red-400'>{connectionError}</p>
                <p className='mt-1 text-xs text-muted-foreground'>The simulation may have expired or the server is unreachable.</p>
              </div>
              <Link href='/setup'><Button size='sm' variant='outline'>New Simulation</Button></Link>
            </div>
          )}

          <div className='flex items-center justify-center py-2'>
            <Badge variant='secondary' className='font-normal text-muted-foreground'>Simulation Started</Badge>
          </div>

          {visibleMessages.map((message, index) => {
            const previousRound = index > 0 ? visibleMessages[index - 1].round : null;
            const showRoundDivider = Boolean(message.round && message.round !== previousRound);
            return (
              <motion.div
                key={message.id}
                data-message-entry={message.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {showRoundDivider && (
                  <div className='my-6 flex items-center gap-3' aria-label={`${timeLabels.round} ${message.round}`}>
                    <div className='h-px flex-1 bg-border/50' />
                    <Badge variant='secondary' className='bg-card px-3 py-1 text-xs font-medium text-muted-foreground'>
                      {timeLabels.round} {message.round}
                    </Badge>
                    <div className='h-px flex-1 bg-border/50' />
                  </div>
                )}
                <MessageBubble
                  msg={message}
                  isLatest={index === visibleMessages.length - 1}
                  isRunning={!presentationComplete && !isPaused}
                />
              </motion.div>
            );
          })}

          {presentationTypingAgent && !presentationComplete && (
              <div className='flex gap-3' role='status' aria-live='polite'>
                <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold text-primary'>
                  {presentationTypingAgent.substring(0, 2).toUpperCase()}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='text-sm font-semibold text-muted-foreground'>{presentationTypingAgent}</div>
                  <div className='mt-1 inline-flex min-w-48 items-center gap-2 rounded-r-lg border border-l-4 border-border border-l-primary/30 bg-card px-3 py-2 text-xs italic text-muted-foreground shadow-sm'>
                    <Loader2 className='h-3.5 w-3.5 shrink-0 animate-spin text-primary/70' aria-hidden='true' />
                    is thinking...
                  </div>
                </div>
              </div>
          )}

          {presentationComplete && (
            <>
              <div className='flex items-center justify-center py-4'>
                <Badge variant='secondary' className='gap-1.5 border-none bg-green-500/10 font-medium text-green-500'>
                  <CheckCircle2 className='h-3.5 w-3.5' /> Simulation Completed — {timeLabels.completed}
                </Badge>
              </div>
              {outcome ? (
                <OutcomeSummaryCard
                  outcome={outcome}
                  metrics={metrics}
                  metricsHistory={metricsHistory}
                  simId={simId}
                  interventions={interventions}
                />
              ) : (
                <div className='flex justify-center py-4'>
                  <Link href={`/report?id=${simId}`}><Button variant='outline'>View Report <ArrowRight className='ml-2 h-4 w-4' /></Button></Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showNewUpdateButton && (
        <button
          type='button'
          onClick={jumpToLatest}
          className='absolute bottom-4 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/25 bg-background/95 px-3.5 py-2 text-xs font-semibold text-primary shadow-lg backdrop-blur hover:bg-primary/10'
          aria-label={`Show ${newUpdateCount} new updates`}
        >
          <ArrowDown className='h-3.5 w-3.5' />
          {newUpdateCount} New updates
        </button>
      )}
    </div>
  );
}
