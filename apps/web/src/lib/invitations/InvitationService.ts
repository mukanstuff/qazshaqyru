import { Prisma } from '@prisma/client';

import prisma from '@/lib/shared/db';
import { ApiError } from '@/lib/shared/api';
import { defaultCustomTextWithOpenRsvp } from '@/lib/guests/open-rsvp-config';
import { parseTemplateDataInput } from '@/lib/templates/template-data-schema';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import { parseMapUrl } from '@/lib/shared/map-url';
import { parseUserMediaUrl } from '@/lib/uploads/media-url';
import { assertCanPublishInvitation, defaultOpenRsvpOnPublish } from '@/lib/invitations/invitation-publish';
import { syncInvitationPaymentState } from '@/lib/payments/invitation-payment-sync';
import { addGuests, type AddGuestsResult } from '@/lib/guests/service';
import { findOwnedInvitationId } from '@/lib/invitations/repositories/invitation-repository';
import type { InvitationCreateBody, InvitationUpdateBody } from '@/lib/invitations/schemas';
import { nanoid } from 'nanoid';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';

function generateUniqueSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 20);
  return `${nanoid(10)}-${base || 'invitation'}`;
}

export async function createInvitationForUser(userId: string, input: InvitationCreateBody) {
  const template = await resolveTemplateBySlug(input.templateKey);
  if (!template) {
    throw new ApiError('validation_error', 'Шаблон не найден или отключён', 400);
  }
  if (input.templateId !== template.id) {
    throw new ApiError('validation_error', 'templateId не совпадает с templateKey', 400);
  }

  let invitation:
    | {
        id: string;
        userId: string;
        templateId: string | null;
        slug: string;
        title: string;
        eventType: string;
        eventDate: Date;
        eventTime: string | null;
        eventPlace: string | null;
        eventTimezone: string;
        templateKey: string;
        templateData: Prisma.JsonValue;
        musicUrl: string | null;
        mapUrl: string | null;
        address: string | null;
        customText: Prisma.JsonValue;
        status: string;
        publishedAt: Date | null;
        archivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }
    | null = null;

  for (let attempts = 0; attempts < 3 && !invitation; attempts += 1) {
    try {
      const slug = generateUniqueSlug(input.title);
      invitation = await prisma.invitation.create({
        data: {
          userId,
          slug,
          title: input.title,
          eventType: input.eventType,
          eventDate: input.eventDate,
          eventTime: input.eventTime || null,
          eventPlace: input.eventPlace || null,
          eventTimezone: input.eventTimezone,
          templateId: template.id,
          templateKey: template.slug,
          templateData: (input.templateData || {}) as Prisma.InputJsonValue,
          musicUrl: input.musicUrl ? parseUserMediaUrl(input.musicUrl) : null,
          mapUrl: input.mapUrl ? parseMapUrl(input.mapUrl) : null,
          address: input.address || null,
          customText: defaultCustomTextWithOpenRsvp(input.customText || {}) as Prisma.InputJsonValue,
          status: 'draft',
        },
      });
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code !== 'P2002') throw error;
    }
  }

  if (!invitation) {
    throw new ApiError('slug_collision', 'Не удалось сгенерировать уникальный slug', 500);
  }

  // 2026-07-30 NEXT: make canvas the primary document path from the very first creation.
  // Wizard + draft-sync already write canvas early.
  // Here we seed a canvas document on initial create so that:
  // - /canvas page never needs lazy convert for new invites
  // - preview = publish = guest uses the same document
  // - fullAccess model is consistent from moment 0
  try {
    const canvasDoc = convertLegacyToCanvas({
      title: input.title,
      eventType: input.eventType,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      eventPlace: input.eventPlace,
      address: input.address,
      eventTimezone: input.eventTimezone,
      templateData: input.templateData || {},
      musicUrl: input.musicUrl,
      mapUrl: input.mapUrl,
      customText: input.customText || {},
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { canvas: canvasDoc as any },
    });
  } catch (e) {
    // Non-fatal — canvas will be created on first edit / draft-sync.
    // This keeps create fast and resilient.
    console.warn('[InvitationService] failed to seed initial canvas (will be created later)', e);
  }

  return invitation;
}

export async function updateInvitationForUser(userId: string, invitationId: string, input: InvitationUpdateBody) {
  const existing = await prisma.invitation.findFirst({
    where: { id: invitationId, userId },
    select: {
      id: true,
      status: true,
      customText: true,
      eventType: true,
      _count: { select: { orders: { where: { status: 'paid' } } } },
    },
  });
  if (!existing) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.eventType !== undefined) updateData.eventType = input.eventType;
  if (input.eventDate !== undefined) updateData.eventDate = input.eventDate;
  if (input.eventTime !== undefined) updateData.eventTime = input.eventTime;
  if (input.eventPlace !== undefined) updateData.eventPlace = input.eventPlace;
  if (input.eventTimezone !== undefined) updateData.eventTimezone = input.eventTimezone;

  let templateChanged = false;
  if (input.templateKey !== undefined) {
    const resolved = await resolveTemplateBySlug(input.templateKey);
    if (!resolved) {
      throw new ApiError('validation_error', 'Шаблон не найден или отключён', 400);
    }
    if (input.templateId !== undefined && input.templateId !== null && input.templateId !== resolved.id) {
      throw new ApiError('validation_error', 'templateId не совпадает с templateKey', 400);
    }
    updateData.templateKey = resolved.slug;
    updateData.templateId = resolved.id;
    templateChanged = true;
  } else if (input.templateId !== undefined) {
    if (input.templateId === null) {
      throw new ApiError('validation_error', 'Нельзя отвязать шаблон от приглашения', 400);
    }
    const tpl = await prisma.template.findFirst({
      where: { id: input.templateId, isActive: true },
      select: { id: true, slug: true },
    });
    if (!tpl) {
      throw new ApiError('validation_error', 'Шаблон не найден или отключён', 400);
    }
    updateData.templateId = tpl.id;
    updateData.templateKey = tpl.slug;
    templateChanged = true;
  }

  if (input.templateData !== undefined) updateData.templateData = input.templateData;
  if (input.customText !== undefined) updateData.customText = input.customText;
  if (input.musicUrl !== undefined) {
    updateData.musicUrl = input.musicUrl === '' || input.musicUrl === null ? null : parseUserMediaUrl(input.musicUrl);
  }
  if (input.mapUrl !== undefined) {
    updateData.mapUrl = input.mapUrl === null || input.mapUrl.trim() === '' ? null : parseMapUrl(input.mapUrl);
  }
  if (input.address !== undefined) updateData.address = input.address;

  if (input.status !== undefined) {
    if (input.status === 'published' && existing.status === 'archived') {
      throw new ApiError(
        'validation_error',
        'Нельзя опубликовать архивное приглашение. Создайте новое из каталога.',
        400
      );
    }
    if (input.status === 'published' && existing.status !== 'published') {
      await assertCanPublishInvitation(invitationId, userId);
      const customText = defaultOpenRsvpOnPublish(
        input.customText !== undefined ? input.customText : existing.customText,
        input.eventType ?? existing.eventType
      );
      const invitation = await prisma.invitation.update({
        where: { id: invitationId },
        data: {
          ...updateData,
          customText,
          status: 'published',
          publishedAt: new Date(),
        },
      });
      if (templateChanged) {
        await syncInvitationPaymentState(invitationId, userId);
      }
      return { invitation, templateChanged, published: true as const };
    }

    updateData.status = input.status;
    if (input.status === 'archived' && existing.status !== 'archived') {
      updateData.archivedAt = new Date();
      updateData.publishedAt = null;
    }
  }

  const invitation = await prisma.invitation.update({
    where: { id: invitationId },
    data: updateData,
  });

  if (templateChanged) {
    await syncInvitationPaymentState(invitationId, userId);
  }

  return { invitation, templateChanged, published: false as const };
}

export async function updateInvitationDetailsForUser(userId: string, input: {
  id: string;
  title: string;
  eventType: string;
  eventDate: string;
  eventTime: string | null;
  eventPlace: string | null;
  address: string | null;
  mapUrl?: string | null;
  musicUrl?: string | null;
}) {
  const existing = await findOwnedInvitationId({ id: input.id, userId });
  if (!existing) throw new ApiError('not_found', 'Приглашение не найдено', 404);

  await prisma.invitation.update({
    where: { id: input.id },
    data: {
      title: input.title,
      eventType: input.eventType as never,
      eventDate: new Date(input.eventDate),
      eventTime: input.eventTime || null,
      eventPlace: input.eventPlace || null,
      address: input.address || null,
      mapUrl: input.mapUrl || null,
      musicUrl: input.musicUrl || null,
    },
  });
}

export async function updateInvitationDesignForUser(userId: string, input: { id: string; templateKey: string; templateData: unknown }) {
  const existing = await findOwnedInvitationId({ id: input.id, userId });
  if (!existing) throw new ApiError('not_found', 'Приглашение не найдено', 404);

  const template = await resolveTemplateBySlug(input.templateKey);
  if (!template) {
    throw new ApiError('validation_error', 'Шаблон не найден или отключён', 400);
  }

  const templateData = parseTemplateDataInput(input.templateData);

  await prisma.invitation.update({
    where: { id: input.id },
    data: {
      templateKey: template.slug,
      templateId: template.id,
      templateData: templateData as Prisma.InputJsonValue,
    },
  });

  await syncInvitationPaymentState(input.id, userId);
}

export async function updateInvitationContentForUser(userId: string, input: { id: string; customText: unknown }) {
  const existing = await findOwnedInvitationId({ id: input.id, userId });
  if (!existing) throw new ApiError('not_found', 'Приглашение не найдено', 404);

  await prisma.invitation.update({
    where: { id: input.id },
    data: { customText: (input.customText ?? undefined) as Prisma.InputJsonValue | undefined },
  });
}

export async function addGuestsForInvitation(userId: string, input: { invitationId: string; guests: unknown[] }): Promise<AddGuestsResult> {
  const invitation = await prisma.invitation.findFirst({
    where: { id: input.invitationId, userId },
    select: { id: true },
  });
  if (!invitation) throw new ApiError('not_found', 'Приглашение не найдено', 404);

  return addGuests(input.invitationId, input.guests as never);
}

