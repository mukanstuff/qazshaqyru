import { NextRequest, NextResponse } from 'next/server';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  applyRateLimit,
  applyAuthReadRateLimit,
  rateLimitResponse,
  checkSameOrigin,
  RATE_LIMITS,
  parseJsonBody,
} from '@/lib/shared/api';
import prisma from '@/lib/shared/db';
import { DEFAULT_TEMPLATE_SLUG } from '@/lib/templates/catalog';
import { invitationCreateBodySchema } from '@/lib/invitations/schemas';
import { createInvitationForUser } from '@/lib/invitations/InvitationService';

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await requireAuth();
    const rate = await applyRateLimit(request, ctx.user.id, RATE_LIMITS.API_INVITATION_CREATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const data = await parseJsonBody(request, invitationCreateBodySchema);
    const invitation = await createInvitationForUser(ctx.user.id, {
      ...data,
      templateKey: data.templateKey || DEFAULT_TEMPLATE_SLUG,
    });

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Create invitation');
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const readRate = await applyAuthReadRateLimit(request, ctx.user.id);
    if (!readRate.allowed) return rateLimitResponse(readRate);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status');

    const where: { userId: string; status?: 'draft' | 'published' | 'archived' } = { userId: ctx.user.id };
    if (status === 'draft' || status === 'published' || status === 'archived') {
      where.status = status;
    }

    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where,
        include: {
          _count: { select: { guests: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invitation.count({ where }),
    ]);

    return NextResponse.json({
      invitations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get invitations');
  }
}
