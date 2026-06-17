import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { nanoid } from 'nanoid';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  checkSameOrigin,
  RATE_LIMITS,
  applyRateLimit,
  rateLimitResponse,
} from '@/lib/api';
import { getPaymentProvider } from '@/lib/payments';

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

const createOrderSchema = z.object({
  templateId: z.string().uuid(),
  provider: z.enum(['kaspi', 'stripe', 'mock']).default('mock'),
  customerName: z.string().min(2).max(100),
  customerPhone: z.string().min(10).max(20),
  eventDate: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), 'Некорректная дата'),
  eventType: eventTypeEnum.optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Resolve APP_URL in a way that is safe in production.
 * In dev we fall back to the request host so localhost works; in prod we
 * throw because the env var is required to build correct absolute URLs.
 */
function getAppUrl(request: NextRequest): string {
  const env = process.env.APP_URL;
  if (env) return env.replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production') {
    return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  }
  throw new ApiError('misconfigured', 'APP_URL is required in production', 500);
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
    const parsed = createOrderSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const template = await prisma.template.findUnique({
      where: { id: parsed.data.templateId, isActive: true },
    });
    if (!template) throw new ApiError('not_found', 'Шаблон не найден', 404);

    const order = await prisma.order.create({
      data: {
        userId: ctx.user.id,
        templateId: template.id,
        amountKzt: template.priceKzt,
        customerPhone: parsed.data.customerPhone,
        customerName: parsed.data.customerName,
        notes: parsed.data.notes || null,
        eventDate: new Date(parsed.data.eventDate),
        eventType: parsed.data.eventType ?? null,
        status: 'pending',
      },
    });

    const provider = getPaymentProvider(parsed.data.provider);
    const appUrl = getAppUrl(request);

    const payment = await provider.createPayment({
      orderId: order.id,
      amountKzt: order.amountKzt,
      description: `${template.nameRu} — цифровое приглашение`,
      customerPhone: parsed.data.customerPhone,
      successUrl: `${appUrl}/api/orders/${order.id}/success`,
      failUrl: `${appUrl}/templates/${template.slug}?payment=failed`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: payment.paymentId, paymentProvider: parsed.data.provider },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amountKzt: order.amountKzt,
        status: order.status,
        invitationId: order.invitationId,
      },
      paymentUrl: payment.paymentUrl,
      paymentId: payment.paymentId,
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Create order');
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const where = { userId: ctx.user.id };
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { template: { select: { nameRu: true, slug: true, previewImageUrl: true } } },
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
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get orders');
  }
}
