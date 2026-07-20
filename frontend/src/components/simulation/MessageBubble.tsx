'use client';

import {
  Activity,
  Brain,
  TrendingDown,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { SimMessage, SimulationEventEffect } from '@/app/simulation/types';
import {
  getMessageEvent,
  getSimulationEventPresentation,
} from '@/lib/simulation-events';

interface MessageBubbleProps {
  msg: SimMessage;
  isLatest: boolean;
  isRunning: boolean;
}

function parseFinalWorldState(content: string): Record<string, string> {
  const worldState = content.split(/FINAL WORLD STATE:/i)[1];
  if (!worldState) return {};

  return Object.fromEntries(
    worldState
      .split('|')
      .map((item) => item.trim())
      .map((item) => {
        const separator = item.indexOf(':');
        if (separator < 0) return null;
        return [item.slice(0, separator).trim(), item.slice(separator + 1).trim()];
      })
      .filter((item): item is [string, string] => Boolean(item?.[0] && item?.[1])),
  );
}

function EffectBadge({ effect }: { effect: SimulationEventEffect }) {
  const toneClass =
    effect.tone === 'positive'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      : effect.tone === 'negative'
        ? 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400'
        : 'border-border bg-muted text-muted-foreground';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}>
      <span>{effect.label}</span>
      <span>{effect.value}</span>
    </span>
  );
}

function SystemEventCard({ msg }: { msg: SimMessage }) {
  const event = getMessageEvent(msg.content, msg.event);
  const presentation = getSimulationEventPresentation(event.kind);
  const Icon = presentation.icon;
  const worldState = event.kind === 'outcome' ? parseFinalWorldState(msg.content) : {};
  const showTitle = event.title !== presentation.label;

  return (
    <article
      className={`relative my-3 w-full overflow-hidden rounded-2xl border p-4 shadow-sm ${presentation.containerClass}`}
      aria-label={presentation.label}
    >
      <div className='flex items-start gap-3.5'>
        <div className={`mt-0.5 rounded-xl p-2.5 ${presentation.iconClass}`}>
          <Icon className='h-5 w-5' aria-hidden='true' />
        </div>

        <div className='min-w-0 flex-1'>
          <div className={`text-[11px] font-bold uppercase tracking-[0.16em] ${presentation.eyebrowClass}`}>
            {presentation.label}
          </div>
          {showTitle && (
            <h3 className='mt-1 text-sm font-bold leading-snug text-foreground sm:text-base'>
              {event.title}
            </h3>
          )}
          {event.summary && (
            <p className={`${showTitle ? 'mt-1.5' : 'mt-1'} whitespace-pre-line text-sm font-medium leading-relaxed text-foreground/80`}>
              {event.summary}
            </p>
          )}

          {event.effects.length > 0 && (
            <div className='mt-3 flex flex-wrap gap-2' aria-label='State changes'>
              {event.effects.map((effect) => (
                <EffectBadge key={`${effect.label}-${effect.value}`} effect={effect} />
              ))}
            </div>
          )}

          {Object.keys(worldState).length > 0 && (
            <div className='mt-4 border-t border-current/10 pt-3'>
              <div className='mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                Final World State
              </div>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5'>
                {Object.entries(worldState).map(([label, value]) => (
                  <div key={label} className='rounded-lg border border-border/60 bg-background/55 p-2.5'>
                    <div className='truncate text-[9px] font-semibold uppercase tracking-wide text-muted-foreground' title={label}>
                      {label}
                    </div>
                    <div className='mt-1 text-base font-bold text-foreground'>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function MessageBubble({ msg, isLatest, isRunning }: MessageBubbleProps) {
  if (msg.type === 'system') return <SystemEventCard msg={msg} />;

  const playVoice = (text: string, stressDelta = 0) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isHighlyStressed = stressDelta >= 5;
    utterance.pitch = isHighlyStressed ? 0.6 : 1;
    utterance.rate = isHighlyStressed ? 1.2 : 1;
    window.speechSynthesis.speak(utterance);
  };

  const moraleDelta = msg.changes?.morale ?? msg.state_changes?.morale ?? 0;
  const stressDelta = msg.changes?.stress ?? msg.state_changes?.stress ?? 0;
  const agentName = msg.agent || msg.agent_name || 'Agent';

  return (
    <div className='flex w-full gap-3 sm:gap-4'>
      <div className='relative shrink-0'>
        <Avatar className={`relative mt-1 h-9 w-9 border ${isLatest && isRunning ? 'border-primary/60 ring-2 ring-primary/10' : 'border-border'}`}>
          <AvatarFallback className='bg-primary/10 text-xs font-bold text-primary'>
            {agentName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className='min-w-0 flex-1 space-y-1.5'>
        <div className='flex items-center gap-2'>
          <span className='truncate text-sm font-semibold'>{agentName}</span>
          <Button
            variant='ghost'
            size='icon'
            className='ml-1 h-8 w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary'
            onClick={() => playVoice(msg.content, stressDelta)}
            aria-label={`Listen to ${agentName}`}
          >
            <Volume2 className='h-3.5 w-3.5' aria-hidden='true' />
          </Button>
        </div>

        <div
          className='relative rounded-2xl rounded-tl-sm border border-border/60 bg-card p-4 text-sm shadow-sm transition-shadow hover:shadow-md'
        >
          <div className='whitespace-pre-wrap leading-relaxed text-foreground/90'>
            {msg.content}
          </div>

          {msg.thought && (
            <div className='mt-4 space-y-3 border-t border-border/50 pt-4'>
              <div className='flex items-start gap-2.5 rounded-xl border border-border/30 bg-secondary/40 p-3 text-xs text-muted-foreground'>
                <Brain className='mt-0.5 h-4 w-4 shrink-0 text-primary/60' aria-hidden='true' />
                <span className='flex-1 italic leading-relaxed'>&quot;{msg.thought}&quot;</span>
              </div>

              {(moraleDelta !== 0 || stressDelta !== 0) && (
                <div className='flex flex-wrap gap-2 pt-1'>
                  {moraleDelta !== 0 && (
                    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${moraleDelta > 0 ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                      {moraleDelta > 0 ? <TrendingUp className='h-3.5 w-3.5' /> : <TrendingDown className='h-3.5 w-3.5' />}
                      <span>Morale {moraleDelta > 0 ? '+' : ''}{moraleDelta}</span>
                    </div>
                  )}
                  {stressDelta !== 0 && (
                    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${stressDelta > 0 ? 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                      {stressDelta > 0 ? <Activity className='h-3.5 w-3.5' /> : <TrendingDown className='h-3.5 w-3.5' />}
                      <span>Stress {stressDelta > 0 ? '+' : ''}{stressDelta}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
