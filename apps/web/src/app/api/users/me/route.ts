import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import { ApiError, apiErrorResponse, requireAuth, checkSameOrigin } from '@/lib/shared/api';

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  language: z.enum(['kz', 'ru']).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await requireAuth();
    const data = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const validation = updateUserSchema.safeParse(data);
    if (!validation.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, validation.error.flatten());
    }

    const updated = await prisma.user.update({
      where: { id: ctx.user.id },
      data: validation.data,
      select: { id: true, phone: true, name: true, language: true, isAdmin: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Update user');
  }
}
