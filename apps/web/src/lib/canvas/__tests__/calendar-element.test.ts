import { describe, expect, it } from 'vitest';
import { canvasDocumentSchema } from '../schemas';
import { addElement, createEmptyDocument } from '../mutations';

/**
 * The month grid itself is built inside CalendarElementView; these tests cover
 * the contract around it — that a calendar element round-trips through Zod,
 * and that the geometry/pinning fields the renderer depends on validate.
 */
describe('calendar element', () => {
  it('round-trips through the document schema', () => {
    const doc = addElement(createEmptyDocument(), 'calendar', {
      targetIso: '2027-05-15T12:00:00.000Z',
    });
    const parsed = canvasDocumentSchema.safeParse(doc);
    expect(parsed.success).toBe(true);
  });

  it('defaults to a Kazakh-capable font', () => {
    const doc = addElement(createEmptyDocument(), 'calendar');
    const el = doc.elements[0] as { fontFamily: string };
    // Unbounded / Tenor Sans / Marck cannot render Ә Ғ Қ Ң Ө Ұ Ү Һ.
    expect(['Cormorant', 'Montserrat', 'Forum', 'Prata']).toContain(el.fontFamily);
  });

  it('rejects an unknown mark style', () => {
    const doc = addElement(createEmptyDocument(), 'calendar');
    (doc.elements[0] as { markStyle: string }).markStyle = 'sparkle';
    expect(canvasDocumentSchema.safeParse(doc).success).toBe(false);
  });
});

describe('pinned elements', () => {
  it('accepts a pinned corner with offsets', () => {
    const doc = addElement(createEmptyDocument(), 'music');
    (doc.elements[0] as unknown as Record<string, unknown>).pinned = {
      corner: 'bottom-right',
      offsetX: 16,
      offsetY: 24,
    };
    expect(canvasDocumentSchema.safeParse(doc).success).toBe(true);
  });

  it('rejects an invalid corner', () => {
    const doc = addElement(createEmptyDocument(), 'music');
    (doc.elements[0] as unknown as Record<string, unknown>).pinned = {
      corner: 'middle',
      offsetX: 16,
      offsetY: 24,
    };
    expect(canvasDocumentSchema.safeParse(doc).success).toBe(false);
  });
});
