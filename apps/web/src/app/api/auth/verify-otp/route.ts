import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  normalizePhone,
  generateSessionToken,
  getSessionExpiry,
  hashToken,
  getClientIpFromHeaders,
  isKazakhPhone,
  verifyOTP,
  validatePhone,
} from '@/lib/auth';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  applyGlobalRateLimit,
  rateLimitResponse,
  setSessionCookie,
  RATE_LIMITS,
  checkSameOrigin,
} from '@/lib/shared/api';
import { getOtpMaxAttempts } from '@/lib/shared/env';

const verifyOTPSchema = z.object({
  phone: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Код должен быть 6-значным числом'),
});

/** Interactive txn budget — bcrypt verify stays outside so cold start cannot blow P2028. */
const OTP_TXN_OPTIONS = { maxWait: 10_000, timeout: 15_000 } as const;

type OtpVerifyResult =
  | { error: 'invalid_otp'; status: 400 }
  | { error: 'max_attempts'; status: 429 }
  | { error: 'wrong_code'; status: 400; attemptsLeft: number }
  | { success: true };

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });

    const validation = verifyOTPSchema.safeParse(body);
    if (!validation.success) {
      throw new ApiError('invalid_input', 'Введите номер телефона и 6-значный код', 400);
    }

    const { phone, code } = validation.data;
    const normalizedPhone = normalizePhone(phone);

    if (!validatePhone(normalizedPhone)) {
      throw new ApiError('invalid_phone', 'Некорректный номер телефона', 400);
    }

    const ip = getClientIpFromHeaders(request.headers);

    const ipRate = await applyRateLimit(request, `verify_ip:${ip}`, RATE_LIMITS.OTP_VERIFY_PER_IP);
    if (!ipRate.allowed) return rateLimitResponse(ipRate);

    const phoneRate = await applyGlobalRateLimit(
      `verify_phone:${normalizedPhone}`,
      RATE_LIMITS.OTP_VERIFY_PER_PHONE
    );
    if (!phoneRate.allowed) return rateLimitResponse(phoneRate);

    const maxAttempts = getOtpMaxAttempts();

    // Read + bcrypt outside the interactive transaction (cold compile / slow DB → P2028).
    const otpToken = await prisma.oTPToken.findFirst({
      where: {
        phone: normalizedPhone,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpToken) {
      throw new ApiError('invalid_otp', 'Код не найден или истек. Запросите новый код.', 400);
    }

    if (otpToken.attempts >= maxAttempts) {
      await prisma.oTPToken.update({
        where: { id: otpToken.id },
        data: { usedAt: new Date() },
      });
      throw new ApiError(
        'max_attempts',
        'Превышено количество попыток. Запросите новый код.',
        429
      );
    }

    const isValid = await verifyOTP(code, otpToken.codeHash);

    type PrismaTx = any;
    const result: OtpVerifyResult = await prisma.$transaction(async (tx: PrismaTx) => {
      const fresh = await tx.oTPToken.findFirst({
        where: {
          id: otpToken.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!fresh) {
        return { error: 'invalid_otp' as const, status: 400 };
      }

      if (fresh.attempts >= maxAttempts) {
        await tx.oTPToken.update({
          where: { id: fresh.id },
          data: { usedAt: new Date() },
        });
        return { error: 'max_attempts' as const, status: 429 };
      }

      if (!isValid) {
        await tx.oTPToken.update({
          where: { id: fresh.id },
          data: { attempts: { increment: 1 } },
        });
        return {
          error: 'wrong_code' as const,
          status: 400,
          attemptsLeft: Math.max(0, maxAttempts - fresh.attempts - 1),
        };
      }

      const consumed = await tx.oTPToken.updateMany({
        where: { id: fresh.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });

      if (consumed.count !== 1) {
        return { error: 'invalid_otp' as const, status: 400 };
      }

      return { success: true as const };
    }, OTP_TXN_OPTIONS);

    if ('error' in result) {
      const message =
        result.error === 'max_attempts'
          ? 'Превышено количество попыток. Запросите новый код.'
          : result.error === 'wrong_code'
            ? `Неверный код. Осталось попыток: ${result.attemptsLeft ?? 0}`
            : 'Код не найден или истек. Запросите новый код.';
      throw new ApiError(result.error ?? 'verify_failed', message, result.status ?? 400);
    }

    const sessionToken = generateSessionToken();
    const sessionExpiry = getSessionExpiry();
    const sessionTokenHash = hashToken(sessionToken);

    const user = await prisma.$transaction(async (tx: PrismaTx) => {
      await tx.session.updateMany({
        where: { user: { phone: normalizedPhone }, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      const user = await tx.user.upsert({
        where: { phone: normalizedPhone },
        create: {
          phone: normalizedPhone,
          language: isKazakhPhone(normalizedPhone) ? 'kz' : 'ru',
        },
        update: {},
      });

      await tx.session.create({
        data: {
          userId: user.id,
          tokenHash: sessionTokenHash,
          expiresAt: sessionExpiry,
          deviceInfo: request.headers.get('user-agent') || null,
          ipAddress: ip,
        },
      });

      return user;
    }, OTP_TXN_OPTIONS);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        language: user.language,
        name: user.name,
        isAdmin: user.isAdmin,
      },
      expiresAt: sessionExpiry.toISOString(),
    });

    setSessionCookie(response, sessionToken, sessionExpiry);
    return response;
  } catch (error) {
    return apiErrorResponse(error as Error, 'Verify OTP');
  }
}
