import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { nanoid } from 'nanoid';
import { Prisma } from '@prisma/client';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  applyRateLimit,
  rateLimitResponse,
  checkSameOrigin,
  RATE_LIMITS,
} from '@/lib/api';

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

const invitationSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  eventType: eventTypeEnum,
  eventDate: z.string().transform((str, ctx) => {
    const date = new Date(str);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Некорректная дата' });
      return z.NEVER;
    }
    return date;
  }),
  eventTime: z.string().max(20).optional(),
  eventPlace: z.string().max(300).optional(),
  eventTimezone: z.string().max(50).default('Asia/Almaty'),
  templateId: z.string().uuid().optional(),
  templateKey: z.string().max(50).default('classic'),
  templateData: z.record(z.unknown()).optional(),
  musicUrl: z.string().url().optional().or(z.literal('')),
  mapUrl: z.string().url().optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  customText: z.record(z.unknown()).optional(),
});

function generateUniqueSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 20);
  return `${nanoid(10)}-${base || 'invitation'}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await requireAuth();
    const rate = await applyRateLimit(request, ctx.user.id, RATE_LIMITS.API_INVITATION_CREATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const data = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const validation = invitationSchema.safeParse(data);
    if (!validation.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, validation.error.flatten());
    }

    const v = validation.data;
    let invitation;
    let attempts = 0;
    let lastError;

    while (attempts < 3) {
      try {
        const slug = generateUniqueSlug(v.title);
        invitation = await prisma.invitation.create({
          data: {
            userId: ctx.user.id,
            slug,
            title: v.title,
            eventType: v.eventType,
            eventDate: v.eventDate,
            eventTime: v.eventTime || null,
            eventPlace: v.eventPlace || null,
            eventTimezone: v.eventTimezone,
            templateId: v.templateId || null,
            templateKey: v.templateKey,
            templateData: (v.templateData || {}) as Prisma.InputJsonValue,
            musicUrl: v.musicUrl || null,
            mapUrl: v.mapUrl || null,
            address: v.address || null,
            customText: (v.customText || {}) as Prisma.InputJsonValue,
            status: 'draft',
          },
        });
        break;
      } catch (err: unknown) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code: string }).code === 'P2002'
        ) {
          attempts++;
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    if (!invitation) {
      throw new ApiError('slug_collision', 'Не удалось сгенерировать уникальный slug', 500);
    }

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Create invitation');
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status');

    const where: { userId: string; status?: 'draft' | 'published' | 'archived' } = { userId: ctx.user.id };
    if (status === 'draft' || status === 'published' || status === 'archived') {
      where.status = status;
    }

    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where,
        include: {
          _count: { select: { guests: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invitation.count({ where }),
    ]);

    return NextResponse.json({
      invitations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get invitations');
  }
}
