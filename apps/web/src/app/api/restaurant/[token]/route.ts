import { NextRequest, NextResponse } from 'next/server';
import {
  ApiError,
  apiErrorResponse,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import { resolveRestaurantPortalByToken } from '@/lib/restaurant/share-service';

export const dynamic = 'force-dynamic';

/** Public read-only banquet portal (magic token). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const rate = await applyRateLimit(
      request,
      `rest-portal:${request.headers.get('x-forwarded-for') ?? 'ip'}`,
      RATE_LIMITS.PUBLIC_INVITATION
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    const decoded = decodeURIComponent(token);
    const payload = await resolveRestaurantPortalByToken(decoded);
    if (!payload) {
      throw new ApiError('not_found', 'Ссылка недействительна или истекла', 404);
    }

    return NextResponse.json({ success: true, portal: payload });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Restaurant portal');
  }
}
