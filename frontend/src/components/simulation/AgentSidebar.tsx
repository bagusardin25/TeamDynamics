'use client';

import {
  Activity,
  AlertTriangle,
  Flame,
  Frown,
  Gauge,
  Heart,
  Loader2,
  MessageSquareText,
  Sparkles,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Agent } from '@/app/simulation/types';

interface AgentSidebarProps {
  agents: Agent[];
  connectionError: string | null;
  typingAgentId: string | null;
}

function parseAgentName(fullName: string) {
  const parenthesized = fullName.match(/(.*?)\s*\((.*?)\)/);
  if (parenthesized) {
    return { name: parenthesized[1].trim(), role: parenthesized[2].trim() };
  }
  const [name, role] = fullName.split(' - ');
  return { name: name.trim(), role: role?.trim() || 'Team Member' };
}

function getAgentState(morale: number, stress: number) {
  if (stress >= 85) return { label: 'Burnout', icon: Flame, color: 'text-red-500 bg-red-500/10 border-red-500/20' };
  if (stress >= 65) return { label: 'High stress', icon: TriangleAlert, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
  if (morale <= 40) return { label: 'Low mood', icon: Frown, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
  if (morale >= 70 && stress <= 45) return { label: 'Good mood', icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
  return { label: 'Stable', icon: Activity, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
}

export function AgentSidebar({ agents, connectionError, typingAgentId }: AgentSidebarProps) {
  return (
    <aside className='hidden w-[280px] shrink-0 flex-col overflow-y-auto border-r border-border bg-card/20 p-4 custom-scroll md:flex xl:w-[300px]'>
      <div className='mb-5 space-y-1'>
        <h2 className='flex items-center gap-2 text-sm font-semibold'>
          <Users className='h-4 w-4 text-primary' aria-hidden='true' /> Active Agents
        </h2>
        <p className='text-xs text-muted-foreground'>Live psychological state</p>
      </div>

      <div className='flex-1 space-y-3'>
        {agents.map((agent) => {
          const parsed = parseAgentName(agent.name);
          const isTyping = Boolean(
            typingAgentId && agent.name.includes(typingAgentId.split(' (')[0]),
          );
          const state = getAgentState(agent.morale, agent.stress);
          const StateIcon = state.icon;

          return (
            <div key={agent.id}>
              <Card className={`border-border/50 bg-background/45 ${agent.has_resigned ? 'opacity-50 grayscale' : isTyping ? 'border-primary/45' : ''}`}>
                <CardContent className='flex gap-3 p-3'>
                  <div className='relative shrink-0'>
                    <Avatar className={`relative h-10 w-10 border bg-card ${isTyping ? 'border-primary ring-2 ring-primary/15' : 'border-border'}`}>
                      <AvatarFallback className='bg-primary/10 text-xs font-bold text-primary'>
                        {agent.initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className='min-w-0 flex-1 space-y-1.5'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='truncate text-sm font-bold'>{parsed.name}</span>
                        {agent.has_resigned ? (
                          <Badge variant='outline' className='w-[82px] justify-center border-red-500/20 px-1.5 py-0 text-[9px] text-red-400'>Resigned</Badge>
                        ) : isTyping ? (
                          <Badge variant='outline' className='w-[82px] justify-center gap-1 border-primary/30 bg-primary/10 px-1.5 py-0 text-[9px] text-primary'>
                            <MessageSquareText className='h-2.5 w-2.5' aria-hidden='true' />
                            Thinking
                          </Badge>
                        ) : (
                          <Badge variant='outline' className={`w-[82px] justify-center gap-1 px-1.5 py-0 text-[9px] ${state.color}`}>
                            <StateIcon className='h-2.5 w-2.5' aria-hidden='true' />
                            {state.label}
                          </Badge>
                        )}
                      </div>
                      <div className='mt-0.5 truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>
                        {parsed.role}
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-1.5' data-agent-mood>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${agent.morale < 40 ? 'border-rose-500/25 bg-rose-500/10 text-rose-500' : 'border-emerald-500/20 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400'}`}
                        aria-label={`Morale ${agent.morale}%`}
                      >
                        <Heart className='h-3 w-3' aria-hidden='true' />
                        {agent.morale}%
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${agent.stress > 70 ? 'border-orange-500/25 bg-orange-500/10 text-orange-500' : 'border-blue-500/20 bg-blue-500/8 text-blue-600 dark:text-blue-400'}`}
                        aria-label={`Stress ${agent.stress}%`}
                      >
                        <Gauge className='h-3 w-3' aria-hidden='true' />
                        {agent.stress}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}

        {agents.length === 0 && (
          <div className='flex h-40 items-center justify-center text-sm text-muted-foreground'>
            {connectionError ? (
              <div className='space-y-2 text-center'>
                <AlertTriangle className='mx-auto h-5 w-5 text-orange-500' />
                <p className='text-xs text-orange-400'>Connection lost</p>
              </div>
            ) : (
              <><Loader2 className='mr-2 h-4 w-4 animate-spin' /> Loading agents...</>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
