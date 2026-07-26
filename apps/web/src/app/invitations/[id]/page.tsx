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
import { isOpenRsvpEnabled } from '@/lib/guests/open-rsvp-config';
import type { EventType } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
  searchParams: Promise<{ published?: string; payment?: string; wizard?: string }>;
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

  const funnel = computeGuestFunnelWithPhone(
    invitation.guests.map((g) => ({
      id: g.id,
      phone: g.phone,
      sentAt: g.sentAt,
      openedAt: g.openedAt,
      responseStatus: g.response?.status ?? 'pending',
    }))
  );

  const headcountGuests = invitation.guests.map((g) => ({
    id: g.id,
    name: g.name,
    householdLabel: g.householdLabel,
    hasPlusOne: g.hasPlusOne,
    responseStatus: g.response?.status ?? 'pending',
  }));

  const entitlements = pricing?.entitlements;

  return (
    <GuestOpsHub
      invitationId={invitation.id}
      invitationSlug={invitation.slug}
      invitationTitle={invitation.title}
      templateKey={invitation.templateKey}
      status={invitation.status as 'draft' | 'published' | 'archived'}
      isPublished={invitation.status === 'published'}
      priceKzt={pricing?.priceKzt ?? 3990}
      editHref={`/invitations/edit?template=${encodeURIComponent(invitation.templateKey)}&invitationId=${invitation.id}`}
      planSku={entitlements?.planSku ?? 'free'}
      watermark={entitlements?.watermark ?? true}
      guestOpsUnlocked={entitlements?.guestOps ?? false}
      customSlugAllowed={entitlements?.customSlug ?? false}
      restaurantLinkAllowed={entitlements?.restaurantLink ?? false}
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
  );
}
