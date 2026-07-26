import { describe, it, expect } from 'vitest';
import { buildPublishChecklist, isPublishChecklistReady } from '@/lib/invitations/publish-checklist';

describe('publish checklist', () => {
  it('marks incomplete invitations', () => {
    const items = buildPublishChecklist({
      title: '',
      eventDate: '2026-12-01',
      eventPlace: 'Алматы',
    });
    expect(isPublishChecklistReady(items)).toBe(false);
    expect(items.find((i) => i.id === 'title')?.ok).toBe(false);
  });

  it('marks complete invitations', () => {
    const items = buildPublishChecklist({
      title: 'Той Айгүл',
      eventDate: '2026-12-01',
      eventPlace: 'Алматы',
      hasCouplePhoto: false,
      hasProgram: false,
    });
    expect(isPublishChecklistReady(items)).toBe(true);
  });

  it('allows publish without place', () => {
    const items = buildPublishChecklist({
      title: 'Той Айгүл',
      eventDate: '2026-12-01',
      eventPlace: '',
    });
    expect(isPublishChecklistReady(items)).toBe(true);
    expect(items.find((i) => i.id === 'place')?.required).toBe(false);
  });
});
