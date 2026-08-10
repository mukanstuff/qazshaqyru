import { describe, it, expect } from 'vitest';
import { snapElementPosition, snapFinal } from '../snap-guides';
import type { CanvasElement } from '../types';

describe('snapElementPosition', () => {
  const mockElements: CanvasElement[] = [
    {
      id: 'el-1',
      type: 'text',
      x: 10,
      y: 100,
      w: 30,
      h: 40,
      rotation: 0,
      zIndex: 1,
      locked: false,
      hidden: false,
      text: 'Hello',
      fontFamily: 'Montserrat',
      fontSize: 16,
      fontWeight: 400,
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.4,
      letterSpacing: 0,
    },
  ];

  it('snaps to left edge of another element when within threshold', () => {
    const res = snapElementPosition('el-2', 10.8, 250, 20, 40, mockElements);
    expect(res.x).toBe(10);
    expect(res.guides).toContainEqual({ type: 'vertical', pos: 10 });
  });

  it('snaps to center of another element when within threshold', () => {
    // el-1 center is 10 + 30/2 = 25
    // target width is 20, so center targetX would be 25 - 20/2 = 15
    const res = snapElementPosition('el-2', 15.6, 250, 20, 40, mockElements);
    expect(res.x).toBe(15);
    expect(res.guides).toContainEqual({ type: 'vertical', pos: 25 });
  });

  it('snaps to grid when snapGrid option is true', () => {
    const res = snapElementPosition('el-2', 12, 103, 20, 40, mockElements, {
      snapGrid: true,
      gridStepX: 5,
      gridStepY: 20,
    });
    expect(res.x).toBe(10);
    expect(res.y).toBe(100);
  });
});

describe('snapFinal (Stage 1)', () => {
  const sibling: CanvasElement[] = [
    {
      id: 'el-1',
      type: 'text',
      x: 10,
      y: 100,
      w: 30,
      h: 40,
      rotation: 0,
      zIndex: 1,
      locked: false,
      hidden: false,
      text: 'a',
      fontFamily: 'Montserrat',
      fontSize: 16,
      fontWeight: 400,
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.4,
      letterSpacing: 0,
    },
  ];

  it('snaps to document-center horizontally when within threshold', () => {
    // w=20 → doc center x = 50 - 10 = 40
    const res = snapFinal('el-2', 40.3, 250, 20, 40, sibling);
    expect(res.x).toBe(40);
  });

  it('does not snap to center when outside threshold', () => {
    const res = snapFinal('el-2', 55, 250, 20, 40, sibling);
    expect(res.x).toBe(55);
  });

  it('snaps to sibling left edge', () => {
    const res = snapFinal('el-2', 10.4, 250, 20, 40, sibling);
    expect(res.x).toBe(10);
  });

  it('skips self and hidden elements', () => {
    const hidden: CanvasElement[] = [
      { ...sibling[0], hidden: true },
    ];
    const res = snapFinal('el-2', 55, 250, 20, 40, hidden);
    expect(res.x).toBe(55);
  });
});
