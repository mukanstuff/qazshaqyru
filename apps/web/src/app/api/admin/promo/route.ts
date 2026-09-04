import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  checkSameOrigin,
  requireAdmin,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import { isPromoCodeValidFormat, normalizePromoCode } from '@/lib/payments/promo';

export const dynamic = 'force-dynamic';

// Mirrors `enum PromoKind` / `enum PromoScope` in prisma/schema.prisma, for the
// same reason the template route mirrors TemplateCategory: enum names do not
// resolve as named imports from '@prisma/client' in this workspace.
const PROMO_KINDS = ['percent', 'fixed'] as const;
const PROMO_SCOPES = ['template', 'agency', 'all'] as const;

const createSchema = z
  .object({
    code: z.string().min(3).max(40),
    kind: z.enum(PROMO_KINDS),
    value: z.number().int().positive(),
    scope: z.enum(PROMO_SCOPES).default('template'),
    maxRedemptions: z.number().int().positive().max(100000).nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    note: z.string().max(200).nullable().optional(),
  })
  .refine((v) => v.kind !== 'percent' || v.value <= 100, {
    message: 'Процент не может быть больше 100',
    path: ['value'],
  });

const patchSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  maxRedemptions: z.number().int().positive().max(100000).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  note: z.string().max(200).nullable().optional(),
});

/** GET — every code, newest first, with what each has actually earned. */
export async function GET() {
  try {
    await requireAdmin();

    const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });

    // What the code brought in, counted from paid orders only — `redemptions`
    // counts orders created, which includes ones nobody ever paid for.
    const earned = await prisma.order.groupBy({
      by: ['promoCodeId'],
      where: { status: 'paid', promoCodeId: { not: null } },
      _sum: { amountKzt: true, discountKzt: true },
      _count: { _all: true },
    });
    const byId = new Map(
      earned.map((row: { promoCodeId: string | null; _sum: { amountKzt: number | null; discountKzt: number | null }; _count: { _all: number } }) => [
        row.promoCodeId,
        {
          paidOrders: row._count._all,
          revenueKzt: row._sum.amountKzt ?? 0,
          discountedKzt: row._sum.discountKzt ?? 0,
        },
      ])
    );

    return NextResponse.json({
      codes: codes.map((c: { id: string }) => ({
        ...c,
        stats: byId.get(c.id) ?? { paidOrders: 0, revenueKzt: 0, discountedKzt: 0 },
      })),
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'List promo codes');
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) throw new ApiError('forbidden', 'Неверный origin', 403);
    const ctx = await requireAdmin();
    const rate = await applyRateLimit(request, `admin_promo:${ctx.user.id}`, RATE_LIMITS.API_ADMIN_MUTATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const code = normalizePromoCode(parsed.data.code);
    if (!isPromoCodeValidFormat(code)) {
      throw new ApiError(
        'validation_error',
        'Код может содержать только латинские буквы, цифры, дефис и подчёркивание',
        400
      );
    }

    const existing = await prisma.promoCode.findUnique({ where: { code } });
    if (existing) throw new ApiError('duplicate', 'Такой код уже есть', 409);

    const created = await prisma.promoCode.create({
      data: {
        code,
        kind: parsed.data.kind,
        value: parsed.data.value,
        scope: parsed.data.scope,
        maxRedemptions: parsed.data.maxRedemptions ?? null,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        note: parsed.data.note ?? null,
      },
    });

    return NextResponse.json({ promoCode: created }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Create promo code');
  }
}

/**
 * PATCH — edit a code.
 *
 * `kind` and `value` are deliberately not editable: orders already record the
 * discount they got, but a customer who was quoted 20% and paid later would be
 * charged whatever the code says at that moment. Make a new code instead.
 */
export async function PATCH(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) throw new ApiError('forbidden', 'Неверный origin', 403);
    await requireAdmin();

    const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const { id, expiresAt, ...rest } = parsed.data;
    const updated = await prisma.promoCode.update({
      where: { id },
      data: {
        ...rest,
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
      },
    });

    return NextResponse.json({ promoCode: updated });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Update promo code');
  }
}
