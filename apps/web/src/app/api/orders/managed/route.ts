/**
 * Managed order endpoint — "Сделаем за вас" flow.
 *
 * No authentication required.
 * Creates a pending managed order and notifies the admin via WhatsApp.
 *
 * Flow:
 * 1. Client fills simple form (no login needed)
 * 2. Order saved as orderType=managed, managedStatus=pending
 * 3. Admin WhatsApp notification sent
 * 4. Admin sees order in dashboard, contacts client, creates invitation manually
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  getClientIp,
  rateLimitResponse,
  RATE_LIMITS,
  checkSameOrigin,
  requireAdmin,
} from '@/lib/shared/api';
import { sendManagedOrderNotification } from '@/lib/shared/notifications';
import { safeEqualStr, normalizePhone, validatePhone } from '@/lib/auth';
import { verifyCaptchaToken } from '@/lib/shared/captcha';
import { EVENT_TYPES } from '@/lib/shared/types';

const managedOrderSchema = z.object({
  templateId: z.string().uuid(),
  customerName: z.string().min(2).max(100),
  customerPhone: z.string().min(10).max(20),
  website: z.string().max(200).optional(),
  captchaToken: z.string().max(2048).optional(),
  eventDate: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return undefined;
      const parsed = new Date(val);
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Некорректная дата события',
        });
        return z.NEVER;
      }
      return parsed.toISOString();
    }),
  eventType: z.enum(EVENT_TYPES).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    // Rate limit by IP for this public endpoint
    const ip = getClientIp(request) || 'unknown';

    const rate = await applyRateLimit(request, `managed_order:${ip}`, RATE_LIMITS.API_INVITATION_CREATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const data = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });

    const parsed = managedOrderSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const captcha = await verifyCaptchaToken({
      token: parsed.data.captchaToken,
      remoteIp: ip,
    });
    if (!captcha.ok) {
      throw new ApiError('captcha_failed', 'Не удалось пройти проверку captcha', 400);
    }

    // Honeypot — bots fill hidden "website" field; silently accept to avoid revealing the trap
    if (parsed.data.website && parsed.data.website.trim().length > 0) {
      return NextResponse.json({
        success: true,
        order: { id: 'bot', amountKzt: 0 },
        message: 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.',
      });
    }

    const normalizedPhone = normalizePhone(parsed.data.customerPhone);
    if (!validatePhone(normalizedPhone)) {
      throw new ApiError(
        'validation_error',
        'Номер телефона должен быть в формате +77XXXXXXXXX (Казахстан)',
        400
      );
    }

    const template = await prisma.template.findUnique({
      where: { id: parsed.data.templateId, isActive: true },
    });
    if (!template) throw new ApiError('not_found', 'Шаблон не найден', 404);

    // Create managed order (no userId — anonymous client)
    const order = await prisma.order.create({
      data: {
        templateId: template.id,
        customerPhone: normalizedPhone,
        customerName: parsed.data.customerName,
        eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null,
        eventType: parsed.data.eventType || null,
        notes: parsed.data.notes || null,
        amountKzt: template.priceKzt,
        status: 'pending' as const,
        orderType: 'managed' as const,
        managedStatus: 'pending' as const,
      },
    });

    // Send WhatsApp notification to admin — non-fatal, but log if it fails
    const notified = await sendManagedOrderNotification({
      customerName: parsed.data.customerName,
      customerPhone: normalizedPhone,
      templateName: template.nameRu,
      eventDate: parsed.data.eventDate,
      notes: parsed.data.notes,
      orderId: order.id,
    });
    if (!notified) {
      console.warn(`[ManagedOrder] WhatsApp notification failed for order #${order.id}. Admin should check dashboard.`);
    }

    console.log(`[ManagedOrder] New order #${order.id} from ${parsed.data.customerName} (${parsed.data.customerPhone})`);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amountKzt: order.amountKzt,
      },
      message: 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.',
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Create managed order');
  }
}

export async function GET(request: NextRequest) {
  const adminKey = process.env.ADMIN_API_KEY ?? '';
  const authHeader = request.headers.get('authorization') ?? '';
  const expected = adminKey ? `Bearer ${adminKey}` : '';
  const hasValidApiKey = Boolean(expected) && safeEqualStr(authHeader, expected);

  if (!hasValidApiKey) {
    try {
      await requireAdmin();
    } catch {
      const ip = getClientIp(request) || 'unknown';
      const rate = await applyRateLimit(request, `admin_managed:${ip}`, RATE_LIMITS.API_GENERAL);
      if (!rate.allowed) return rateLimitResponse(rate);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  const where = { orderType: 'managed' as const };
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { template: { select: { nameRu: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
