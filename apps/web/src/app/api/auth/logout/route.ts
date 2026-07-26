import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, getCurrentSession, clearSessionCookie, apiErrorResponse, checkSameOrigin, ApiError } from '@/lib/shared/api';

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await getCurrentSession();
    if (ctx) {
      await import('@/lib/shared/db').then(({ default: prisma }) =>
        prisma.session.update({
          where: { id: ctx.session.id },
          data: { revokedAt: new Date() },
        })
      );
    }

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return apiErrorResponse(error as Error, 'Logout');
  }
}
