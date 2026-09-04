/**
 * POST /api/invitations/[id]/switch-template
 *
 * 2026-08-18 (Phase 2, hub screen): changes an existing invitation's template
 * while preserving user-owned content (customText + couple-names + audio +
 * event meta). See lib/invitations/switch-template.ts for the full policy.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  requireAuth,
  checkSameOrigin,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  ApiError,
  apiErrorResponse,
} from '@/lib/shared/api';
import { switchInvitationTemplate } from '@/lib/invitations/switch-template';

const bodySchema = z.object({
  templateId: z.string().min(1),
  templateKey: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const ctx = await requireAuth();
    const rate = await applyRateLimit(request, ctx.user.id, RATE_LIMITS.API_INVITATION_CREATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const { id } = await params;
    const raw = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const result = await switchInvitationTemplate({
      invitationId: id,
      userId: ctx.user.id,
      templateId: parsed.data.templateId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error as Error, 'Switch template');
  }
}