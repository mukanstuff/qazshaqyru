import { redirect } from 'next/navigation';

import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';
import { computeGuestFunnelWithPhone } from '@/lib/guests/guest-funnel';
import {
  computeConfirmedHeadcount,
  computeExpectedHeadcount,
} from '@/lib/guests/headcount';
import { HubSectionList } from '@/components/hub/HubSectionList';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { SiteCompactFooter } from '@/components/shared/SiteCompactFooter';
import type { HubGuest } from '@/components/hub/useHubGuests';
import { parseCanvasOrEmpty } from '@/lib/canvas/validation';
import { deriveHubTextDefaults, deriveMusicUrl } from '@/lib/canvas/derive-invitation-fields';
import { getI18n } from '@/i18n/server';

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
      template: { select: { previewImageUrl: true, nameRu: true, nameKz: true } },
      _count: { select: { guests: true } },
      // Only the existence of a review matters here, so one boolean-ish row
      // rather than the whole record.
      serviceReviews: { select: { id: true }, take: 1 },
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

  type FullGuestRow = InvitationGuestRow & {
    response?: {
      status: string;
      dietaryRestrictions?: string | null;
      message?: string | null;
    } | null;
  };

  const hubGuests: HubGuest[] = (invitation.guests as unknown as FullGuestRow[]).map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    side: g.side === 'bride' || g.side === 'groom' ? g.side : null,
    householdLabel: g.householdLabel,
    hasPlusOne: g.hasPlusOne,
    plusOneName: g.plusOneName ?? null,
    sentAt: g.sentAt ? g.sentAt.toISOString() : null,
    openedAt: g.openedAt ? g.openedAt.toISOString() : null,
    responseStatus: g.response?.status ?? null,
    dietaryRestrictions: g.response?.dietaryRestrictions ?? null,
    message: g.response?.message ?? null,
  }));

  // Canonical editor URL: skip the legacy /invitations/[id]/canvas stub and
  // link straight to /editor/[templateKey]?id=<draftUuid>. The templateKey
  // is non-null in the schema (default "classic") so this is always safe.
  const editorHref = `/editor/${encodeURIComponent(invitation.templateKey)}?id=${encodeURIComponent(invitation.id)}`;

  const canvasDoc = parseCanvasOrEmpty(invitation.canvas);
  const textDefaults = deriveHubTextDefaults(canvasDoc);
  const canvasMusicUrl = deriveMusicUrl(canvasDoc);

  const { locale } = await getI18n();
  const templateLabel =
    (locale === 'kz' ? invitation.template?.nameKz : invitation.template?.nameRu) ??
    invitation.template?.nameRu ??
    invitation.templateKey;

  return (
    <>
      <SiteHeader isLoggedIn backHref="/dashboard" title={invitation.title} />
      <HubSectionList
        invitationId={invitation.id}
        invitationSlug={invitation.slug}
        invitationTitle={invitation.title}
        status={invitation.status as 'draft' | 'published' | 'archived'}
        templateKey={invitation.templateKey}
        /* Human-readable template name. The hub row used to print the raw
           slug ("dala", "aq-bata") as its value — an internal identifier
           shown to a customer. */
        templateLabel={templateLabel}
        editHref={editorHref}
        previewImageUrl={invitation.template?.previewImageUrl ?? null}
        viewCount={invitation.viewCount ?? 0}
        confirmedSeats={computeConfirmedHeadcount(headcountGuests)}
        expectedSeats={computeExpectedHeadcount(headcountGuests)}
        textDefaults={textDefaults}
        eventDate={toYmd(invitation.eventDate)}
        eventTime={toHm(invitation.eventTime)}
        eventPlace={invitation.eventPlace ?? ''}
        address={invitation.address ?? ''}
        eventTimezone={invitation.eventTimezone ?? 'Asia/Almaty'}
        musicUrl={canvasMusicUrl}
        restaurantLinkAllowed={entitlements?.restaurantLink ?? false}
        guestCount={invitation._count.guests}
        guestCountAttending={funnel.attending}
        guests={hubGuests}
        fullAccess={fullAccess}
        priceKzt={pricing?.priceKzt ?? 3990 /* fallback only */}
        // Trust the DB over the query param — a stray `?published=1` (old
        // editor links, a replayed/bookmarked URL) must never claim success
        // for an invitation that is still actually a draft.
        showPublishedBanner={published === '1' && invitation.status === 'published'}
        showPaymentFailed={payment === 'failed'}
        showPaymentInvalid={payment === 'invalid'}
        showPaymentPending={payment === 'pending'}
        /* The review ask is time-gated: it appears only after the event, when
           the customer actually has something to judge. */
        eventPassed={Boolean(invitation.eventDate) && new Date(invitation.eventDate as Date) < new Date()}
        alreadyReviewed={invitation.serviceReviews.length > 0}
        ownerDisplayName={ctx.user?.name ?? ''}
      />
      <SiteCompactFooter />
    </>
  );
}
