import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import {
  generateOTP,
  getOTPExpiry,
  normalizePhone,
  validatePhone,
  isKazakhPhone,
  getClientIpFromHeaders,
} from '@/lib/auth';
import { sendOTP } from '@/lib/sms';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/api';

const requestOTPSchema = z.object({
  phone: z.string().min(1, 'Введите номер телефона'),
});

export async function POST(request: NextRequest) {
  try {
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
        'Номер телефона должен быть в формате +77XXXXXXXXX (Казахстан) или +79XXXXXXXXX (Россия)',
        400
      );
    }

    const ip = getClientIpFromHeaders(request.headers);
    const phoneRate = await applyRateLimit(
      request,
      `otp_phone:${normalizedPhone}`,
      RATE_LIMITS.OTP_REQUEST_PER_PHONE
    );
    if (!phoneRate.allowed) return rateLimitResponse(phoneRate);

    const ipRate = await applyRateLimit(
      request,
      `otp_ip:${normalizedPhone}`,
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

    if (existingOTP) {
      const timeLeft = Math.ceil((existingOTP.expiresAt.getTime() - Date.now()) / 1000);
      if (timeLeft > 0) {
        throw new ApiError(
          'otp_pending',
          `Подождите ${timeLeft} секунд перед повторным запросом`,
          429
        );
      }
    }

    const code = generateOTP();

    await prisma.$transaction([
      prisma.oTPToken.updateMany({
        where: { phone: normalizedPhone, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.oTPToken.create({
        data: {
          phone: normalizedPhone,
          code,
          expiresAt: otpExpiry,
          attempts: 0,
          ipAddress: ip,
        },
      }),
    ]);

    const sent = await sendOTP(normalizedPhone, code);
    if (!sent) {
      throw new ApiError('sms_failed', 'Не удалось отправить SMS. Попробуйте позже.', 500);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] OTP for ${normalizedPhone}: ${code}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Код отправлен',
      expiresIn: otpExpiryMinutes * 60,
      isKazakh: isKazakhPhone(normalizedPhone),
      ...(process.env.NODE_ENV === 'development' ? { devCode: code } : {}),
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Request OTP');
  }
}
