import { redirect } from 'next/navigation';

import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';
import { computeGuestFunnelWithPhone } from '@/lib/guests/guest-funnel';
import {
  computeConfirmedHeadcount,
  computeExpectedHeadcount,
} from '@/lib/guests/headcount';
import { GuestOpsHub } from '@/components/editor/GuestOpsHub';
import { HubSectionList } from '@/components/hub/HubSectionList';
import { isOpenRsvpEnabled } from '@/lib/guests/open-rsvp-config';
import type { EventType } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
  searchParams: Promise<{ published?: string; payment?: string; wizard?: string }>;
}

function toYmd(iso: Date | string): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toHm(iso: Date | string | null | undefined): string {
  if (!iso) return '';
  if (typeof iso === 'string') {
    // Already HH:mm or full ISO — accept either.
    const m = /^(\d{2}:\d{2})/.exec(iso);
    if (m) return m[1];
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }
  const d = iso;
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export default async function InvitationEditorPage({ params, searchParams }: Props) {
  const ctx = await getCurrentSession();
  if (!ctx) redirect('/login');

  const { id } = params;
  const { published, payment } = await searchParams;

  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: ctx.user.id },
    include: {
      guests: {
        include: { response: true },
        orderBy: { createdAt: 'asc' },
        take: 2000,
      },
      template: { select: { previewImageUrl: true } },
      _count: { select: { guests: true } },
    },
  });

  if (!invitation) redirect('/dashboard');
  if (invitation.status === 'archived') redirect('/dashboard');

  const pricing = await getInvitationPricing(invitation.id, ctx.user.id);

  // 2026-07-30 decisive product model:
  // template price paid once = full access for this invitation (no watermark, all ops, full editor).
  const fullAccess = !!(pricing?.fullAccess ?? pricing?.hasPaidOrder ?? false);

  type InvitationGuestRow = {
    id: string;
    name: string;
    phone: string;
    sentAt: Date | null;
    openedAt: Date | null;
    householdLabel: string | null;
    hasPlusOne: boolean;
    plusOneName?: string | null;
    side?: string | null;
    response?: { status: string } | null;
  };

  const funnel = computeGuestFunnelWithPhone(
    invitation.guests.map((g: InvitationGuestRow) => ({
      id: g.id,
      phone: g.phone,
      sentAt: g.sentAt,
      openedAt: g.openedAt,
      responseStatus: g.response?.status ?? 'pending',
    }))
  );

  const headcountGuests = invitation.guests.map((g: InvitationGuestRow) => ({
    id: g.id,
    name: g.name,
    householdLabel: g.householdLabel,
    hasPlusOne: g.hasPlusOne,
    responseStatus: g.response?.status ?? 'pending',
  }));

  const entitlements = pricing?.entitlements;

  const customText = (invitation.customText ?? {}) as {
    greeting?: string;
    intro?: string;
    details?: string;
    closing?: string;
    dressCode?: string;
    groomName?: string;
    brideName?: string;
    eventPlace?: string;
    address?: string;
  };

  return (
    <>
      {/* Phase 2 (2026-08-18): the new hub screen. Renders above the
          legacy GuestOpsHub, which keeps PostPublishShareScreen, the funnel,
          CSV export, and the restaurant-share controls intact below. */}
      <HubSectionList
        invitationId={invitation.id}
        invitationSlug={invitation.slug}
        invitationTitle={invitation.title}
        status={invitation.status as 'draft' | 'published' | 'archived'}
        templateKey={invitation.templateKey}
        editHref={`/invitations/${encodeURIComponent(invitation.id)}/canvas`}
        viewCount={invitation.viewCount ?? 0}
        confirmedSeats={computeConfirmedHeadcount(headcountGuests)}
        expectedSeats={computeExpectedHeadcount(headcountGuests)}
        customText={customText}
        eventDate={toYmd(invitation.eventDate)}
        eventTime={toHm(invitation.eventTime)}
        eventPlace={invitation.eventPlace ?? ''}
        address={invitation.address ?? ''}
        eventTimezone={invitation.eventTimezone ?? 'Asia/Almaty'}
        musicUrl={invitation.musicUrl ?? ''}
        restaurantLinkAllowed={entitlements?.restaurantLink ?? false}
        guestCount={invitation._count.guests}
        guestCountAttending={funnel.attending}
        fullAccess={fullAccess}
        priceKzt={pricing?.priceKzt ?? 3990 /* fallback only */}
      />
      <GuestOpsHub
        invitationId={invitation.id}
        invitationSlug={invitation.slug}
        invitationTitle={invitation.title}
        templateKey={invitation.templateKey}
        status={invitation.status as 'draft' | 'published' | 'archived'}
        isPublished={invitation.status === 'published'}
        priceKzt={pricing?.priceKzt ?? 3990}
        editHref={`/invitations/${encodeURIComponent(invitation.id)}/canvas`}
        planSku={entitlements?.planSku ?? 'free'}
        watermark={entitlements?.watermark ?? true}
        guestOpsUnlocked={entitlements?.guestOps ?? false}
        customSlugAllowed={entitlements?.customSlug ?? false}
        restaurantLinkAllowed={entitlements?.restaurantLink ?? false}
        fullAccess={fullAccess}
        funnel={funnel}
        confirmedSeats={computeConfirmedHeadcount(headcountGuests)}
        expectedSeats={computeExpectedHeadcount(headcountGuests)}
        showPublishedBanner={published === '1'}
        showPostPublishShare={published === '1'}
        guestCount={invitation._count.guests}
        openRsvp={isOpenRsvpEnabled(
          invitation.customText,
          invitation.eventType as EventType,
        )}
        showPaymentFailed={payment === 'failed'}
        showPaymentInvalid={payment === 'invalid'}
        showPaymentPending={payment === 'pending'}
      />
    </>
  );
}
