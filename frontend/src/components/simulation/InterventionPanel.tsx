'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coffee,
  Gift,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  Terminal,
  TimerOff,
  WandSparkles,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  formatInterventionEffect,
  getInterventionSemantics,
  validateInterventionDraft,
} from '@/lib/interventions';
import { cn } from '@/lib/utils';
import type {
  Agent,
  InterventionCategory,
  InterventionDraft,
  InterventionPreview,
  InterventionReceipt,
  InterventionTargetKind,
  InterventionType,
  Metrics,
  SimulationControlAction,
} from '@/app/simulation/types';

interface InterventionPanelProps {
  status: string;
  agents: Agent[];
  interventions: InterventionReceipt[];
  onPreview: (draft: InterventionDraft) => Promise<InterventionPreview>;
  onApply: (
    draft: InterventionDraft,
    previewToken: string,
    confirmed: boolean,
  ) => Promise<InterventionReceipt>;
  onUndo: (interventionId: string) => Promise<InterventionReceipt>;
  onControl: (action: SimulationControlAction) => Promise<void>;
  interventionPending: boolean;
  interventionError: string | null;
  metrics?: Metrics;
  isDemo?: boolean;
}

interface InterventionSuggestion {
  id: Exclude<InterventionType, 'custom'>;
  label: string;
  category: InterventionCategory;
  icon: LucideIcon;
}

type ConsoleMode = 'observe' | 'intervene';

const DEFAULT_DRAFT: InterventionDraft = {
  type: 'custom',
  command: '',
  category: 'people',
  targetKind: 'all_team',
};

const TARGET_OPTIONS: Array<{ value: InterventionTargetKind; label: string }> = [
  { value: 'all_team', label: 'All team' },
  { value: 'agent', label: 'Specific agent' },
  { value: 'project', label: 'Project' },
  { value: 'decision_process', label: 'Decision process' },
];

const CATEGORY_OPTIONS: Array<{ value: InterventionCategory; label: string }> = [
  { value: 'people', label: 'People' },
  { value: 'time_scope', label: 'Time & Scope' },
  { value: 'resources', label: 'Resources' },
  { value: 'policy', label: 'Policy' },
  { value: 'incident', label: 'Incident' },
];

function ReceiptCard({
  receipt,
  pending,
  onUndo,
}: {
  receipt: InterventionReceipt;
  pending: boolean;
  onUndo: (interventionId: string) => Promise<InterventionReceipt>;
}) {
  return (
    <Card size='sm'>
      <CardHeader>
        <CardTitle>{receipt.command}</CardTitle>
        <CardDescription>
          {receipt.target.label} · {receipt.category.replace('_', ' ')}
        </CardDescription>
        <CardAction>
          <Badge variant={receipt.status === 'undone' ? 'outline' : 'secondary'}>
            {receipt.status === 'undone' ? 'Undone' : receipt.response_status}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className='grid gap-3 md:grid-cols-2'>
        <div className='flex flex-col gap-1'>
          <p className='font-medium'>Impact preview</p>
          {receipt.preview_effects.length > 0 ? (
            receipt.preview_effects.map((effect) => (
              <p key={`preview-${receipt.id}-${effect.scope}-${effect.key}`} className='text-muted-foreground'>
                {formatInterventionEffect(effect)}
              </p>
            ))
          ) : (
            <p className='text-muted-foreground'>No direct metric change.</p>
          )}
        </div>
        <div className='flex flex-col gap-1'>
          <p className='font-medium'>Actual effect</p>
          {receipt.actual_effects.length > 0 ? (
            receipt.actual_effects.map((effect) => (
              <p key={`actual-${receipt.id}-${effect.scope}-${effect.key}`} className='text-muted-foreground'>
                {formatInterventionEffect(effect)}
              </p>
            ))
          ) : (
            <p className='text-muted-foreground'>Directive recorded for the next turn.</p>
          )}
        </div>
      </CardContent>
      {receipt.can_undo ? (
        <CardFooter>
          <Button
            type='button'
            variant='outline'
            disabled={pending}
            onClick={() => void onUndo(receipt.id)}
          >
            <RotateCcw data-icon='inline-start' />
            Undo
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function InterventionPanel({
  status,
  agents,
  interventions,
  onPreview,
  onApply,
  onUndo,
  onControl,
  interventionPending,
  interventionError,
  metrics,
  isDemo = false,
}: InterventionPanelProps) {
  const [mode, setMode] = useState<ConsoleMode>('observe');
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState<InterventionDraft>(DEFAULT_DRAFT);
  const [preview, setPreview] = useState<InterventionPreview | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('Observe mode. No state changes are pending.');
  const isCompleted = status === 'completed';
  const recentInterventions = interventions.slice(-3).reverse();

  const suggestions: InterventionSuggestion[] = (metrics?.avgStress ?? 0) > 70
    ? [{ id: 'cancel_overtime', label: 'Cancel overtime', category: 'time_scope', icon: TimerOff }]
    : [{ id: 'pizza', label: 'Team reset', category: 'people', icon: Coffee }];
  if (metrics && metrics.avgMorale < 45) {
    suggestions.push({ id: 'bonus', label: 'Emergency bonus', category: 'resources', icon: Gift });
  }

  const resetPreview = () => {
    setPreview(null);
    setLocalError(null);
  };

  const updateDraft = (changes: Partial<InterventionDraft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    resetPreview();
  };

  const handleModeChange = async (value: ConsoleMode) => {
    setMode(value);
    if (value === 'intervene' && status !== 'paused') {
      setAnnouncement('Pausing at the next safe agent boundary.');
      await onControl('pause');
      setAnnouncement('Simulation paused. Preview an intervention before applying it.');
    }
  };

  const chooseSuggestion = (suggestion: InterventionSuggestion) => {
    updateDraft({
      type: suggestion.id,
      command: suggestion.label,
      category: suggestion.category,
      targetKind: 'all_team',
      targetId: undefined,
    });
    void handleModeChange('intervene');
  };

  const handlePreview = async () => {
    const validation = validateInterventionDraft(draft);
    if (!validation.valid) {
      setLocalError(validation.error);
      return;
    }
    setLocalError(null);
    try {
      const nextPreview = await onPreview(draft);
      setPreview(nextPreview);
      setAnnouncement('Impact preview ready. Compare the target and effects before applying.');
    } catch {
      setAnnouncement('Preview failed. Review the message below and try again.');
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    try {
      const receipt = await onApply(
        draft,
        preview.preview_token,
        preview.confirmation_required,
      );
      setPreview(null);
      setMode('observe');
      setAnnouncement(`Intervention applied to ${receipt.target.label}. Receipt recorded.`);
    } catch {
      setAnnouncement('Apply failed. The draft and preview remain available.');
    }
  };

  const handleControl = async (action: SimulationControlAction) => {
    await onControl(action);
    setAnnouncement(
      action === 'pause'
        ? 'Simulation will pause at the next safe agent boundary.'
        : action === 'step'
          ? 'One agent turn released. The simulation will pause again afterwards.'
          : 'Simulation resumed.',
    );
  };

  return (
    <div className='shrink-0 border-t border-border bg-background/95 backdrop-blur'>
      <Button
        type='button'
        variant='ghost'
        className='min-h-11 w-full justify-between rounded-none'
        onClick={() => setPanelOpen((open) => !open)}
        aria-label={panelOpen ? 'Collapse God Mode 2.0' : 'Open God Mode 2.0'}
        aria-expanded={panelOpen}
        aria-controls='god-mode-panel'
      >
        <span className='flex min-w-0 items-center gap-2'>
          <Terminal data-icon='inline-start' />
          <span>God Mode 2.0</span>
          <Badge variant='outline'>{mode === 'observe' ? 'Observe' : 'Intervene'}</Badge>
          <Badge variant={status === 'paused' ? 'secondary' : 'outline'}>{status}</Badge>
        </span>
        {panelOpen ? (
          <ChevronDown data-icon='inline-end' />
        ) : (
          <ChevronUp data-icon='inline-end' />
        )}
      </Button>

      <div
        id='god-mode-panel'
        className={cn(
          'max-h-[52vh] overflow-y-auto p-3 md:p-4',
          panelOpen ? 'block' : 'hidden',
        )}
      >
        <Card className='mx-auto max-w-5xl'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <WandSparkles className='size-4 text-primary' aria-hidden='true' />
              Intervention console
            </CardTitle>
            <CardDescription>
              Observe first, then preview a scoped, backend-authoritative intervention.
            </CardDescription>
            <CardAction>
              <Badge variant={status === 'paused' ? 'secondary' : 'outline'}>
                {status}
              </Badge>
            </CardAction>
          </CardHeader>

          <CardContent>
            <Tabs
              value={mode}
              onValueChange={(value) => void handleModeChange(value as ConsoleMode)}
            >
              <TabsList aria-label='God Mode console mode'>
                <TabsTrigger value='observe'>Observe</TabsTrigger>
                <TabsTrigger value='intervene' disabled={isCompleted}>Intervene</TabsTrigger>
              </TabsList>

              <TabsContent value='observe' className='flex flex-col gap-4'>
                <div className='flex flex-wrap gap-2' aria-label='Simulation controls'>
                  <Button
                    type='button'
                    variant='outline'
                    className='min-h-11'
                    disabled={interventionPending || status === 'paused' || isCompleted}
                    onClick={() => void handleControl('pause')}
                  >
                    <Pause data-icon='inline-start' />
                    Pause
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    className='min-h-11'
                    disabled={interventionPending || status !== 'paused' || isCompleted}
                    onClick={() => void handleControl('resume')}
                  >
                    <Play data-icon='inline-start' />
                    Resume
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    className='min-h-11'
                    disabled={interventionPending || status !== 'paused' || isCompleted}
                    onClick={() => void handleControl('step')}
                  >
                    <StepForward data-icon='inline-start' />
                    Step one agent
                  </Button>
                </div>

                {!isCompleted ? (
                  <div className='flex gap-2 overflow-x-auto pb-1' aria-label='Suggested interventions'>
                    {suggestions.map((suggestion) => {
                      const Icon = suggestion.icon;
                      return (
                        <Button
                          key={suggestion.id}
                          type='button'
                          variant='outline'
                          className='min-h-11 shrink-0'
                          onClick={() => chooseSuggestion(suggestion)}
                        >
                          <Icon data-icon='inline-start' />
                          {suggestion.label}
                        </Button>
                      );
                    })}
                  </div>
                ) : null}

                <div className='flex flex-col gap-3'>
                  <p className='font-medium'>Recent intervention receipts</p>
                  {recentInterventions.length > 0 ? (
                    recentInterventions.map((receipt) => (
                      <ReceiptCard
                        key={receipt.id}
                        receipt={receipt}
                        pending={interventionPending}
                        onUndo={onUndo}
                      />
                    ))
                  ) : (
                    <p className='text-muted-foreground'>No interventions have been applied.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value='intervene' className='flex flex-col gap-4'>
                <FieldGroup className='grid gap-4 md:grid-cols-2'>
                  <Field>
                    <FieldLabel htmlFor='intervention-target'>Target</FieldLabel>
                    <Select
                      value={draft.targetKind}
                      onValueChange={(value) => updateDraft({
                        targetKind: value as InterventionTargetKind,
                        targetId: value === 'agent' ? draft.targetId : undefined,
                      })}
                    >
                      <SelectTrigger id='intervention-target'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Intervention target</SelectLabel>
                          {TARGET_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>Every intervention has one explicit scope.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor='intervention-category'>Category</FieldLabel>
                    <Select
                      value={draft.category}
                      onValueChange={(value) => updateDraft({ category: value as InterventionCategory })}
                    >
                      <SelectTrigger id='intervention-category'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Effect category</SelectLabel>
                          {CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>Category determines custom command effects.</FieldDescription>
                  </Field>

                  {draft.targetKind === 'agent' ? (
                    <Field>
                      <FieldLabel htmlFor='intervention-agent'>Agent</FieldLabel>
                      <Select
                        value={draft.targetId}
                        onValueChange={(value) => updateDraft({
                          targetId: value ?? undefined,
                        })}
                      >
                        <SelectTrigger id='intervention-agent'>
                          <SelectValue placeholder='Choose an agent' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Active agents</SelectLabel>
                            {agents.filter((agent) => !agent.has_resigned).map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  ) : null}

                  <Field className='md:col-span-2' data-invalid={Boolean(localError)}>
                    <FieldLabel htmlFor='intervention-command'>Command</FieldLabel>
                    <Input
                      id='intervention-command'
                      value={draft.command}
                      placeholder='Describe a management intervention...'
                      disabled={draft.type !== 'custom'}
                      aria-invalid={Boolean(localError)}
                      onChange={(event) => updateDraft({
                        type: 'custom',
                        command: event.target.value,
                      })}
                    />
                    <FieldDescription>
                      {isDemo && draft.type === 'custom'
                        ? 'Custom wording uses category-based metric effects and does not branch the remaining scripted story.'
                        : getInterventionSemantics(draft.type, isDemo)}
                    </FieldDescription>
                    <FieldError>{localError}</FieldError>
                  </Field>
                </FieldGroup>

                {preview ? (
                  <Card size='sm'>
                    <CardHeader>
                      <CardTitle>Impact preview</CardTitle>
                      <CardDescription>
                        Target: {preview.target.label} · {preview.response_note}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-1'>
                      {preview.effects.length > 0 ? (
                        preview.effects.map((effect) => (
                          <p key={`${effect.scope}-${effect.key}`}>
                            {formatInterventionEffect(effect)}
                          </p>
                        ))
                      ) : (
                        <p>No direct metric change.</p>
                      )}
                    </CardContent>
                    {preview.confirmation_required ? (
                      <CardFooter className='flex-col items-start gap-3'>
                        <Alert>
                          <AlertTriangle aria-hidden='true' />
                          <AlertTitle>Confirmation required</AlertTitle>
                          <AlertDescription>
                            Applying this command changes people or project state. The receipt will record preview and actual effect.
                          </AlertDescription>
                        </Alert>
                        <Button
                          type='button'
                          disabled={interventionPending}
                          onClick={() => void handleApply()}
                        >
                          {interventionPending ? <Spinner data-icon='inline-start' /> : <CheckCircle2 data-icon='inline-start' />}
                          Confirm and apply
                        </Button>
                      </CardFooter>
                    ) : (
                      <CardFooter>
                        <Button
                          type='button'
                          disabled={interventionPending}
                          onClick={() => void handleApply()}
                        >
                          {interventionPending ? <Spinner data-icon='inline-start' /> : <CheckCircle2 data-icon='inline-start' />}
                          Apply intervention
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ) : (
                  <Button
                    type='button'
                    disabled={interventionPending || isCompleted}
                    onClick={() => void handlePreview()}
                  >
                    {interventionPending ? <Spinner data-icon='inline-start' /> : <WandSparkles data-icon='inline-start' />}
                    Preview impact
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className='flex-col items-start gap-1'>
            <p aria-live='polite'>{announcement}</p>
            {interventionError ? <p className='text-destructive'>{interventionError}</p> : null}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
