import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  generateOTP,
  getOTPExpiry,
  normalizePhone,
  validatePhone,
  isKazakhPhone,
  getClientIpFromHeaders,
  hashOTP,
} from '@/lib/auth';
import { sendOTP, isSmsProviderReady, formatSmsConfigError } from '@/lib/shared/sms';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  applyGlobalRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  checkSameOrigin,
} from '@/lib/shared/api';

const requestOTPSchema = z.object({
  phone: z.string().min(1, 'Введите номер телефона'),
});

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    if (process.env.NODE_ENV === 'production' && !isSmsProviderReady()) {
      throw new ApiError('sms_not_configured', formatSmsConfigError(), 503);
    }

    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const validation = requestOTPSchema.safeParse(body);
    if (!validation.success) {
      throw new ApiError('invalid_phone', 'Введите корректный номер телефона', 400);
    }

    const normalizedPhone = normalizePhone(validation.data.phone);
    if (!validatePhone(normalizedPhone)) {
      throw new ApiError(
        'invalid_phone',
        process.env.NODE_ENV === 'production'
          ? 'Номер телефона должен быть в формате +77XXXXXXXXX (Казахстан)'
          : 'Номер телефона должен быть в формате +77XXXXXXXXX (Казахстан) или +79XXXXXXXXX (Россия, только dev)',
        400
      );
    }

    const ip = getClientIpFromHeaders(request.headers);
    const phoneRate = await applyGlobalRateLimit(
      `otp_phone:${normalizedPhone}`,
      RATE_LIMITS.OTP_REQUEST_PER_PHONE
    );
    if (!phoneRate.allowed) return rateLimitResponse(phoneRate);

    const ipRate = await applyRateLimit(
      request,
      `otp_ip:${ip}`,
      RATE_LIMITS.OTP_REQUEST_PER_IP
    );
    if (!ipRate.allowed) return rateLimitResponse(ipRate);

    const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
    if (Number.isNaN(otpExpiryMinutes) || otpExpiryMinutes < 1 || otpExpiryMinutes > 60) {
      throw new Error('Invalid OTP_EXPIRY_MINUTES');
    }
    const otpExpiry = getOTPExpiry(otpExpiryMinutes);

    const existingOTP = await prisma.oTPToken.findFirst({
      where: {
        phone: normalizedPhone,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const OTP_RESEND_COOLDOWN_MS = 90_000;
    if (existingOTP) {
      const ageMs = Date.now() - existingOTP.createdAt.getTime();
      if (ageMs < OTP_RESEND_COOLDOWN_MS) {
        throw new ApiError(
          'otp_pending',
          'Подождите перед повторным запросом',
          429
        );
      }
      await prisma.oTPToken.updateMany({
        where: { phone: normalizedPhone, usedAt: null },
        data: { usedAt: new Date() },
      });
    }

    const code = generateOTP();
    const codeHash = await hashOTP(code);

    await prisma.$transaction([
      prisma.oTPToken.updateMany({
        where: { phone: normalizedPhone, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.oTPToken.create({
        data: {
          phone: normalizedPhone,
          codeHash,
          expiresAt: otpExpiry,
          attempts: 0,
          ipAddress: ip,
        },
      }),
    ]);

    const sent = await sendOTP(normalizedPhone, code);
    if (!sent) {
      // Roll back pending OTP so the user can request a new code immediately.
      await prisma.oTPToken.updateMany({
        where: { phone: normalizedPhone, usedAt: null },
        data: { usedAt: new Date() },
      });
      const smsHint =
        process.env.NODE_ENV === 'production' && !isSmsProviderReady()
          ? formatSmsConfigError()
          : 'Не удалось отправить SMS. Попробуйте позже.';
      throw new ApiError('sms_failed', smsHint, 500);
    }

    return NextResponse.json({
      success: true,
      message: 'Код отправлен',
      expiresIn: otpExpiryMinutes * 60,
      isKazakh: isKazakhPhone(normalizedPhone),
      ...(process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_OTP_CODE === 'true'
        ? { devCode: code }
        : {}),
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Request OTP');
  }
}
