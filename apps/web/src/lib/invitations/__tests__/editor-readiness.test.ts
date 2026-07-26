import { describe, it, expect } from 'vitest';
import type { InvitationDocument, InvitationDocumentMeta } from '@/lib/invitations/document';
import { computeReadiness, stepToSectionType } from '@/lib/invitations/editor-readiness';

const defaultMeta: InvitationDocumentMeta = {
  id: 'draft',
  slug: 'draft',
  title: '',
  eventType: 'wedding',
  eventDate: '',
  eventTimezone: 'Asia/Almaty',
  language: 'ru',
  isPast: false,
  templateKey: 'wedding-luxury',
  status: 'draft',
};

function baseDoc(patch?: {
  meta?: Partial<InvitationDocumentMeta>;
  customText?: Record<string, unknown>;
  templateData?: Record<string, unknown>;
  sections?: InvitationDocument['sections'];
}): InvitationDocument {
  return {
    schemaVersion: 1,
    meta: { ...defaultMeta, ...patch?.meta },
    fields: [],
    sections: patch?.sections ?? [
      {
        id: 'hero',
        type: 'hero-names',
        visible: true,
        order: 0,
        canHide: false,
        canReorder: false,
        bindings: {},
      },
      {
        id: 'rsvp',
        type: 'rsvp',
        visible: true,
        order: 1,
        canHide: true,
        canReorder: false,
        bindings: {},
      },
    ],
    templateData: patch?.templateData ?? {},
    customText: patch?.customText ?? {},
    guests: [],
  };
}

describe('computeReadiness', () => {
  it('flags missing names and date as blocking', () => {
    const result = computeReadiness(baseDoc());
    expect(result.requiredComplete).toBe(false);
    expect(result.blockingIssues.map((i) => i.id)).toEqual(
      expect.arrayContaining(['missing-names', 'missing-date', 'not-ready-publish']),
    );
    expect(result.nextAction?.id).toBe('missing-names');
  });

  it('marks basics and datetime complete when filled', () => {
    const result = computeReadiness(
      baseDoc({
        meta: {
          title: 'Айгүл & Ерлан',
          eventDate: '2026-12-01T12:00:00.000Z',
          eventPlace: 'Алматы',
        },
        customText: { groomName: 'Ерлан', brideName: 'Айгүл' },
        templateData: { coverPhoto: 'https://example.com/a.jpg' },
      }),
    );
    expect(result.steps.find((s) => s.id === 'basics')?.completed).toBe(true);
    expect(result.steps.find((s) => s.id === 'datetime')?.completed).toBe(true);
    expect(result.steps.find((s) => s.id === 'cover')?.completed).toBe(true);
    expect(result.steps.find((s) => s.id === 'location')?.completed).toBe(true);
    expect(result.requiredComplete).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.readinessScore).toBeGreaterThanOrEqual(70);
  });

  it('warns when cover and place missing but still publishable', () => {
    const result = computeReadiness(
      baseDoc({
        meta: {
          title: 'Той',
          eventDate: '2026-12-01',
        },
        customText: { groomName: 'Ерлан', brideName: 'Айгүл' },
      }),
    );
    expect(result.requiredComplete).toBe(true);
    expect(result.warnings.map((i) => i.id)).toEqual(
      expect.arrayContaining(['missing-cover', 'missing-place']),
    );
  });

  it('localizes cover warning for kz', () => {
    const result = computeReadiness(
      baseDoc({
        meta: {
          title: 'Той',
          eventDate: '2026-12-01',
        },
        customText: { groomName: 'Ерлан', brideName: 'Айгүл' },
      }),
      'kz',
    );
    const cover = result.warnings.find((i) => i.id === 'missing-cover');
    expect(cover?.title).toBe('Мұқаба фотосы жоқ');
    expect(result.steps.find((s) => s.id === 'basics')?.label).toBe('Есімдер');
  });

  it('maps steps to section types', () => {
    expect(stepToSectionType('basics')).toBe('hero-names');
    expect(stepToSectionType('publish')).toBeNull();
  });
});
