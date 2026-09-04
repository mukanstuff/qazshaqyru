import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from '@/lib/auth';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  checkSameOrigin,
  RATE_LIMITS,
  rateLimitResponse,
  requireAuth,
} from '@/lib/shared/api';

/**
 * POST /api/auth/change-password — { currentPassword?, newPassword }
 *
 * There was no way to change a password at all: /settings edits only name and
 * language, and with no verification channel there is no reset flow either, so
 * a customer who wanted to rotate a password had nothing to use.
 *
 * `currentPassword` is required only when the account already has one. An
 * account created through Google has no hash, so this is also how such a user
 * adds phone sign-in — provided their account actually has a phone on it.
 */
const schema = z.object({
  currentPassword: z.string().max(200).optional(),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH).max(200),
});

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await requireAuth();
    const rate = await applyRateLimit(
      request,
      `change_password:${ctx.user.id}`,
      RATE_LIMITS.AUTH_LOGIN_PER_PHONE
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        'weak_password',
        `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`,
        400
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, phone: true, passwordHash: true },
    });
    if (!user) throw new ApiError('not_found', 'Аккаунт не найден', 404);

    if (user.passwordHash) {
      const current = parsed.data.currentPassword ?? '';
      if (!current || !(await verifyPassword(current, user.passwordHash))) {
        throw new ApiError('invalid_credentials', 'Текущий пароль неверен', 401);
      }
    } else if (!user.phone) {
      // Setting a first password on an account with no phone would create
      // credentials that can never be used to sign in — the login form is
      // phone + password.
      throw new ApiError(
        'phone_required',
        'Сначала добавьте номер телефона к аккаунту',
        400
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Change password');
  }
}
