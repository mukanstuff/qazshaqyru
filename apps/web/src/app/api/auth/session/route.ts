import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentSession, clearSessionCookie, applyAuthReadRateLimit, rateLimitResponse } from '@/lib/shared/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const ctx = await getCurrentSession();
    if (!ctx) {
      const response = NextResponse.json({ user: null });
      clearSessionCookie(response);
      return response;
    }

    const readRate = await applyAuthReadRateLimit(request, ctx.user.id);
    if (!readRate.allowed) return rateLimitResponse(readRate);

    return NextResponse.json({
      user: {
        id: ctx.user.id,
        phone: ctx.user.phone,
        language: ctx.user.language,
        name: ctx.user.name,
        isAdmin: ctx.user.isAdmin,
      },
      session: {
        expiresAt: ctx.session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null });
  }
}
