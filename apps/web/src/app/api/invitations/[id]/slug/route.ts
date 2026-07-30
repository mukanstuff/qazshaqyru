import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  checkSameOrigin,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';

const RESERVED = new Set([
  'admin',
  'api',
  'dashboard',
  'demo',
  'i',
  'login',
  'r',
  'templates',
  'settings',
  'blog',
  'mock-payment',
  'new',
  'edit',
]);

const bodySchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Только латиница, цифры и дефис'),
});

/** Premium+: change public slug. */
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
    const rate = await applyRateLimit(request, `slug:${ctx.user.id}`, RATE_LIMITS.API_GENERAL);
    if (!rate.allowed) return rateLimitResponse(rate);

    const pricing = await getInvitationPricing(id, ctx.user.id);
    if (!pricing) throw new ApiError('not_found', 'Приглашение не найдено', 404);

    // 2026-07-30 P0-3: gate via fullAccess (template pay) || customSlug.
    // Message: "after template price payment" — no Premium/Standard.
    const canCustomSlug = pricing.fullAccess || pricing.entitlements.customSlug;
    if (!canCustomSlug) {
      throw new ApiError('plan_required', 'Своя ссылка доступна после оплаты цены шаблона', 402);
    }

    const raw = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Некорректный slug', 400, parsed.error.flatten());
    }

    const slug = parsed.data.slug.toLowerCase();
    if (RESERVED.has(slug)) {
      throw new ApiError('validation_error', 'Этот адрес занят системой', 400);
    }

    const taken = await prisma.invitation.findFirst({
      where: { slug, NOT: { id } },
      select: { id: true },
    });
    if (taken) {
      throw new ApiError('conflict', 'Этот адрес уже занят', 409);
    }

    const updated = await prisma.invitation.updateMany({
      where: { id, userId: ctx.user.id },
      data: { slug },
    });
    if (updated.count === 0) {
      throw new ApiError('not_found', 'Приглашение не найдено', 404);
    }

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Update slug');
  }
}
