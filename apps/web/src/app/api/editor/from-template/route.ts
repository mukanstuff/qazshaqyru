/**
 * POST /api/editor/from-template
 *
 * Always creates a brand-new draft invitation for the given templateKey.
 * Thin wrapper around createDraftForTemplate — see lib/editor/from-template.ts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createDraftForTemplate } from '@/lib/editor/from-template';
import {
  ApiError,
  apiErrorResponse,
  checkSameOrigin,
  getCurrentSession,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';

export async function POST(request: NextRequest) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    // Rate-limit by session where possible; this route creates a DB row per
    // call, same cost as POST /api/invitations, so it shares that budget
    // instead of being free to hammer.
    const session = await getCurrentSession();
    const rate = await applyRateLimit(
      request,
      session ? `from_template:${session.user.id}` : `from_template:anon`,
      RATE_LIMITS.API_INVITATION_CREATE
    );
    if (!rate.allowed) return rateLimitResponse(rate);

    const { templateKey } = (await request.json().catch(() => ({}))) as { templateKey?: string };
    if (!templateKey) {
      throw new ApiError('templateKey_required', 'templateKey обязателен', 400);
    }

    const result = await createDraftForTemplate(templateKey);
    if ('error' in result) {
      throw new ApiError(
        result.error,
        result.error === 'unauthorized' ? 'Требуется авторизация' : 'Шаблон не найден',
        result.error === 'unauthorized' ? 401 : 404
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    return apiErrorResponse(err as Error, 'Create draft from template');
  }
}
