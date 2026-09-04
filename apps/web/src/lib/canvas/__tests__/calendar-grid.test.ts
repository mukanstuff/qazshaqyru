import { describe, expect, it } from 'vitest';
import { buildMonthGrid, daysInMonth, firstWeekdayIndex } from '../calendar-grid';

describe('daysInMonth', () => {
  it('handles the 31/30 months', () => {
    expect(daysInMonth(2027, 0)).toBe(31); // January
    expect(daysInMonth(2027, 3)).toBe(30); // April
    expect(daysInMonth(2027, 11)).toBe(31); // December
  });

  it('handles February across leap rules', () => {
    expect(daysInMonth(2027, 1)).toBe(28); // common year
    expect(daysInMonth(2028, 1)).toBe(29); // divisible by 4
    expect(daysInMonth(1900, 1)).toBe(28); // century, not divisible by 400
    expect(daysInMonth(2000, 1)).toBe(29); // divisible by 400
  });

  it('rolls over when asked for the month before January', () => {
    // month = -1 must mean December of the previous year, which is what the
    // grid relies on to fill leading adjacent days.
    expect(daysInMonth(2027, -1)).toBe(31);
  });
});

describe('firstWeekdayIndex (0 = Monday)', () => {
  it('places known dates correctly', () => {
    // 1 May 2027 is a Saturday → index 5.
    expect(firstWeekdayIndex(2027, 4)).toBe(5);
    // 1 Jan 2027 is a Friday → index 4.
    expect(firstWeekdayIndex(2027, 0)).toBe(4);
    // 1 Mar 2027 is a Monday → index 0.
    expect(firstWeekdayIndex(2027, 2)).toBe(0);
  });
});

describe('buildMonthGrid', () => {
  it('always returns whole weeks', () => {
    for (let m = 0; m < 12; m += 1) {
      expect(buildMonthGrid(2027, m).length % 7).toBe(0);
    }
  });

  it('puts the event day in the right column', () => {
    // May 2027 starts on Saturday, so the grid leads with 5 blanks and
    // 15 May must land in the Saturday column (index 5 of its row).
    const cells = buildMonthGrid(2027, 4);
    const idx = cells.findIndex((c) => !c.adjacent && c.day === 15);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx % 7).toBe(5);
  });

  it('contains every day of the month exactly once', () => {
    const cells = buildMonthGrid(2028, 1); // leap February
    const own = cells.filter((c) => !c.adjacent).map((c) => c.day);
    expect(own).toEqual(Array.from({ length: 29 }, (_, i) => i + 1));
  });

  it('pads with blanks by default and with real days when asked', () => {
    const blanks = buildMonthGrid(2027, 4, false);
    expect(blanks.slice(0, 5).every((c) => c.day === null && c.adjacent)).toBe(true);

    const adjacent = buildMonthGrid(2027, 4, true);
    // April 2027 has 30 days, so the leading cells are 26..30.
    expect(adjacent.slice(0, 5).map((c) => c.day)).toEqual([26, 27, 28, 29, 30]);
    expect(adjacent.slice(0, 5).every((c) => c.adjacent)).toBe(true);
  });

  it('needs no padding when a month exactly fills its weeks', () => {
    // February 2027: starts Monday, 28 days → exactly 4 rows, no pad cells.
    const cells = buildMonthGrid(2027, 1);
    expect(cells).toHaveLength(28);
    expect(cells.every((c) => !c.adjacent)).toBe(true);
  });
});
