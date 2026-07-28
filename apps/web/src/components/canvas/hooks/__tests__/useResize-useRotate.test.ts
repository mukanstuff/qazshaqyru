import { describe, it, expect } from 'vitest';
import { calculateResizeCoords } from '../useResize';
import { calculateRotationAngle } from '../useRotate';

describe('useResize calculation helpers', () => {
  it('calculates se handle resize correctly without shift', () => {
    const coords = calculateResizeCoords(
      'se',
      { x: 10, y: 50, w: 30, h: 60 },
      100, // +100px
      30,  // +30px
      400, // stageWidth 400 => 1% = 4px
      1,
      false
    );

    // dxPercent = 100 / 4 = 25% => newW = 30 + 25 = 55%
    // dy = 30px => newH = 60 + 30 = 90
    expect(coords).toEqual({
      x: 10,
      y: 50,
      w: 55,
      h: 90,
    });
  });

  it('calculates nw handle resize correctly', () => {
    const coords = calculateResizeCoords(
      'nw',
      { x: 20, y: 100, w: 40, h: 80 },
      40,  // +40px -> +10%
      20,  // +20px
      400, // stageWidth 400 => 1% = 4px
      1,
      false
    );

    // For left handle: newW = max(5, startW - dxPercent) = 40 - 10 = 30
    // newX = startX + (startW - newW) = 20 + 10 = 30
    // For top handle: newH = max(20, startH - dy) = 80 - 20 = 60
    // newY = startY + (startH - newH) = 100 + 20 = 120
    expect(coords).toEqual({
      x: 30,
      y: 120,
      w: 30,
      h: 60,
    });
  });

  it('preserves aspect ratio when shiftKey is true', () => {
    const coords = calculateResizeCoords(
      'se',
      { x: 0, y: 0, w: 20, h: 40 }, // ratio = 40/20 = 2 px per percent
      40,  // +40px => +10%
      100, // dyPx is ignored because shiftKey calculates dy from dx
      400,
      1,
      true
    );

    // dxPercent = 10 => newW = 30
    // dy = dxPercent * ratio = 10 * 2 = 20 => newH = 40 + 20 = 60
    expect(coords).toEqual({
      x: 0,
      y: 0,
      w: 30,
      h: 60,
    });
  });

  it('handles h = auto gracefully', () => {
    const coords = calculateResizeCoords(
      'se',
      { x: 10, y: 10, w: 50, h: 'auto' },
      20,
      30,
      400,
      1,
      false
    );
    expect(coords.w).toBe(55);
    expect(coords.h).toBe('auto');
  });
});

describe('useRotate calculation helpers', () => {
  it('computes rotation angle 0 degrees at 12 o clock', () => {
    // Center at (100, 100). Point at (100, 50) -> straight up (12 o'clock)
    const deg = calculateRotationAngle(100, 100, 100, 50, false);
    expect(deg).toBe(0);
  });

  it('computes rotation angle 90 degrees at 3 o clock', () => {
    // Center at (100, 100). Point at (150, 100) -> right (3 o'clock)
    const deg = calculateRotationAngle(100, 100, 150, 100, false);
    expect(deg).toBe(90);
  });

  it('snaps to 15-degree increments when shiftKey is true', () => {
    // 97 degrees should snap to 90 or 105; 97 is closer to 105 (97 / 15 = 6.46 -> 6 -> 90)
    // Let's test an angle around 93 degrees -> snaps to 90
    // Let's check dx, dy for an angle slightly past 3 o'clock:
    // dx = 100, dy = 10 => rad = atan2(10, 100) = 0.0996 rad => 5.7 deg => +90 = 95.7 deg
    // 95.7 / 15 = 6.38 -> round to 6 * 15 = 90
    const deg = calculateRotationAngle(100, 100, 200, 110, true);
    expect(deg).toBe(90);
  });
});
