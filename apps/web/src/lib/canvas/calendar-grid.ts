/**
 * Month-grid maths for the `calendar` canvas element.
 *
 * Kept out of the React component so the day arithmetic — the part that is
 * genuinely easy to get wrong — can be unit tested directly.
 *
 * Weeks start on Monday (the KZ/RU convention), which is why the leading
 * blank count is `(getUTCDay() + 6) % 7` rather than `getUTCDay()`.
 * Everything is computed in UTC so the grid does not shift by a day for
 * viewers east or west of the event's timezone.
 */

export interface CalendarCell {
  /** Day number, or null for a blank pad cell when adjacent days are hidden. */
  day: number | null;
  /** True for days belonging to the previous or next month. */
  adjacent: boolean;
}

/** Days in a month. `month` is 0-based, matching Date.getUTCMonth(). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Index of the first day of the month, 0 = Monday … 6 = Sunday. */
export function firstWeekdayIndex(year: number, month: number): number {
  return (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
}

/**
 * Build a whole number of weeks covering `month`, padded at both ends.
 * The result length is always a multiple of 7.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  showAdjacentDays = false
): CalendarCell[] {
  const total = daysInMonth(year, month);
  const lead = firstWeekdayIndex(year, month);
  const prevTotal = daysInMonth(year, month - 1);

  const cells: CalendarCell[] = [];

  for (let i = 0; i < lead; i += 1) {
    cells.push(
      showAdjacentDays
        ? { day: prevTotal - lead + 1 + i, adjacent: true }
        : { day: null, adjacent: true }
    );
  }

  for (let d = 1; d <= total; d += 1) {
    cells.push({ day: d, adjacent: false });
  }

  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push(showAdjacentDays ? { day: next, adjacent: true } : { day: null, adjacent: true });
    next += 1;
  }

  return cells;
}
