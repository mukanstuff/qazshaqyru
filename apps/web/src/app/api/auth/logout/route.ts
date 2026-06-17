import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, getCurrentSession, clearSessionCookie } from '@/lib/api';
import { apiErrorResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const ctx = await getCurrentSession();
    if (ctx) {
      await import('@/lib/db').then(({ default: prisma }) =>
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
