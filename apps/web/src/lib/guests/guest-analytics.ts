import { isAttendingStatus } from '@/lib/guests/rsvp-status';

export interface GuestAnalyticsBreakdown {
  attending: number;
  attending_plus_one: number;
  attending_no_children: number;
  not_attending: number;
  pending: number;
}

export interface GuestAnalytics {
  total: number;
  attending: number;
  notAttending: number;
  pending: number;
  responded: number;
  attendingPercent: number;
  responsePercent: number;
  breakdown: GuestAnalyticsBreakdown;
}

type GuestRow = {
  response?: { status: string } | null;
};

function emptyBreakdown(): GuestAnalyticsBreakdown {
  return {
    attending: 0,
    attending_plus_one: 0,
    attending_no_children: 0,
    not_attending: 0,
    pending: 0,
  };
}

/** Aggregate RSVP stats for dashboard and API responses. */
export function computeGuestAnalytics(guests: GuestRow[]): GuestAnalytics {
  const breakdown = emptyBreakdown();

  for (const guest of guests) {
    const status = guest.response?.status ?? 'pending';
    if (status === 'attending') breakdown.attending += 1;
    else if (status === 'attending_plus_one') breakdown.attending_plus_one += 1;
    else if (status === 'attending_no_children') breakdown.attending_no_children += 1;
    else if (status === 'not_attending') breakdown.not_attending += 1;
    else breakdown.pending += 1;
  }

  const total = guests.length;
  const attending =
    breakdown.attending + breakdown.attending_plus_one + breakdown.attending_no_children;
  const notAttending = breakdown.not_attending;
  const pending = breakdown.pending;
  const responded = total - pending;

  return {
    total,
    attending,
    notAttending,
    pending,
    responded,
    attendingPercent: total > 0 ? Math.round((attending / total) * 100) : 0,
    responsePercent: total > 0 ? Math.round((responded / total) * 100) : 0,
    breakdown,
  };
}

export function isRespondedStatus(status: string | null | undefined): boolean {
  return Boolean(status && status !== 'pending');
}
