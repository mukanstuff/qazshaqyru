import { describe, it, expect } from 'vitest';
import { convertLegacyToCanvas } from '../legacy-converter';
import { validateCanvasDocument } from '../validation';

describe('legacy converter', () => {
  it('converts a minimal wedding-luxury invite to a valid canvas document', () => {
    const doc = convertLegacyToCanvas({
      title: 'Той',
      eventType: 'wedding',
      eventDate: new Date('2026-09-12T16:00:00Z').toISOString(),
      eventTime: '18:00',
      eventPlace: 'Алау сарайы',
      address: 'Алматы, Достық 100',
      templateData: {},
      customText: { groomName: 'Айбек', brideName: 'Айдана' },
      eventTimezone: 'Asia/Almaty',
    });
    const result = validateCanvasDocument(doc);
    expect(result.ok).toBe(true);
    expect(doc.elements.length).toBeGreaterThan(4);
    expect(doc.elements.some((e) => e.type === 'couple-names')).toBe(true);
    expect(doc.elements.some((e) => e.type === 'countdown')).toBe(true);
    expect(doc.elements.some((e) => e.type === 'button')).toBe(true);
  });

  it('gracefully handles missing fields (empty legacy doc)', () => {
    const doc = convertLegacyToCanvas({});
    expect(doc.version).toBe(1);
    expect(doc.elements.length).toBeGreaterThan(0);
  });
});
