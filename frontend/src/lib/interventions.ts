import type {
  InterventionDraft,
  InterventionEffect,
  InterventionPreview,
  InterventionReceipt,
  InterventionType,
  SimulationControlAction,
} from '../app/simulation/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';


export interface InterventionValidation {
  valid: boolean;
  error: string | null;
}


export function formatInterventionEffect(effect: InterventionEffect): string {
  const sign = effect.delta > 0 ? '+' : '';
  const unit = effect.unit === '%' ? '%' : ' step';
  return `${effect.scope_label} · ${effect.label}: ${sign}${effect.delta}${unit}`;
}


export function validateInterventionDraft(
  draft: Partial<InterventionDraft>,
): InterventionValidation {
  if (!draft.type) {
    return { valid: false, error: 'Choose an intervention type.' };
  }
  if (!draft.targetKind) {
    return { valid: false, error: 'Choose who or what this intervention targets.' };
  }
  if (draft.targetKind === 'agent' && !draft.targetId) {
    return { valid: false, error: 'Choose a specific agent.' };
  }
  if (!draft.category) {
    return { valid: false, error: 'Choose an intervention category.' };
  }
  if (draft.type === 'custom' && !draft.command?.trim()) {
    return { valid: false, error: 'Describe the management intervention.' };
  }
  return { valid: true, error: null };
}


export function getInterventionSemantics(
  type: InterventionType,
  isDemo: boolean,
): string {
  if (type !== 'custom') {
    return 'This deterministic preset applies the previewed effects exactly.';
  }
  if (isDemo) {
    return 'Custom wording uses category-based metric effects in this scripted demo and does not branch the remaining story.';
  }
  return 'Custom wording uses category-based effects; the next agent receives the command as context.';
}


export function buildInterventionRequest(
  draft: InterventionDraft,
  previewToken?: string,
  confirmed = false,
) {
  return {
    type: draft.type,
    custom_message: draft.type === 'custom' ? draft.command.trim() : undefined,
    category: draft.category,
    target: {
      kind: draft.targetKind,
      ...(draft.targetKind === 'agent' ? { id: draft.targetId } : {}),
    },
    preview_token: previewToken,
    confirmed,
  };
}


function isReceipt(value: unknown): value is InterventionReceipt {
  return Boolean(
    value
    && typeof value === 'object'
    && 'id' in value
    && typeof value.id === 'string',
  );
}


export function normalizeInterventionReceipts(
  current: InterventionReceipt[],
  payload: unknown,
): InterventionReceipt[] {
  const body = payload && typeof payload === 'object'
    ? payload as Record<string, unknown>
    : {};
  const incoming = Array.isArray(body.interventions)
    ? body.interventions.filter(isReceipt)
    : [body.receipt, body.message, payload].filter(isReceipt);
  if (incoming.length === 0) return current;

  const next = new Map(current.map((receipt) => [receipt.id, receipt]));
  for (const receipt of incoming) next.set(receipt.id, receipt);
  return [...next.values()];
}


async function requestJson<T>(
  path: string,
  init: RequestInit,
  fetcher: typeof fetch,
): Promise<T> {
  const response = await fetcher(`${API_BASE}${path}`, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof body.detail === 'string'
      ? body.detail
      : 'Intervention request failed.';
    throw new Error(detail);
  }
  return body as T;
}


const JSON_HEADERS = { 'Content-Type': 'application/json' };


export async function previewIntervention(
  simId: string,
  draft: InterventionDraft,
  fetcher: typeof fetch = fetch,
): Promise<InterventionPreview> {
  return requestJson(
    `/api/simulation/${simId}/interventions/preview`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(buildInterventionRequest(draft)),
    },
    fetcher,
  );
}


export async function applyIntervention(
  simId: string,
  draft: InterventionDraft,
  previewToken: string,
  confirmed: boolean,
  fetcher: typeof fetch = fetch,
): Promise<InterventionReceipt> {
  const body = await requestJson<Record<string, unknown>>(
    `/api/simulation/${simId}/intervene`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(
        buildInterventionRequest(draft, previewToken, confirmed),
      ),
    },
    fetcher,
  );
  const receipt = body.receipt ?? body.message ?? body;
  if (!isReceipt(receipt)) throw new Error('Intervention receipt was missing.');
  return receipt;
}


export async function undoIntervention(
  simId: string,
  interventionId: string,
  fetcher: typeof fetch = fetch,
): Promise<InterventionReceipt> {
  return requestJson(
    `/api/simulation/${simId}/interventions/${interventionId}/undo`,
    { method: 'POST', headers: JSON_HEADERS },
    fetcher,
  );
}


export async function controlSimulation(
  simId: string,
  action: SimulationControlAction,
  fetcher: typeof fetch = fetch,
): Promise<{ status: string; step_remaining: number }> {
  return requestJson(
    `/api/simulation/${simId}/control`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ action }),
    },
    fetcher,
  );
}
