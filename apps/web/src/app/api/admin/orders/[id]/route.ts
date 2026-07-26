import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import { ApiError, apiErrorResponse, checkSameOrigin, requireAdmin } from '@/lib/shared/api';
import { ManagedOrderStatus } from '@prisma/client';

const patchSchema = z.object({
  managedStatus: z.enum([
    'pending',
    'contacted',
    'in_progress',
    'ready',
    'delivered',
    'cancelled',
  ] as [ManagedOrderStatus, ...ManagedOrderStatus[]]),
  adminNotes: z.string().max(2000).optional(),
});

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    await requireAdmin();

    const { id } = await params;
    const body = await request.json().catch(() => {
      throw new ApiError('invalid_json', 'Некорректный JSON', 400);
    });
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const existing = await prisma.order.findFirst({
      where: { id, orderType: 'managed' },
      select: { id: true },
    });
    if (!existing) {
      throw new ApiError('not_found', 'Managed-заказ не найден', 404);
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        managedStatus: parsed.data.managedStatus,
        ...(parsed.data.adminNotes !== undefined ? { adminNotes: parsed.data.adminNotes } : {}),
      },
      include: {
        template: { select: { nameRu: true, slug: true } },
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Admin update managed order');
  }
}
