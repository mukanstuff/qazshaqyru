import type { Template } from '@prisma/client';

export interface EditorGuidedFlowStep {
  key: 'event' | 'guests' | 'publish';
  done: boolean;
}

export type GuidedFlowPanel = 'guests' | 'presets';

export type GuidedFlowAction =
  | { type: 'panel'; panel: GuidedFlowPanel }
  | { type: 'publish' }
  | { type: 'scroll-preview' };
export function normalizeSearchQuery(value: string): string {
  return value.trim().toLowerCase();
}

export function templateMatchesSearch(params: {
  template: Template;
  query: string;
  locale: 'ru' | 'kz';
  categoryLabel: string;
}): boolean {
  const normalized = normalizeSearchQuery(params.query);
  if (!normalized) {
    return true;
  }

  const displayName = params.locale === 'kz' ? params.template.nameKz : params.template.nameRu;
  const searchable = `${displayName} ${params.categoryLabel} ${params.template.slug}`.toLowerCase();
  return searchable.includes(normalized);
}

export function getEditorGuidedFlowSteps(params: {
  title: string;
  eventDate: string;
  eventPlace?: string | null;
  guestsCount: number;
  isPublished: boolean;
}): EditorGuidedFlowStep[] {
  const hasTitle = params.title.trim().length > 0;
  const hasDate = params.eventDate.trim().length > 0;
  const hasPlace = (params.eventPlace ?? '').trim().length > 0;
  const hasGuests = params.guestsCount > 0;

  return [
    { key: 'event', done: hasTitle && hasDate && hasPlace },
    { key: 'guests', done: hasGuests },
    { key: 'publish', done: params.isPublished },
  ];
}

export function getNextGuidedFlowStep(steps: EditorGuidedFlowStep[]): EditorGuidedFlowStep | null {
  return steps.find((step) => !step.done) ?? null;
}

export function getGuidedFlowAction(stepKey: EditorGuidedFlowStep['key']): GuidedFlowAction {
  if (stepKey === 'guests') return { type: 'panel', panel: 'guests' };
  if (stepKey === 'publish') return { type: 'publish' };
  if (stepKey === 'event') return { type: 'panel', panel: 'presets' };
  return { type: 'scroll-preview' };
}