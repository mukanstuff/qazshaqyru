import { describe, it, expect } from 'vitest';
import { canvasDocumentSchema, canvasElementSchema } from '../schemas';
import { createEmptyDocument, addElement } from '../mutations';

describe('canvas zod schemas', () => {
  it('validates an empty document', () => {
    const empty = createEmptyDocument();
    const parsed = canvasDocumentSchema.safeParse(empty);
    expect(parsed.success).toBe(true);
  });

  it('rejects javascript: urls in image src/links', () => {
    const doc = addElement(createEmptyDocument(), 'image', { src: 'javascript:alert(1)' });
    const parsed = canvasDocumentSchema.safeParse(doc);
    expect(parsed.success).toBe(false);
  });

  it('accepts legitimate https urls', () => {
    const doc = addElement(createEmptyDocument(), 'image', {
      src: 'https://cdn.qazshaqyru.kz/invitations/abc.webp',
    });
    const parsed = canvasDocumentSchema.safeParse(doc);
    expect(parsed.success).toBe(true);
  });

  it('rejects element with x > 100 (out-of-bounds percent)', () => {
    const bad = {
      id: 'x',
      type: 'text' as const,
      x: 150,
      y: 0,
      w: 50,
      h: 'auto' as const,
      rotation: 0,
      zIndex: 1,
      locked: false,
      hidden: false,
      text: 'hi',
      fontFamily: 'Montserrat' as const,
      fontSize: 16,
      fontWeight: 400 as const,
      color: '#000',
      textAlign: 'center' as const,
      lineHeight: 1.4,
      letterSpacing: 0,
    };
    expect(canvasElementSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects hex color garbage', () => {
    const bad = addElement(createEmptyDocument(), 'text');
    (bad.elements[0] as { color: string }).color = 'not-a-color';
    expect(canvasDocumentSchema.safeParse(bad).success).toBe(false);
  });
});
