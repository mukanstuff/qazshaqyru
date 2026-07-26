import {
  computeConfirmedHeadcount,
  computeExpectedHeadcount,
  groupHouseholds,
  type HeadcountGuest,
} from '@/lib/guests/headcount';

export interface RestaurantPortalGuest extends HeadcountGuest {
  phone?: string | null;
  dietary?: string | null;
  tableName?: string | null;
  side?: string | null;
}

export interface RestaurantPortalPayload {
  title: string;
  eventDate: string;
  eventTime: string | null;
  eventPlace: string | null;
  address: string | null;
  confirmedSeats: number;
  expectedSeats: number;
  guestCount: number;
  households: Array<{
    label: string;
    seats: number;
    status: string;
    guests: Array<{
      name: string;
      seats: number;
      rsvp: string;
      dietary: string | null;
      tableName: string | null;
      side: string | null;
    }>;
  }>;
  updatedAt: string;
}

function seatsFor(g: RestaurantPortalGuest): number {
  const status = g.responseStatus ?? 'pending';
  if (status === 'not_attending' || status === 'pending') return 0;
  if (status === 'attending_plus_one') return g.hasPlusOne ? 2 : 1;
  return 1;
}

/** Assemble read-only banquet view for restaurant magic link. */
export function buildRestaurantPortalPayload(params: {
  title: string;
  eventDate: Date;
  eventTime: string | null;
  eventPlace: string | null;
  address: string | null;
  guests: RestaurantPortalGuest[];
  now?: Date;
}): RestaurantPortalPayload {
  const { title, eventDate, eventTime, eventPlace, address, guests } = params;
  const now = params.now ?? new Date();
  const households = groupHouseholds(guests);

  const guestById = new Map(guests.map((g) => [g.id, g]));

  return {
    title,
    eventDate: eventDate.toISOString(),
    eventTime,
    eventPlace,
    address,
    confirmedSeats: computeConfirmedHeadcount(guests),
    expectedSeats: computeExpectedHeadcount(guests),
    guestCount: guests.length,
    households: households.map((h) => ({
      label: h.label,
      seats: h.seats,
      status: h.status,
      guests: h.guestIds.map((id) => {
        const g = guestById.get(id)!;
        return {
          name: g.name,
          seats: seatsFor(g),
          rsvp: g.responseStatus ?? 'pending',
          dietary: g.dietary ?? null,
          tableName: g.tableName ?? null,
          side: g.side ?? null,
        };
      }),
    })),
    updatedAt: now.toISOString(),
  };
}
