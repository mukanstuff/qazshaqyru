import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  burnPasswordComparison,
  getClientIpFromHeaders,
  normalizePhone,
  validatePhone,
  verifyPassword,
} from '@/lib/auth';
import {
  applyLocaleCookieFromUser,
  buildSessionResponse,
  issueSession,
} from '@/lib/auth/identity-merge';
import {
  ApiError,
  apiErrorResponse,
  applyGlobalRateLimit,
  applyRateLimit,
  checkSameOrigin,
  RATE_LIMITS,
  rateLimitResponse,
} from '@/lib/shared/api';

/** POST /api/auth/login — { phone, password } */
const schema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('invalid_input', 'Введите номер телефона и пароль', 400);
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!validatePhone(phone)) {
      throw new ApiError('invalid_credentials', 'Неверный номер телефона или пароль', 401);
    }

    const ip = getClientIpFromHeaders(request.headers);
    // Per-phone budget is global (not per-IP) on purpose: an attacker with a
    // pool of addresses would otherwise get a fresh allowance per address.
    const phoneRate = await applyGlobalRateLimit(
      `login_phone:${phone}`,
      RATE_LIMITS.AUTH_LOGIN_PER_PHONE
    );
    if (!phoneRate.allowed) return rateLimitResponse(phoneRate);
    const ipRate = await applyRateLimit(request, `login_ip:${ip}`, RATE_LIMITS.AUTH_LOGIN_PER_IP);
    if (!ipRate.allowed) return rateLimitResponse(ipRate);

    const user = await prisma.user.findUnique({ where: { phone } });

    // One message and one rough response time for every failure: "no such
    // number", "this account is Google-only" and "wrong password" must not be
    // distinguishable, or the endpoint becomes a way to enumerate customers.
    if (!user?.passwordHash) {
      await burnPasswordComparison(parsed.data.password);
      throw new ApiError('invalid_credentials', 'Неверный номер телефона или пароль', 401);
    }

    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      throw new ApiError('invalid_credentials', 'Неверный номер телефона или пароль', 401);
    }

    await prisma.identity.upsert({
      where: { provider_providerId: { provider: 'phone', providerId: phone } },
      create: { userId: user.id, provider: 'phone', providerId: phone, lastUsedAt: new Date() },
      update: { lastUsedAt: new Date() },
    });

    const { token, expiresAt } = await issueSession({
      userId: user.id,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
    });

    const response = buildSessionResponse(user, token, expiresAt);
    applyLocaleCookieFromUser(response, user, Boolean(request.cookies.get('locale')));
    return response;
  } catch (error) {
    return apiErrorResponse(error as Error, 'Login');
  }
}
