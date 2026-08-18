/**
 * 2026-08-18 (Phase 2, hub screen): tests for the user-content-preservation
 * logic in switch-template. Specifically:
 *
 *  - couple-names from the OLD canvas survive the template switch
 *  - decorative blocks from the NEW template are not dropped
 *  - zIndex is re-numbered contiguously after the splice
 *  - the user's couple-names win over any template-built-in couple-names
 */
import { describe, it, expect } from 'vitest';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';
import { nanoid } from 'nanoid';

import { __test__ as switchTemplate } from '@/lib/invitations/switch-template';

function makeDoc(elements: unknown[]): InvitationCanvasDocument {
  return {
    version: 1,
    width: 390,
    background: { type: 'solid', color: '#fff' },
    elements: elements as never,
  };
}

const coupleNames = (overrides: Record<string, unknown> = {}) => ({
  id: nanoid(10),
  type: 'couple-names' as const,
  x: 5,
  y: 50,
  w: 90,
  h: 'auto' as const,
  rotation: 0,
  zIndex: 5,
  locked: false,
  hidden: false,
  first: 'Aset',
  second: 'Aiyim',
  connector: '&' as const,
  font: 'Cormorant' as const,
  fontSize: 56,
  color: '#6b1d3a',
  ...overrides,
});

describe('switch-template — mergeCoupleNamesInto', () => {
  it('inserts user couple-names into the new canvas', () => {
    const target = makeDoc([
      { id: 'a', type: 'image', zIndex: 1 },
      { id: 'b', type: 'divider', zIndex: 2 },
    ]);
    const incoming = [coupleNames({ first: 'Aset', second: 'Aiyim' })];

    const result = switchTemplate.mergeCoupleNamesInto(target, incoming);

    const coupleNamesInResult = result.elements.filter((el) => el.type === 'couple-names');
    expect(coupleNamesInResult).toHaveLength(1);
    expect((coupleNamesInResult[0] as { first: string }).first).toBe('Aset');
    expect((coupleNamesInResult[0] as { second: string }).second).toBe('Aiyim');
    // Other elements are preserved.
    expect(result.elements.find((el) => el.id === 'a')).toBeDefined();
    expect(result.elements.find((el) => el.id === 'b')).toBeDefined();
  });

  it('removes template-supplied couple-names so user data wins', () => {
    const target = makeDoc([
      { id: 'cn-tpl', type: 'couple-names', zIndex: 1, first: 'Tpl', second: 'One' },
      { id: 'a', type: 'divider', zIndex: 2 },
    ]);
    const incoming = [coupleNames({ first: 'User', second: 'Data' })];

    const result = switchTemplate.mergeCoupleNamesInto(target, incoming);

    const coupleNamesInResult = result.elements.filter((el) => el.type === 'couple-names');
    expect(coupleNamesInResult).toHaveLength(1);
    expect((coupleNamesInResult[0] as { first: string }).first).toBe('User');
  });

  it('re-numbers zIndex contiguously', () => {
    const target = makeDoc([
      { id: 'a', type: 'divider', zIndex: 1 },
      { id: 'b', type: 'divider', zIndex: 2 },
      { id: 'c', type: 'divider', zIndex: 3 },
    ]);
    const incoming = [coupleNames({}), coupleNames({})];

    const result = switchTemplate.mergeCoupleNamesInto(target, incoming);

    result.elements.forEach((el, i) => {
      expect(el.zIndex).toBe(i + 1);
    });
  });

  it('returns target unchanged when incoming is empty', () => {
    const target = makeDoc([{ id: 'a', type: 'divider', zIndex: 1 }]);
    const before = JSON.stringify(target);
    const result = switchTemplate.mergeCoupleNamesInto(target, []);
    expect(JSON.stringify(result)).toBe(before);
  });
});

describe('switch-template — extractCoupleNames (id re-mint)', () => {
  it('renames the id of each couple-names element', () => {
    const oldCanvas = makeDoc([
      coupleNames({ id: 'old-cn-1' }),
      coupleNames({ id: 'old-cn-2' }),
    ]);
    const extracted = switchTemplate.extractCoupleNames(oldCanvas);
    expect(extracted).toHaveLength(2);
    extracted.forEach((el) => {
      expect(el.id).not.toBe('old-cn-1');
      expect(el.id).not.toBe('old-cn-2');
    });
    // All ids distinct.
    const ids = new Set(extracted.map((el) => el.id));
    expect(ids.size).toBe(2);
  });
});