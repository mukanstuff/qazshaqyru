import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  getClientIpFromHeaders,
  hashPassword,
  isKazakhPhone,
  MIN_PASSWORD_LENGTH,
  normalizePhone,
  validatePhone,
} from '@/lib/auth';
import {
  applyLocaleCookieFromUser,
  buildSessionResponse,
  issueSession,
} from '@/lib/auth/identity-merge';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  checkSameOrigin,
  RATE_LIMITS,
  rateLimitResponse,
} from '@/lib/shared/api';

/**
 * POST /api/auth/register — { phone, password, name? }
 *
 * Creates an account and signs it in immediately. There is no verification
 * step: the product decision (2026-09-01) is phone + password with nothing to
 * confirm, replacing the WhatsApp one-time-code flow.
 *
 * Consequence worth knowing: with no verification channel there is also no
 * self-service password reset. The sign-in screen points people at WhatsApp
 * support instead.
 */
const schema = z.object({
  phone: z.string().min(1),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
  name: z.string().trim().max(120).optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ip = getClientIpFromHeaders(request.headers);
    const rate = await applyRateLimit(request, `register:${ip}`, RATE_LIMITS.AUTH_REGISTER_PER_IP);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const tooShort = parsed.error.issues.some((i) => i.path[0] === 'password');
      throw new ApiError(
        tooShort ? 'weak_password' : 'invalid_input',
        tooShort
          ? `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`
          : 'Проверьте введённые данные',
        400
      );
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!validatePhone(phone)) {
      throw new ApiError(
        'invalid_phone',
        'Номер телефона должен быть в формате +77XXXXXXXXX',
        400
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          phone,
          passwordHash,
          name: parsed.data.name?.trim() || null,
          language: isKazakhPhone(phone) ? 'kz' : 'ru',
          identities: {
            create: { provider: 'phone', providerId: phone, lastUsedAt: new Date() },
          },
        },
      });
    } catch (err) {
      // P2002 on User.phone — the number already has an account. Let the
      // unique constraint be the check rather than a read-then-write, which
      // would race two simultaneous sign-ups into duplicate rows.
      if ((err as { code?: string } | null)?.code === 'P2002') {
        throw new ApiError('phone_taken', 'Этот номер уже зарегистрирован. Войдите.', 409);
      }
      throw err;
    }

    const { token, expiresAt } = await issueSession({
      userId: user.id,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
    });

    const response = buildSessionResponse(user, token, expiresAt);
    applyLocaleCookieFromUser(response, user, Boolean(request.cookies.get('locale')));
    return response;
  } catch (error) {
    return apiErrorResponse(error as Error, 'Register');
  }
}
