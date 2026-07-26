import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import {
  apiErrorResponse,
  applyRateLimit,
  checkSameOrigin,
  getClientIp,
  getCurrentSession,
  rateLimitResponse,
  RATE_LIMITS,
  ApiError,
} from '@/lib/shared/api';
import { createUploadToken } from '@/lib/uploads/upload-token';
import prisma from '@/lib/shared/db';

export const dynamic = 'force-dynamic';

/**
 * Upload tokens for anonymous draft editors (before login).
 * Authenticated users upload via session + invitationId in the form body.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    const invitationId = new URL(request.url).searchParams.get('invitationId');

    if (session) {
      if (!checkSameOrigin(request)) {
        throw new ApiError('forbidden', 'Запрос отклонён', 403);
      }
      if (invitationId) {
        const owned = await prisma.invitation.findFirst({
          where: { id: invitationId, userId: session.user.id },
          select: { id: true },
        });
        if (!owned) {
          throw new ApiError('forbidden', 'Нет доступа к этому приглашению', 403);
        }
        const { token, expiresAt } = createUploadToken({ type: 'invitation', invitationId });
        return NextResponse.json({ success: true, token, expiresAt, auth: 'session', scope: 'invitation' });
      }

      const { token, expiresAt } = createUploadToken({ type: 'draft' });
      return NextResponse.json({ success: true, token, expiresAt, auth: 'session', scope: 'draft' });
    }

    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Запрос отклонён', 403);
    }

    if (invitationId) {
      throw new ApiError('unauthorized', 'Требуется авторизация', 401);
    }

    const ip = getClientIp(request) || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    const fingerprint = createHmac('sha256', process.env.SESSION_SECRET || 'upload-fp')
      .update(`${ip}:${ua}`)
      .digest('hex')
      .slice(0, 16);

    const rate = await applyRateLimit(
      request,
      `upload:token:anon:${fingerprint}`,
      RATE_LIMITS.ANON_UPLOAD_TOKEN
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    const { token, expiresAt } = createUploadToken({ type: 'draft' });
    return NextResponse.json({ success: true, token, expiresAt, auth: 'anonymous', scope: 'draft' });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Upload token');
  }
}
