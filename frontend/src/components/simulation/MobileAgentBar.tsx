'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ChevronDown,
  Gauge,
  Heart,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type {
  Agent,
  DecisionStatus,
  Metrics,
  WorldState,
} from '@/app/simulation/types';

interface MobileAgentBarProps {
  agents: Agent[];
  metrics?: Metrics;
  worldState?: WorldState | null;
  decisionStatus?: DecisionStatus | null;
}

type ContextPanel = 'team' | 'metrics' | null;

export function MobileAgentBar({
  agents,
  metrics,
  worldState,
  decisionStatus,
}: MobileAgentBarProps) {
  const [panel, setPanel] = useState<ContextPanel>(null);

  const togglePanel = (next: Exclude<ContextPanel, null>) => {
    setPanel((current) => current === next ? null : next);
  };

  return (
    <div className='shrink-0 border-b border-border bg-card/45 lg:hidden'>
      <div className='flex items-center justify-between gap-2 px-3 py-2'>
        <button
          type='button'
          onClick={() => togglePanel('team')}
          className={`flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold ${panel === 'team' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
          aria-expanded={panel === 'team'}
          aria-controls='mobile-team-context'
        >
          <Users className='h-4 w-4' aria-hidden='true' />
          <span>Team</span>
          <div className='flex -space-x-2'>
            {agents.slice(0, 4).map((agent) => (
              <Avatar key={agent.id} className='h-6 w-6 border-2 border-background'>
                <AvatarFallback className='bg-primary/10 text-[8px] font-bold text-primary'>{agent.initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          {agents.length > 4 && <span className='text-[9px]'>+{agents.length - 4}</span>}
        </button>

        {metrics && (
          <button
            type='button'
            onClick={() => togglePanel('metrics')}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold ${panel === 'metrics' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
            aria-expanded={panel === 'metrics'}
            aria-controls='mobile-metrics-context'
          >
            <Gauge className='h-4 w-4' aria-hidden='true' />
            <span className='hidden xs:inline'>Context</span>
            <span className='text-emerald-500'>M {metrics.avgMorale}</span>
            <span className='text-amber-500'>S {metrics.avgStress}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${panel === 'metrics' ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {panel === 'team' && (
          <motion.div
            id='mobile-team-context'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className='overflow-hidden border-t border-border/50'
          >
            <div className='grid max-h-[40vh] grid-cols-1 gap-2 overflow-y-auto p-3 custom-scroll sm:grid-cols-2'>
              {agents.map((agent) => (
                <div key={agent.id} className={`flex items-center gap-2 rounded-lg border border-border/50 bg-background/45 p-2.5 ${agent.has_resigned ? 'opacity-50' : ''}`}>
                  <Avatar className='h-8 w-8 shrink-0 border border-border'>
                    <AvatarFallback className='bg-primary/10 text-[9px] font-bold text-primary'>{agent.initials}</AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-xs font-medium'>{agent.name}</div>
                    <div className='mt-1 grid grid-cols-2 gap-2 text-[9px] text-muted-foreground'>
                      <span>Morale <strong className='text-foreground'>{agent.morale}%</strong></span>
                      <span>Stress <strong className='text-foreground'>{agent.stress}%</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {panel === 'metrics' && metrics && (
          <motion.div
            id='mobile-metrics-context'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className='overflow-hidden border-t border-border/50'
          >
            <div className='max-h-[40vh] space-y-3 overflow-y-auto p-3 custom-scroll'>
              <div className='grid grid-cols-3 gap-2'>
                {[
                  ['Morale', metrics.avgMorale, Heart, 'text-emerald-500'],
                  ['Stress', metrics.avgStress, Activity, 'text-amber-500'],
                  ['Output', metrics.productivity, Gauge, 'text-blue-500'],
                ].map(([label, value, Icon, color]) => {
                  const MetricIcon = Icon as typeof Heart;
                  return (
                    <div key={String(label)} className='rounded-lg border border-border/50 bg-background/45 p-2.5'>
                      <div className='flex items-center gap-1 text-[9px] text-muted-foreground'>
                        <MetricIcon className={`h-3 w-3 ${color}`} /> {String(label)}
                      </div>
                      <div className='mt-1 text-lg font-bold'>{Number(value)}%</div>
                    </div>
                  );
                })}
              </div>

              {worldState && (
                <div className='grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border/50 bg-background/45 p-3'>
                  {[
                    ['Budget', worldState.budgetRemaining],
                    ['Reputation', worldState.companyReputation],
                    ['Customers', worldState.customerSatisfaction],
                    ['Technical Debt', worldState.technicalDebt],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <div className='flex justify-between text-[9px] text-muted-foreground'><span>{String(label)}</span><span>{Number(value)}%</span></div>
                      <Progress value={Number(value)} className='mt-1 h-1.5' />
                    </div>
                  ))}
                </div>
              )}

              {decisionStatus?.leadingProposal && (
                <div className='rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 text-xs'>
                  <Badge variant='outline' className='mb-2 text-[9px]'>{decisionStatus.hasDecision ? 'Decision reached' : 'Leading proposal'}</Badge>
                  <p className='leading-relaxed text-muted-foreground'>{decisionStatus.decidedProposal || decisionStatus.leadingProposal}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
