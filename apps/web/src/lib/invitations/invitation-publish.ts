import prisma from '@/lib/shared/db';
import { ApiError } from '@/lib/shared/api';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';
import type { EventType } from '@prisma/client';
import type { CustomTextInput } from '@/lib/shared/custom-text-schema';
import { defaultCustomTextWithOpenRsvp } from '@/lib/guests/open-rsvp-config';

/**
 * Freemium (toi-style): publication is free; payment removes the public watermark.
 */
export async function assertCanPublishInvitation(
  invitationId: string,
  userId: string
): Promise<void> {
  const pricing = await getInvitationPricing(invitationId, userId);

  if (!pricing) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }
}

export function defaultOpenRsvpOnPublish(customText: unknown, eventType?: EventType): CustomTextInput {
  return defaultCustomTextWithOpenRsvp(customText, eventType) as CustomTextInput;
}

/** Publish a draft invitation after payment or freemium publish. Idempotent. */
export async function publishInvitationIfDraft(invitationId: string): Promise<boolean> {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { id: true, status: true, customText: true, eventType: true },
  });

  if (!invitation || invitation.status !== 'draft') {
    return false;
  }

  const customText = defaultOpenRsvpOnPublish(invitation.customText, invitation.eventType);

  const result = await prisma.invitation.updateMany({
    where: { id: invitationId, status: 'draft' },
    data: {
      status: 'published',
      publishedAt: new Date(),
      customText,
    },
  });
  return result.count > 0;
}

/** Publish with ownership check (server actions / manual publish). Payment optional. */
export async function publishInvitation(invitationId: string, userId: string): Promise<void> {
  const existing = await prisma.invitation.findFirst({
    where: { id: invitationId, userId },
    select: { id: true, status: true, customText: true, eventType: true },
  });
  if (!existing) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }
  if (existing.status === 'published') {
    throw new ApiError('already_published', 'Приглашение уже опубликовано', 400);
  }

  await assertCanPublishInvitation(invitationId, userId);

  const customText = defaultOpenRsvpOnPublish(existing.customText, existing.eventType);

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: 'published', publishedAt: new Date(), customText },
  });
}
