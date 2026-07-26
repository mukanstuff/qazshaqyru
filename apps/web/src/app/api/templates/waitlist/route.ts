import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import { normalizePhone, validatePhone } from '@/lib/auth';
import { COMING_SOON_TEMPLATES } from '@/lib/templates/coming-soon';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z.object({
  slug: z.string().min(1).max(80),
  phone: z.string().min(10).max(32),
});

const ALLOWED_SLUGS = new Set(COMING_SOON_TEMPLATES.map((t) => t.slug));

/** Public waitlist for handmade coming-soon templates. */
export async function POST(request: NextRequest) {
  try {
    const rate = await applyRateLimit(
      request,
      'template_waitlist',
      RATE_LIMITS.API_TEMPLATE_WAITLIST
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    const raw = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const { slug } = parsed.data;
    if (!ALLOWED_SLUGS.has(slug)) {
      throw new ApiError('not_found', 'Шаблон не найден в waitlist', 404);
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!validatePhone(phone)) {
      throw new ApiError('validation_error', 'Некорректный номер телефона', 400);
    }

    await prisma.templateWaitlistSignup.create({
      data: { slug, phone },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Template waitlist');
  }
}
