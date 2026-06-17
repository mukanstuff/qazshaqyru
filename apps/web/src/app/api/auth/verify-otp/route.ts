import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  normalizePhone,
  generateSessionToken,
  getSessionExpiry,
  hashToken,
  getClientIpFromHeaders,
} from '@/lib/auth';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  rateLimitResponse,
  setSessionCookie,
  clearSessionCookie,
  RATE_LIMITS,
} from '@/lib/api';
import { isKazakhPhone } from '@/lib/auth';

const verifyOTPSchema = z.object({
  phone: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Код должен быть 6-значным числом'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const validation = verifyOTPSchema.safeParse(body);
    if (!validation.success) {
      throw new ApiError('invalid_input', 'Введите номер телефона и 6-значный код', 400);
    }

    const { phone, code } = validation.data;
    const normalizedPhone = normalizePhone(phone);

    const phoneRate = await applyRateLimit(
      request,
      `verify_phone:${normalizedPhone}`,
      RATE_LIMITS.OTP_VERIFY_PER_PHONE
    );
    if (!phoneRate.allowed) return rateLimitResponse(phoneRate);

    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);
    const ip = getClientIpFromHeaders(request.headers);

    const result = await prisma.$transaction(async (tx) => {
      const otpToken = await tx.oTPToken.findFirst({
        where: {
          phone: normalizedPhone,
          expiresAt: { gt: new Date() },
          usedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpToken) {
        return { error: 'invalid_otp' as const, status: 400 };
      }

      if (otpToken.attempts >= maxAttempts) {
        await tx.oTPToken.update({
          where: { id: otpToken.id },
          data: { usedAt: new Date() },
        });
        return { error: 'max_attempts' as const, status: 429 };
      }

      if (otpToken.code !== code) {
        await tx.oTPToken.update({
          where: { id: otpToken.id },
          data: { attempts: { increment: 1 } },
        });
        return {
          error: 'wrong_code' as const,
          status: 400,
          attemptsLeft: maxAttempts - otpToken.attempts - 1,
        };
      }

      await tx.oTPToken.update({
        where: { id: otpToken.id },
        data: { usedAt: new Date() },
      });

      return { success: true as const, otpToken };
    });

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
    const tokenHash = hashToken(sessionToken);

    const user = await prisma.user.upsert({
      where: { phone: normalizedPhone },
      create: {
        phone: normalizedPhone,
        language: isKazakhPhone(normalizedPhone) ? 'kz' : 'ru',
      },
      update: {},
    });

    await prisma.oTPToken.updateMany({
      where: { phone: normalizedPhone, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: sessionExpiry,
        deviceInfo: request.headers.get('user-agent') || null,
        ipAddress: ip,
      },
    });

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
