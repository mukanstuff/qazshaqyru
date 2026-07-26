import prisma from '@/lib/shared/db';
import { ApiError } from '@/lib/shared/api';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';
import {
  buildRestaurantPortalUrl,
  createRestaurantShareToken,
  isRestaurantShareActive,
  parseRestaurantShareToken,
  restaurantShareExpiresAt,
  verifyRestaurantShareToken,
} from '@/lib/restaurant/share-token';
import {
  buildRestaurantPortalPayload,
  type RestaurantPortalPayload,
} from '@/lib/restaurant/portal-data';

export async function createOrRotateRestaurantShare(params: {
  invitationId: string;
  userId: string;
  label?: string | null;
  origin: string;
}): Promise<{ url: string; expiresAt: Date; shareId: string }> {
  const pricing = await getInvitationPricing(params.invitationId, params.userId);
  if (!pricing) throw new ApiError('not_found', 'Приглашение не найдено', 404);
  if (!pricing.entitlements.restaurantLink) {
    throw new ApiError(
      'plan_required',
      'Ссылка для ресторана доступна на тарифе Стандарт и выше',
      402
    );
  }

  const invitation = await prisma.invitation.findFirst({
    where: { id: params.invitationId, userId: params.userId },
    select: { id: true, status: true },
  });
  if (!invitation) throw new ApiError('not_found', 'Приглашение не найдено', 404);
  if (invitation.status !== 'published') {
    throw new ApiError('not_published', 'Сначала опубликуйте приглашение', 400);
  }

  await prisma.restaurantShareLink.updateMany({
    where: { invitationId: params.invitationId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const { token, tokenHash } = createRestaurantShareToken();
  const expiresAt = restaurantShareExpiresAt();

  const share = await prisma.restaurantShareLink.create({
    data: {
      invitationId: params.invitationId,
      tokenHash,
      label: params.label?.trim() || null,
      expiresAt,
    },
  });

  return {
    url: buildRestaurantPortalUrl(params.origin, token),
    expiresAt,
    shareId: share.id,
  };
}

export async function revokeRestaurantShares(params: {
  invitationId: string;
  userId: string;
}): Promise<number> {
  const invitation = await prisma.invitation.findFirst({
    where: { id: params.invitationId, userId: params.userId },
    select: { id: true },
  });
  if (!invitation) throw new ApiError('not_found', 'Приглашение не найдено', 404);

  const result = await prisma.restaurantShareLink.updateMany({
    where: { invitationId: params.invitationId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

export async function resolveRestaurantPortalByToken(
  token: string
): Promise<RestaurantPortalPayload | null> {
  const parsed = parseRestaurantShareToken(token);
  if (!parsed) return null;

  const share = await prisma.restaurantShareLink.findUnique({
    where: { tokenHash: parsed.tokenHash },
    select: {
      id: true,
      tokenHash: true,
      expiresAt: true,
      revokedAt: true,
      invitationId: true,
    },
  });

  if (!share) return null;
  if (!verifyRestaurantShareToken(token, share.tokenHash)) return null;
  if (!isRestaurantShareActive(share)) return null;

  const invitation = await prisma.invitation.findUnique({
    where: { id: share.invitationId },
    select: {
      title: true,
      eventDate: true,
      eventTime: true,
      eventPlace: true,
      address: true,
      status: true,
      guests: {
        select: {
          id: true,
          name: true,
          phone: true,
          side: true,
          hasPlusOne: true,
          plusOneName: true,
          householdLabel: true,
          response: { select: { status: true, dietaryRestrictions: true } },
          seating: { select: { table: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'asc' },
        take: 2000,
      },
    },
  });

  if (!invitation || invitation.status !== 'published') return null;

  await prisma.restaurantShareLink.update({
    where: { id: share.id },
    data: {
      lastAccessedAt: new Date(),
      accessCount: { increment: 1 },
    },
  });

  return buildRestaurantPortalPayload({
    title: invitation.title,
    eventDate: invitation.eventDate,
    eventTime: invitation.eventTime,
    eventPlace: invitation.eventPlace,
    address: invitation.address,
    guests: invitation.guests.map((g) => ({
      id: g.id,
      name: g.name,
      phone: g.phone,
      side: g.side,
      hasPlusOne: g.hasPlusOne,
      plusOneName: g.plusOneName,
      householdLabel: g.householdLabel,
      responseStatus: g.response?.status ?? 'pending',
      dietary: g.response?.dietaryRestrictions ?? null,
      tableName: g.seating?.table?.name ?? null,
    })),
  });
}
