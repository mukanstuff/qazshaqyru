/**
 * REST API for persisting / retrieving the CanvasDocument for an invitation.
 *
 * GET /api/invitations/[id]/canvas -> returns current canvas document, with
 *   on-the-fly conversion from legacy templateData if the canvas column is null.
 *
 * PATCH /api/invitations/[id]/canvas -> replaces the canvas document after
 *   validating it with zod and checking owner/session permissions.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  apiErrorResponse,
  ApiError,
  getCurrentSession,
} from '@/lib/shared/api';
import prisma from '@/lib/shared/db';
import { canvasDocumentSchema } from '@/lib/canvas/schemas';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';
import { parseCanvasOrEmpty, validateCanvasDocument } from '@/lib/canvas/validation';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

export const dynamic = 'force-dynamic';

interface RouteCtx {
  params: Promise<{ id: string }>;
}

async function loadOwnedInvitation(id: string) {
  const session = await getCurrentSession();
  if (!session) throw new ApiError('unauthorized', 'Требуется авторизация', 401);
  const inv = await prisma.invitation.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      templateData: true,
      eventDate: true,
      eventTime: true,
      eventPlace: true,
      address: true,
      eventTimezone: true,
      musicUrl: true,
      mapUrl: true,
      customText: true,
      title: true,
      eventType: true,
      canvas: true,
      mobileCanvas: true,
    },
  });
  if (!inv) throw new ApiError('not_found', 'Приглашение не найдено', 404);
  if (inv.userId !== session.user.id && !session.user.isAdmin) {
    throw new ApiError('forbidden', 'Нет доступа', 403);
  }
  return { session, inv };
}
type LoadedInv = Awaited<ReturnType<typeof loadOwnedInvitation>>['inv'];

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params;
    const { inv } = await loadOwnedInvitation(id);
    let doc: InvitationCanvasDocument;
    if (inv.canvas) {
      doc = parseCanvasOrEmpty(inv.canvas);
    } else {
      doc = convertLegacyToCanvas({
        title: inv.title,
        eventType: inv.eventType,
        eventDate: inv.eventDate,
        eventTime: inv.eventTime,
        eventPlace: inv.eventPlace,
        address: inv.address,
        eventTimezone: inv.eventTimezone || 'Asia/Almaty',
        templateData: inv.templateData as Record<string, unknown> | null,
        musicUrl: inv.musicUrl,
        mapUrl: inv.mapUrl,
        customText: inv.customText as Record<string, unknown> | null,
      });
    }
    return NextResponse.json({ success: true, document: doc });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Canvas GET');
  }
}

const patchBodySchema = z.object({
  document: z.unknown(),
});

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params;
    await loadOwnedInvitation(id);
    const body = await req.json().catch(() => null);
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('invalid_body', 'Неверный формат документа', 400);
    }
    const validation = validateCanvasDocument(parsed.data.document);
    if (!validation.ok || !validation.document) {
      throw new ApiError('invalid_document', 'Документ не прошёл валидацию', 400);
    }

    const doc = validation.document;
    doc.editorMetadata = { ...(doc.editorMetadata || {}), lastModifiedAt: new Date().toISOString() };

    // Persist canvas document. The `canvas` column is added by migration
    // 20260727000000_canvas_document; `prisma migrate deploy` must be run before
    // editor saves take effect.
    await (prisma as unknown as { invitation: { update: (args: unknown) => Promise<unknown> } }).invitation.update({
      where: { id },
      data: { canvas: doc as unknown as object },
    });
    return NextResponse.json({ success: true, document: doc });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Canvas PATCH');
  }
}
