'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import { ApiError, requireAuth } from '@/lib/shared/api';
import { deleteGuestForUser, type AddGuestsResult, updateGuestForUser } from '@/lib/guests/service';
import { EVENT_TYPES } from '@/lib/shared/types';
import { DEFAULT_TEMPLATE_SLUG } from '@/lib/templates/catalog';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import {
  invitationCreateBodySchema,
  invitationAddGuestsActionSchema,
  invitationUpdateContentActionSchema,
  invitationUpdateDesignActionSchema,
  invitationUpdateDetailsActionSchema,
} from '@/lib/invitations/schemas';
import {
  createInvitationForUser,
  addGuestsForInvitation,
  updateInvitationContentForUser,
  updateInvitationDesignForUser,
  updateInvitationDetailsForUser,
} from '@/lib/invitations/InvitationService';

const createInvitationSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  eventType: z.enum(EVENT_TYPES),
  eventDate: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), 'Некорректная дата'),
  eventTime: z.string().max(20).optional(),
  eventPlace: z.string().max(300).optional(),
  templateId: z.string().uuid().optional(),
  templateKey: z.string().max(50).default(DEFAULT_TEMPLATE_SLUG),
});

function toActionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Внутренняя ошибка сервера';
}

export async function createInvitationAction(formData: FormData) {
  const ctx = await requireAuth();

  const parsed = createInvitationSchema.safeParse({
    title: formData.get('title'),
    eventType: formData.get('eventType'),
    eventDate: formData.get('eventDate'),
    eventTime: formData.get('eventTime') || undefined,
    eventPlace: formData.get('eventPlace') || undefined,
    templateId: formData.get('templateId') || undefined,
    templateKey: formData.get('templateKey') || DEFAULT_TEMPLATE_SLUG,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Ошибка валидации');
  }

  const template = await resolveTemplateBySlug(parsed.data.templateKey);
  if (!template) {
    throw new Error('Шаблон не найден или отключён');
  }

  const apiParsed = invitationCreateBodySchema.safeParse({
    ...parsed.data,
    eventTimezone: 'Asia/Almaty',
    templateId: parsed.data.templateId ?? template.id,
    templateKey: template.slug,
  });
  if (!apiParsed.success) {
    throw new Error(apiParsed.error.issues[0]?.message || 'Ошибка валидации');
  }

  let invitation;
  try {
    invitation = await createInvitationForUser(ctx.user.id, apiParsed.data);
  } catch (error) {
    throw new Error(toActionErrorMessage(error));
  }

  revalidatePath('/dashboard');
  redirect(`/invitations/${invitation!.id}`);
}

const updateDetailsSchema = z.object({
  id: invitationUpdateDetailsActionSchema.shape.id,
  title: invitationUpdateDetailsActionSchema.shape.title,
  eventType: invitationUpdateDetailsActionSchema.shape.eventType,
  eventDate: invitationUpdateDetailsActionSchema.shape.eventDate,
  eventTime: invitationUpdateDetailsActionSchema.shape.eventTime,
  eventPlace: invitationUpdateDetailsActionSchema.shape.eventPlace,
  address: invitationUpdateDetailsActionSchema.shape.address,
  mapUrl: invitationUpdateDetailsActionSchema.shape.mapUrl,
  musicUrl: invitationUpdateDetailsActionSchema.shape.musicUrl,
});

export async function updateInvitationDetailsAction(input: z.infer<typeof updateDetailsSchema>) {
  const ctx = await requireAuth();
  const parsed = updateDetailsSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Ошибка валидации');
  try {
    await updateInvitationDetailsForUser(ctx.user.id, parsed.data);
  } catch (error) {
    throw new Error(toActionErrorMessage(error));
  }

  revalidatePath(`/invitations/${parsed.data.id}`);
  revalidatePath('/dashboard');
}

const updateDesignSchema = z.object({
  id: invitationUpdateDesignActionSchema.shape.id,
  templateKey: invitationUpdateDesignActionSchema.shape.templateKey,
  templateData: invitationUpdateDesignActionSchema.shape.templateData,
});

export async function updateInvitationDesignAction(input: z.infer<typeof updateDesignSchema>) {
  const ctx = await requireAuth();
  const parsed = updateDesignSchema.safeParse(input);
  if (!parsed.success) throw new Error('Ошибка валидации');
  try {
    await updateInvitationDesignForUser(ctx.user.id, parsed.data);
  } catch (error) {
    throw new Error(toActionErrorMessage(error));
  }

  revalidatePath(`/invitations/${parsed.data.id}`);
  revalidatePath('/dashboard');
}

const updateContentSchema = z.object({
  id: invitationUpdateContentActionSchema.shape.id,
  customText: invitationUpdateContentActionSchema.shape.customText,
});

export async function updateInvitationContentAction(input: z.infer<typeof updateContentSchema>) {
  const ctx = await requireAuth();
  const parsed = updateContentSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Ошибка валидации');
  try {
    await updateInvitationContentForUser(ctx.user.id, parsed.data);
  } catch (error) {
    throw new Error(toActionErrorMessage(error));
  }

  revalidatePath(`/invitations/${parsed.data.id}`);
}

export async function unpublishInvitationAction(id: string) {
  const ctx = await requireAuth();

  const existing = await prisma.invitation.findFirst({
    where: { id, userId: ctx.user.id },
    select: { id: true, status: true },
  });
  if (!existing) throw new Error('Приглашение не найдено');
  if (existing.status !== 'published') throw new Error('Приглашение не опубликовано');

  await prisma.invitation.update({
    where: { id },
    data: { status: 'draft', publishedAt: null },
  });

  revalidatePath(`/invitations/${id}`);
  revalidatePath('/dashboard');
}

export async function archiveInvitationAction(id: string) {
  const ctx = await requireAuth();

  const existing = await prisma.invitation.findFirst({
    where: { id, userId: ctx.user.id },
    select: { id: true },
  });
  if (!existing) throw new Error('Приглашение не найдено');

  await prisma.invitation.update({
    where: { id },
    data: { status: 'archived', archivedAt: new Date(), publishedAt: null },
  });

  revalidatePath(`/invitations/${id}`);
  revalidatePath('/dashboard');
  return { success: true as const };
}

const addGuestsSchema = z.object({
  invitationId: invitationAddGuestsActionSchema.shape.invitationId,
  guests: invitationAddGuestsActionSchema.shape.guests,
});

export type AddGuestsActionResult = AddGuestsResult;

export async function addGuestsAction(input: z.infer<typeof addGuestsSchema>): Promise<AddGuestsResult> {
  const ctx = await requireAuth();
  const parsed = addGuestsSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Ошибка валидации');
  let result: AddGuestsResult;
  try {
    result = await addGuestsForInvitation(ctx.user.id, parsed.data);
  } catch (error) {
    throw new Error(toActionErrorMessage(error));
  }

  revalidatePath(`/invitations/${parsed.data.invitationId}`);
  return result;
}

const updateGuestSchema = z.object({
  guestId: z.string().uuid(),
  name: z.string().min(1).max(100),
  phone: z.string().max(20).nullable().optional(),
  side: z.enum(['bride', 'groom']).nullable().optional(),
  hasPlusOne: z.boolean().optional(),
  plusOneName: z.string().max(100).nullable().optional(),
  householdLabel: z.string().max(100).nullable().optional(),
});

export async function updateGuestAction(input: z.infer<typeof updateGuestSchema>) {
  const ctx = await requireAuth();
  const parsed = updateGuestSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Ошибка валидации');

  const { invitationId } = await updateGuestForUser({
    ...parsed.data,
    userId: ctx.user.id,
  });

  revalidatePath(`/invitations/${invitationId}`);
}

export async function deleteGuestAction(guestId: string) {
  const ctx = await requireAuth();
  const { invitationId } = await deleteGuestForUser(guestId, ctx.user.id);
  revalidatePath(`/invitations/${invitationId}`);
}
