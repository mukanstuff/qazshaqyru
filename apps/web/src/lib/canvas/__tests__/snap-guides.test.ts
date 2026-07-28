import { describe, it, expect } from 'vitest';
import { snapElementPosition } from '../snap-guides';
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
