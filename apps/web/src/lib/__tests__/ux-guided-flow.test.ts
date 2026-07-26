import { describe, expect, it } from 'vitest';
import {
  getEditorGuidedFlowSteps,
  getNextGuidedFlowStep,
  getGuidedFlowAction,
  normalizeSearchQuery,
  templateMatchesSearch,
} from '@/lib/shared/ux-guided-flow';
import type { Template } from '@prisma/client';

function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'tpl-1',
    slug: 'betashar-gold-frame',
    nameRu: 'Беташар Gold Frame',
    nameKz: 'Беташар Gold Frame',
    descriptionRu: null,
    descriptionKz: null,
    category: 'betashar',
    previewImageUrl: '/assets/templates/betashar-gold-frame/preview.jpg',
    demoUrl: null,
    isActive: true,
    isFeatured: false,
    sortOrder: 1,
    priceKzt: 9900,
    config: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('ux guided flow', () => {
  it('normalizes search query', () => {
    expect(normalizeSearchQuery('  Betashar  ')).toBe('betashar');
  });

  it('matches template by localized name/category/slug', () => {
    const template = makeTemplate();
    expect(
      templateMatchesSearch({
        template,
        query: 'gold',
        locale: 'ru',
        categoryLabel: 'Беташар',
      }),
    ).toBe(true);
    expect(
      templateMatchesSearch({
        template,
        query: 'беташар',
        locale: 'ru',
        categoryLabel: 'Беташар',
      }),
    ).toBe(true);
    expect(
      templateMatchesSearch({
        template,
        query: 'corporate',
        locale: 'ru',
        categoryLabel: 'Беташар',
      }),
    ).toBe(false);
  });

  it('builds editor guided-flow completion', () => {
    const steps = getEditorGuidedFlowSteps({
      title: 'Той',
      eventDate: '2026-08-08',
      eventPlace: 'Алматы',
      guestsCount: 3,
      isPublished: false,
    });
    expect(steps).toEqual([
      { key: 'event', done: true },
      { key: 'guests', done: true },
      { key: 'publish', done: false },
    ]);
  });

  it('returns next incomplete guided step', () => {
    const steps = getEditorGuidedFlowSteps({
      title: 'Той',
      eventDate: '2026-08-08',
      eventPlace: '',
      guestsCount: 0,
      isPublished: false,
    });
    expect(getNextGuidedFlowStep(steps)?.key).toBe('event');
  });

  it('maps guided steps to editor actions', () => {
    expect(getGuidedFlowAction('guests')).toEqual({ type: 'panel', panel: 'guests' });
    expect(getGuidedFlowAction('publish')).toEqual({ type: 'publish' });
    expect(getGuidedFlowAction('event')).toEqual({ type: 'panel', panel: 'presets' });
  });
});
