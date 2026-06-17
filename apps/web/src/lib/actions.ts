'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import prisma from './db';
import { requireAuth, ApiError, applyRateLimit, RATE_LIMITS, rateLimitResponse } from './api';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';
import { addGuests } from '@/services/guests';
import { Prisma } from '@prisma/client';

const eventTypeEnum = z.enum([
  'wedding',
  'toy',
  'betashar',
  'kyz_uzatu',
  'birthday',
  'anniversary',
  'corporate',
  'other',
]);

/**
 * Schema for the `customText` JSON column on Invitation.
 *
 * We intentionally apply a strict shape here so that nothing more than
 * a small set of translated strings and the day-program can be stuffed
 * into the row. Without this guard, a client could push megabytes of
 * nested data and bloat the row.
 */
const programItemSchema = z.object({
  time: z.string().max(20),
  title: z.string().max(200),
  description: z.string().max(500).optional(),
});

const customTextSchema = z
  .object({
    greeting: z.string().max(500).optional(),
    intro: z.string().max(1000).optional(),
    details: z.string().max(2000).optional(),
    closing: z.string().max(500).optional(),
    dressCode: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
    /// Legacy / editor-specific fields. The editor uses these names;
    /// we accept them on the way in so existing UIs keep working.
    aboutCouple: z.string().max(2000).optional(),
    footer: z.string().max(500).optional(),
    program: z.array(programItemSchema).max(30).optional(),
  })
  .strict()
  .nullable();

const createInvitationSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  eventType: eventTypeEnum,
  eventDate: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), 'Некорректная дата'),
  eventTime: z.string().max(20).optional(),
  eventPlace: z.string().max(300).optional(),
  templateId: z.string().uuid().optional(),
  templateKey: z.string().max(50).default('classic'),
});

function generateUniqueSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 20);
  return `${nanoid(10)}-${base || 'invitation'}`;
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
    templateKey: formData.get('templateKey') || 'classic',
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Ошибка валидации');
  }

  let invitation;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const slug = generateUniqueSlug(parsed.data.title);
      invitation = await prisma.invitation.create({
        data: {
          userId: ctx.user.id,
          slug,
          title: parsed.data.title,
          eventType: parsed.data.eventType,
          eventDate: new Date(parsed.data.eventDate),
          eventTime: parsed.data.eventTime || null,
          eventPlace: parsed.data.eventPlace || null,
          templateId: parsed.data.templateId || null,
          templateKey: parsed.data.templateKey,
          status: 'draft',
        },
      });
      break;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code !== 'P2002' || attempt === 2) throw err;
    }
  }

  revalidatePath('/dashboard');
  redirect(`/invitations/${invitation!.id}`);
}

const updateDetailsSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  eventType: eventTypeEnum,
  eventDate: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), 'Некорректная дата'),
  eventTime: z.string().max(20).nullable(),
  eventPlace: z.string().max(300).nullable(),
  address: z.string().max(500).nullable(),
  mapUrl: z.string().url().nullable(),
  musicUrl: z.string().url().nullable(),
});

export async function updateInvitationDetailsAction(input: z.infer<typeof updateDetailsSchema>) {
  const ctx = await requireAuth();
  const parsed = updateDetailsSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Ошибка валидации');

  const existing = await prisma.invitation.findFirst({
    where: { id: parsed.data.id, userId: ctx.user.id },
    select: { id: true },
  });
  if (!existing) throw new Error('Приглашение не найдено');

  await prisma.invitation.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      eventType: parsed.data.eventType,
      eventDate: new Date(parsed.data.eventDate),
      eventTime: parsed.data.eventTime || null,
      eventPlace: parsed.data.eventPlace || null,
      address: parsed.data.address || null,
      mapUrl: parsed.data.mapUrl || null,
      musicUrl: parsed.data.musicUrl || null,
    },
  });

  revalidatePath(`/invitations/${parsed.data.id}`);
  revalidatePath('/dashboard');
}

const updateDesignSchema = z.object({
  id: z.string().uuid(),
  templateKey: z.string().max(50),
  templateData: z.record(z.unknown()),
});

export async function updateInvitationDesignAction(input: z.infer<typeof updateDesignSchema>) {
  const ctx = await requireAuth();
  const parsed = updateDesignSchema.safeParse(input);
  if (!parsed.success) throw new Error('Ошибка валидации');

  const existing = await prisma.invitation.findFirst({
    where: { id: parsed.data.id, userId: ctx.user.id },
    select: { id: true },
  });
  if (!existing) throw new Error('Приглашение не найдено');

  await prisma.invitation.update({
    where: { id: parsed.data.id },
    data: {
      templateKey: parsed.data.templateKey,
      templateData: parsed.data.templateData as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/invitations/${parsed.data.id}`);
}

const updateContentSchema = z.object({
  id: z.string().uuid(),
  customText: customTextSchema,
});

export async function updateInvitationContentAction(input: z.infer<typeof updateContentSchema>) {
  const ctx = await requireAuth();
  const parsed = updateContentSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Ошибка валидации');

  const existing = await prisma.invitation.findFirst({
    where: { id: parsed.data.id, userId: ctx.user.id },
    select: { id: true },
  });
  if (!existing) throw new Error('Приглашение не найдено');

  await prisma.invitation.update({
    where: { id: parsed.data.id },
    data: { customText: (parsed.data.customText ?? undefined) as Prisma.InputJsonValue | undefined },
  });

  revalidatePath(`/invitations/${parsed.data.id}`);
}

export async function publishInvitationAction(id: string) {
  const ctx = await requireAuth();

  const existing = await prisma.invitation.findFirst({
    where: { id, userId: ctx.user.id },
    select: { id: true, status: true },
  });
  if (!existing) throw new Error('Приглашение не найдено');

  await prisma.invitation.update({
    where: { id },
    data: {
      status: existing.status === 'published' ? 'draft' : 'published',
      publishedAt: existing.status === 'published' ? null : new Date(),
    },
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
    data: { status: 'archived', archivedAt: new Date() },
  });

  revalidatePath(`/invitations/${id}`);
  revalidatePath('/dashboard');
  redirect('/dashboard');
}

const guestSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  side: z.enum(['bride', 'groom']).optional(),
  hasPlusOne: z.boolean().default(false),
  plusOneName: z.string().max(100).optional(),
});

const addGuestsSchema = z.object({
  invitationId: z.string().uuid(),
  guests: z.array(guestSchema).min(1).max(500),
});

/**
 * Result of an add-guests call.
 * `created`        — newly inserted guests.
 * `reused`         — existing guests we updated (by normalised phone).
 * `skipped`        — guests we refused to insert (e.g. duplicate phone in
 *                    the same batch).
 * `guests`         — per-row details so the client can show the new links.
 *                    Each item includes the cleartext token; this is the
 *                    only time the server ever returns it.
 */
export interface AddGuestsActionResult {
  created: number;
  reused: number;
  skipped: number;
  guests: Array<{ id: string; name: string; token: string; phone: string | null }>;
}

export async function addGuestsAction(input: z.infer<typeof addGuestsSchema>): Promise<AddGuestsActionResult> {
  const ctx = await requireAuth();
  const parsed = addGuestsSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Ошибка валидации');

  const invitation = await prisma.invitation.findFirst({
    where: { id: parsed.data.invitationId, userId: ctx.user.id },
    select: { id: true, status: true },
  });
  if (!invitation) throw new Error('Приглашение не найдено');
  if (invitation.status !== 'published') throw new Error('Сначала опубликуйте приглашение');

  const result = await addGuests(
    parsed.data.invitationId,
    parsed.data.guests
  );

  revalidatePath(`/invitations/${parsed.data.invitationId}`);
  return result;
}

export async function deleteGuestAction(guestId: string) {
  const ctx = await requireAuth();

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, invitation: { userId: ctx.user.id } },
    select: { id: true, invitationId: true },
  });
  if (!guest) throw new Error('Гость не найден');

  await prisma.guest.delete({ where: { id: guestId } });
  revalidatePath(`/invitations/${guest.invitationId}`);
}
