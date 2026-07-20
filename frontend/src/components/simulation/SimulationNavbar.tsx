'use client';

import { FileText, LogOut, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSimulationTimeLabels } from '@/lib/simulation-labels';

interface SimulationNavbarProps {
  status: string;
  companyName: string;
  runtimeModel?: string | null;
  currentRound: number;
  totalRounds: number;
  isConnected: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onEndSimulation: () => void;
  onExit: () => void;
  isDemo?: boolean;
}

export function SimulationNavbar({
  status,
  companyName,
  runtimeModel,
  currentRound,
  totalRounds,
  isConnected,
  soundEnabled,
  onToggleSound,
  onEndSimulation,
  onExit,
  isDemo = false,
}: SimulationNavbarProps) {
  const runtimeLabel = runtimeModel === 'scripted-mock' ? 'Scripted Mock' : runtimeModel;
  const labels = getSimulationTimeLabels(isDemo);
  const statusLabel = status === 'completed'
    ? 'Completed'
    : status === 'running'
      ? 'Active'
      : 'Connecting';

  return (
    <header className='flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/60 px-3 py-2 backdrop-blur-md sm:px-5'>
      <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
        <Badge
          variant='outline'
          className={`shrink-0 gap-1.5 px-2 ${status === 'completed' ? 'border-green-500/30 bg-green-500/10 text-green-500' : 'border-primary/30 bg-primary/10 text-primary'}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status === 'completed' ? 'bg-green-500' : isConnected ? 'bg-primary' : 'bg-orange-500'}`} aria-hidden='true' />
          <span className='text-[10px] sm:text-xs'>{statusLabel}</span>
        </Badge>

        {runtimeLabel && (
          <Badge variant='outline' className='hidden shrink-0 border-violet-500/30 bg-violet-500/10 text-violet-400 lg:inline-flex'>
            {runtimeLabel}
          </Badge>
        )}

        <div className='min-w-0'>
          <div className='truncate text-xs font-semibold sm:max-w-52 sm:text-sm' title={companyName}>
            <span className='hidden text-muted-foreground sm:inline'>Project: </span>{companyName}
          </div>
          <div className='text-[9px] font-mono text-muted-foreground sm:text-[10px]'>
            {labels.shortRound}{currentRound}/{totalRounds}
            {!isConnected && status === 'running' && <span className='ml-1.5 text-orange-400'>Reconnecting</span>}
          </div>
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-1 sm:gap-2'>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className={`h-9 w-9 ${soundEnabled ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute simulation sounds' : 'Enable simulation sounds'}
        >
          {soundEnabled ? <Volume2 className='h-4 w-4' /> : <VolumeX className='h-4 w-4' />}
        </Button>

        <Button
          type='button'
          size='sm'
          variant='ghost'
          className='h-9 px-2 text-muted-foreground hover:text-foreground sm:px-3'
          onClick={onExit}
          aria-label='Exit simulation'
        >
          <LogOut className='h-4 w-4 sm:mr-1.5' />
          <span className='hidden sm:inline'>Exit</span>
        </Button>

        <Button
          type='button'
          size='sm'
          variant='outline'
          className='h-9 px-2 sm:px-3'
          onClick={onEndSimulation}
          aria-label='End simulation and view report'
        >
          <FileText className='h-4 w-4 md:mr-1.5' />
          <span className='hidden md:inline'>{status === 'completed' ? 'View Report' : 'End & View Report'}</span>
        </Button>
      </div>
    </header>
  );
}
