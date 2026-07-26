/** RSVP status values accepted from guest forms and APIs. */
export const RSVP_STATUSES = [
  'attending',
  'not_attending',
  'attending_plus_one',
  'attending_no_children',
] as const;

export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export function isRsvpStatus(value: string): value is RsvpStatus {
  return (RSVP_STATUSES as readonly string[]).includes(value);
}

/**
 * Validates RSVP status against guest capabilities.
 * `attending_plus_one` requires hasPlusOne; other statuses are always allowed.
 */
export function validateRsvpStatus(status: string, hasPlusOne: boolean): boolean {
  if (!isRsvpStatus(status)) return false;
  if (status === 'attending_plus_one' && !hasPlusOne) return false;
  return true;
}

/** Statuses that count as confirmed attendance for dashboard stats. */
export function isAttendingStatus(status: string): boolean {
  return status === 'attending' || status === 'attending_plus_one' || status === 'attending_no_children';
}
