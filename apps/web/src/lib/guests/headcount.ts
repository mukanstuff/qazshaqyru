import { isAttendingStatus } from '@/lib/guests/rsvp-status';

export type HeadcountGuest = {
  id: string;
  name: string;
  householdLabel?: string | null;
  hasPlusOne?: boolean;
  plusOneName?: string | null;
  responseStatus?: string | null;
};

export type HouseholdHeadcount = {
  label: string;
  guestIds: string[];
  seats: number;
  status: 'attending' | 'pending' | 'not_attending' | 'mixed';
};

/** Seats one RSVP row contributes for banquet / restaurant. */
export function seatsForRsvpStatus(
  status: string | null | undefined,
  hasPlusOne = false
): number {
  if (!status || status === 'pending') return 0;
  if (status === 'not_attending') return 0;
  if (status === 'attending_plus_one') return hasPlusOne ? 2 : 1;
  if (status === 'attending' || status === 'attending_no_children') return 1;
  if (isAttendingStatus(status)) return 1;
  return 0;
}

/** Confirmed banquet seats across guests. Pending guests do not count. */
export function computeConfirmedHeadcount(guests: HeadcountGuest[]): number {
  return guests.reduce(
    (sum, g) => sum + seatsForRsvpStatus(g.responseStatus, Boolean(g.hasPlusOne)),
    0
  );
}

/**
 * Seats one RSVP row is expected to need when planning (as opposed to
 * `seatsForRsvpStatus`, which only counts already-confirmed seats).
 * Pending guests are assumed to be coming, so a plan doesn't under-provision.
 *
 * Seating capacity is enforced with this same function, so "20 confirmed
 * seats" on the hub and "this table is full" in the seating plan can never
 * disagree about what a guest costs.
 */
export function expectedSeatsForRsvpStatus(
  status: string | null | undefined,
  hasPlusOne = false
): number {
  if (status === 'not_attending') return 0;
  if (status === 'attending_plus_one') return hasPlusOne ? 2 : 1;
  if (status === 'attending' || status === 'attending_no_children') return 1;
  // pending (or unknown): assume coming; 2 if a plus-one is allowed
  return hasPlusOne ? 2 : 1;
}

/** Max seats if every pending guest comes (attending) / plus-one when allowed. */
export function computeExpectedHeadcount(guests: HeadcountGuest[]): number {
  return guests.reduce(
    (sum, g) => sum + expectedSeatsForRsvpStatus(g.responseStatus ?? 'pending', Boolean(g.hasPlusOne)),
    0
  );
}

export function groupHouseholds(guests: HeadcountGuest[]): HouseholdHeadcount[] {
  const map = new Map<string, HeadcountGuest[]>();

  for (const guest of guests) {
    const label = (guest.householdLabel?.trim() || guest.name).trim() || 'Гость';
    const list = map.get(label) ?? [];
    list.push(guest);
    map.set(label, list);
  }

  return Array.from(map.entries()).map(([label, rows]) => {
    const seats = rows.reduce(
      (sum, g) => sum + seatsForRsvpStatus(g.responseStatus, Boolean(g.hasPlusOne)),
      0
    );
    const statuses = new Set(rows.map((g) => g.responseStatus ?? 'pending'));
    let status: HouseholdHeadcount['status'] = 'mixed';
    if (statuses.size === 1) {
      const only = [...statuses][0];
      if (only === 'not_attending') status = 'not_attending';
      else if (only === 'pending') status = 'pending';
      else if (isAttendingStatus(only)) status = 'attending';
    } else if ([...statuses].every((s) => s === 'pending' || isAttendingStatus(s ?? ''))) {
      status = seats > 0 ? 'attending' : 'pending';
    }

    return {
      label,
      guestIds: rows.map((g) => g.id),
      seats,
      status,
    };
  });
}
