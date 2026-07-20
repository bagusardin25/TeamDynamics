'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Coffee,
  Gift,
  Send,
  Sparkles,
  Terminal,
  TimerOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Metrics, WorldState } from '@/app/simulation/types';

interface InterventionPanelProps {
  status: string;
  onIntervene: (type: string, customMsg?: string) => void;
  metrics?: Metrics;
  worldState?: WorldState | null;
  isDemo?: boolean;
}

interface InterventionSuggestion {
  id: 'bonus' | 'pizza' | 'cancel_overtime';
  label: string;
  impact: string;
  icon: typeof Coffee;
}

export function InterventionPanel({
  status,
  onIntervene,
  metrics,
  isDemo = false,
}: InterventionPanelProps) {
  const [customIntervention, setCustomIntervention] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCompleted = status === 'completed';

  const suggestions: InterventionSuggestion[] = (metrics?.avgStress ?? 0) > 70
    ? [{ id: 'cancel_overtime', label: 'Cancel Overtime', impact: 'Stress down, output trade-off', icon: TimerOff }]
    : [{ id: 'pizza', label: 'Team Reset', impact: 'Morale up, stress down', icon: Coffee }];

  if (metrics && metrics.avgMorale < 45) {
    suggestions.push({ id: 'bonus', label: 'Emergency Bonus', impact: 'Morale and loyalty up', icon: Gift });
  }

  const submitCustomIntervention = () => {
    const value = customIntervention.trim();
    if (!value || isCompleted) return;
    onIntervene('custom', value);
    setCustomIntervention('');
  };

  return (
    <div className='shrink-0 border-t border-border/70 bg-background/95 backdrop-blur'>
      <button
        type='button'
        className='flex w-full items-center justify-between px-4 py-2.5 text-sm md:hidden'
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
        aria-controls='god-mode-panel'
      >
        <span className='flex items-center gap-2 font-semibold'>
          <Terminal className='h-4 w-4 text-primary' aria-hidden='true' /> God Mode
          <Badge variant='outline' className='text-[9px]'>State override</Badge>
        </span>
        {mobileOpen ? <ChevronDown className='h-4 w-4' /> : <ChevronUp className='h-4 w-4' />}
      </button>

      <div id='god-mode-panel' className={`${mobileOpen ? 'block' : 'hidden'} p-3 md:block md:p-4`}>
        <div className='mx-auto max-w-4xl space-y-2.5'>
          {!isCompleted && (
            <div className='flex gap-2 overflow-x-auto pb-0.5 custom-scroll' aria-label='Suggested interventions'>
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <Button
                    key={suggestion.id}
                    type='button'
                    variant='outline'
                    className='h-auto shrink-0 gap-2 px-3 py-2 text-left'
                    onClick={() => onIntervene(suggestion.id)}
                    aria-label={`${suggestion.label}: ${suggestion.impact}`}
                  >
                    <Icon className='h-4 w-4 text-primary' aria-hidden='true' />
                    <span>
                      <span className='block text-[11px] font-semibold'>{suggestion.label}</span>
                      <span className='block text-[9px] font-normal text-muted-foreground'>{suggestion.impact}</span>
                    </span>
                  </Button>
                );
              })}
            </div>
          )}

          <Card className='overflow-hidden border-primary/25 bg-card/90 shadow-lg ring-1 ring-primary/5 focus-within:ring-primary/35'>
            <CardContent className='p-0'>
              <div className='flex items-center'>
                <div className='hidden shrink-0 items-center gap-2 border-r border-border/50 bg-secondary/30 px-3 py-3 sm:flex'>
                  <Sparkles className='h-4 w-4 text-primary' aria-hidden='true' />
                  <span className='text-[10px] font-bold uppercase tracking-widest text-primary'>God Mode</span>
                </div>
                <Input
                  placeholder='Describe a management intervention...'
                  className='h-12 flex-1 rounded-none border-0 bg-transparent px-3 text-[13px] shadow-none focus-visible:ring-0'
                  value={customIntervention}
                  onChange={(event) => setCustomIntervention(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submitCustomIntervention();
                  }}
                  disabled={isCompleted}
                  aria-label='Custom God Mode intervention'
                />
                <Button
                  type='button'
                  size='icon'
                  className='mr-2 h-9 w-9 shrink-0 rounded-lg'
                  onClick={submitCustomIntervention}
                  disabled={isCompleted || !customIntervention.trim()}
                  aria-label='Apply God Mode intervention'
                >
                  <Send className='h-4 w-4' aria-hidden='true' />
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className='px-1 text-[10px] leading-relaxed text-muted-foreground'>
            {isDemo
              ? 'Overrides update live team metrics and are logged in the feed. Demo dialogue remains scripted.'
              : 'Overrides update team state immediately and are logged as a highlighted simulation event.'}
          </p>
        </div>
      </div>
    </div>
  );
}
