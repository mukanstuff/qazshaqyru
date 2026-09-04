import prisma from '@/lib/shared/db';
import { ApiError } from '@/lib/shared/api';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';
import type { EventType, Prisma } from '@prisma/client';
import { buildPublicSlug, isGeneratedDraftSlug, RESERVED_SLUGS } from '@/lib/invitations/public-slug';
import type { CustomTextInput } from '@/lib/shared/custom-text-schema';
import { defaultCustomTextWithOpenRsvp } from '@/lib/guests/open-rsvp-config';

/**
 * 2026-08-26: free-tier publish restored. Any invitation can publish
 * unpaid — it just gets the 'free' plan's entitlements (watermark shown,
 * see resolveEntitlements/PLAN_CATALOG). Paying the template price
 * (fullAccess) removes the watermark and unlocks the rest. This only
 * checks the invitation exists and belongs to the user; it does not gate
 * on payment.
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

/**
 * Publish a draft invitation after payment or freemium publish. Idempotent.
 * Returns the invitation's slug *after* publishing — it can change here, since
 * a generated `draft-…` slug is replaced with a readable one.
 */
export async function publishInvitationIfDraft(invitationId: string): Promise<string | null> {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { id: true, status: true, customText: true, eventType: true, slug: true, title: true },
  });

  if (!invitation) return null;
  if (invitation.status !== 'draft') return invitation.slug;

  const customText = defaultOpenRsvpOnPublish(invitation.customText, invitation.eventType);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Promote the throwaway `draft-<nanoid>` slug to something a guest can read.
    // A slug the owner picked themselves is left alone.
    const slug = isGeneratedDraftSlug(invitation.slug)
      ? await buildPublicSlug(tx, invitation.title, invitation.slug, RESERVED_SLUGS)
      : invitation.slug;

    const result = await tx.invitation.updateMany({
      where: { id: invitationId, status: 'draft' },
      data: {
        status: 'published',
        publishedAt: new Date(),
        customText,
        ...(slug !== invitation.slug ? { slug } : {}),
      },
    });
    // A concurrent publish won the race — report the slug that actually stuck.
    return result.count > 0 ? slug : invitation.slug;
  });
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
