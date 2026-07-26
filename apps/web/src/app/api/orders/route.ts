import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import { apiErrorResponse, requireAuth, applyAuthReadRateLimit, rateLimitResponse } from '@/lib/shared/api';

/** @deprecated Use POST /api/invitations + /api/invitations/[id]/checkout instead. */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'deprecated',
      message:
        'Этот endpoint устарел. Создайте приглашение через /api/invitations и оплатите через /api/invitations/[id]/checkout.',
    },
    { status: 410 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const readRate = await applyAuthReadRateLimit(request, ctx.user.id);
    if (!readRate.allowed) return rateLimitResponse(readRate);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const where = { userId: ctx.user.id };
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { template: { select: { nameRu: true, slug: true, previewImageUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get orders');
  }
}
