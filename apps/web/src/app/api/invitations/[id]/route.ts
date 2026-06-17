import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { ApiError, apiErrorResponse, requireAuth, checkSameOrigin } from '@/lib/api';

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

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  eventType: eventTypeEnum.optional(),
  eventDate: z
    .string()
    .transform((str, ctx) => {
      const date = new Date(str);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: 'custom', message: 'Некорректная дата' });
        return z.NEVER;
      }
      return date;
    })
    .optional(),
  eventTime: z.string().max(20).nullable().optional(),
  eventPlace: z.string().max(300).nullable().optional(),
  eventTimezone: z.string().max(50).optional(),
  templateId: z.string().uuid().nullable().optional(),
  templateKey: z.string().max(50).optional(),
  templateData: z.record(z.unknown()).optional(),
  musicUrl: z.string().url().nullable().optional().or(z.literal('')),
  mapUrl: z.string().url().nullable().optional().or(z.literal('')),
  address: z.string().max(500).nullable().optional(),
  customText: z.record(z.unknown()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();

    const invitation = await prisma.invitation.findFirst({
      where: { id, userId: ctx.user.id },
      include: {
        guests: {
          include: { response: true },
          orderBy: { createdAt: 'asc' },
        },
        template: true,
      },
    });

    if (!invitation) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get invitation');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const { id } = await params;
    const ctx = await requireAuth();

    const data = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const validation = updateSchema.safeParse(data);
    if (!validation.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, validation.error.flatten());
    }

    const existing = await prisma.invitation.findFirst({
      where: { id, userId: ctx.user.id },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    const v = validation.data;
    const updateData: Record<string, unknown> = {};
    if (v.title !== undefined) updateData.title = v.title;
    if (v.eventType !== undefined) updateData.eventType = v.eventType;
    if (v.eventDate !== undefined) updateData.eventDate = v.eventDate;
    if (v.eventTime !== undefined) updateData.eventTime = v.eventTime;
    if (v.eventPlace !== undefined) updateData.eventPlace = v.eventPlace;
    if (v.eventTimezone !== undefined) updateData.eventTimezone = v.eventTimezone;
    if (v.templateId !== undefined) updateData.templateId = v.templateId;
    if (v.templateKey !== undefined) updateData.templateKey = v.templateKey;
    if (v.templateData !== undefined) updateData.templateData = v.templateData;
    if (v.customText !== undefined) updateData.customText = v.customText;
    if (v.musicUrl !== undefined) updateData.musicUrl = v.musicUrl === '' ? null : v.musicUrl;
    if (v.mapUrl !== undefined) updateData.mapUrl = v.mapUrl === '' ? null : v.mapUrl;
    if (v.address !== undefined) updateData.address = v.address;

    if (v.status !== undefined) {
      updateData.status = v.status;
      if (v.status === 'published' && existing.status !== 'published') {
        updateData.publishedAt = new Date();
      }
      if (v.status === 'archived' && existing.status !== 'archived') {
        updateData.archivedAt = new Date();
      }
    }

    const invitation = await prisma.invitation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Update invitation');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const { id } = await params;
    const ctx = await requireAuth();

    const existing = await prisma.invitation.findFirst({
      where: { id, userId: ctx.user.id },
      select: { id: true },
    });
    if (!existing) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    await prisma.invitation.update({
      where: { id },
      data: { status: 'archived', archivedAt: new Date() },
    });

    return NextResponse.json({ success: true, archived: true });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Archive invitation');
  }
}
