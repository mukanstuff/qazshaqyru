import type { GuestResponseStatus } from '@prisma/client';

export interface FunnelGuestInput {
  id: string;
  sentAt?: Date | string | null;
  openedAt?: Date | string | null;
  responseStatus?: GuestResponseStatus | string | null;
}

export interface GuestFunnelStats {
  total: number;
  sent: number;
  opened: number;
  responded: number;
  pending: number;
  attending: number;
  notAttending: number;
  /** 0–100 */
  sentPercent: number;
  openedPercent: number;
  respondedPercent: number;
  /** Guests with phone who were never marked sent */
  unsentWithPhone: number;
  /** Sent but not opened */
  sentNotOpened: number;
  /** Opened / pending RSVP */
  openedNotResponded: number;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function isAttending(status: string | null | undefined): boolean {
  return (
    status === 'attending' ||
    status === 'attending_plus_one' ||
    status === 'attending_no_children'
  );
}

/** Opened / sent / RSVP funnel for guest-ops dashboard. */
export function computeGuestFunnel(guests: FunnelGuestInput[]): GuestFunnelStats {
  let sent = 0;
  let opened = 0;
  let responded = 0;
  let pending = 0;
  let attending = 0;
  let notAttending = 0;
  let unsentWithPhone = 0;
  let sentNotOpened = 0;
  let openedNotResponded = 0;

  for (const g of guests) {
    const status = (g.responseStatus as string | null | undefined) ?? 'pending';
    const hasSent = Boolean(g.sentAt);
    const hasOpened = Boolean(g.openedAt);
    const hasResponded = status !== 'pending';

    if (hasSent) sent += 1;
    if (hasOpened) opened += 1;

    if (hasResponded) {
      responded += 1;
      if (isAttending(status)) attending += 1;
      else if (status === 'not_attending') notAttending += 1;
    } else {
      pending += 1;
    }

    // unsentWithPhone counted by caller if phone known — keep 0 here unless phone passed
    if (!hasSent && 'phone' in g && (g as { phone?: string | null }).phone) {
      unsentWithPhone += 1;
    }
    if (hasSent && !hasOpened) sentNotOpened += 1;
    if (hasOpened && !hasResponded) openedNotResponded += 1;
  }

  const total = guests.length;

  return {
    total,
    sent,
    opened,
    responded,
    pending,
    attending,
    notAttending,
    sentPercent: pct(sent, total),
    openedPercent: pct(opened, total),
    respondedPercent: pct(responded, total),
    unsentWithPhone,
    sentNotOpened,
    openedNotResponded,
  };
}

export type FunnelGuestWithPhone = FunnelGuestInput & { phone?: string | null };

export function computeGuestFunnelWithPhone(guests: FunnelGuestWithPhone[]): GuestFunnelStats {
  return computeGuestFunnel(guests);
}
