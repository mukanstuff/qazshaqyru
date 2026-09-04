/**
 * Zoom steps for the hall.
 *
 * 1 is fit-to-width — the plan is authored in a fixed HALL_W × HALL_H space
 * and scaled to whatever width the surface gets, so there is nothing useful
 * below fit. Everything above it exists because a hall with twenty tables on a
 * 375px phone renders each table about forty pixels across, which is neither
 * readable nor reliably draggable.
 */
export const ZOOM_STEPS = [1, 1.5, 2, 3] as const;

export function nextZoom(current: number, direction: 1 | -1): number {
  const i = ZOOM_STEPS.indexOf(current as (typeof ZOOM_STEPS)[number]);
  const from = i === -1 ? 0 : i;
  return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, from + direction))];
}
