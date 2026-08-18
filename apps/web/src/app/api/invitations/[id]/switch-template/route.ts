/**
 * POST /api/invitations/[id]/switch-template
 *
 * 2026-08-18 (Phase 2, hub screen): changes an existing invitation's template
 * while preserving user-owned content (customText + couple-names + audio +
 * event meta). See lib/invitations/switch-template.ts for the full policy.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentSession } from '@/lib/shared/api';
import { ApiError } from '@/lib/shared/api';
import { switchInvitationTemplate } from '@/lib/invitations/switch-template';

const bodySchema = z.object({
  templateId: z.string().min(1),
  templateKey: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await switchInvitationTemplate({
      invitationId: id,
      userId: session.user.id,
      templateId: parsed.data.templateId,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }
    throw err;
  }
}