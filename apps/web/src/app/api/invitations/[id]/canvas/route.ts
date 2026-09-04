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
  checkSameOrigin,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import prisma from '@/lib/shared/db';
import { canvasDocumentSchema } from '@/lib/canvas/schemas';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';
import { parseCanvasOrEmpty, validateCanvasDocument } from '@/lib/canvas/validation';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';
import { ensureCanvasDocument } from '@/lib/invitations/ensure-canvas';
import { deriveInvitationFieldsFromCanvas } from '@/lib/canvas/derive-invitation-fields';
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
      updatedAt: true,
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

    // 2026-07-30 PRODUCT RULE: Canvas is the primary document for all new flows.
    // Ensure on read for owner paths too (defensive + early write).
    if (!inv.canvas) {
      await ensureCanvasDocument(prisma as any, id);
      // re-fetch
      const refreshed = await prisma.invitation.findUnique({
        where: { id },
        select: { canvas: true, updatedAt: true },
      });
      if (refreshed?.canvas) {
        (inv as any).canvas = refreshed.canvas;
        (inv as any).updatedAt = refreshed.updatedAt;
      }
    }

    let doc: InvitationCanvasDocument;
    if (inv.canvas) {
      doc = parseCanvasOrEmpty(inv.canvas);
    } else {
      // last resort legacy bridge (should rarely hit now)
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
    return NextResponse.json({ success: true, document: doc, updatedAt: inv.updatedAt.toISOString() });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Canvas GET');
  }
}

const patchBodySchema = z.object({
  document: z.unknown(),
  // ISO timestamp of the invitation's `updatedAt` the client last saw (from
  // GET or a prior PATCH response). Used for optimistic concurrency: two
  // tabs/devices editing the same invitation must not silently clobber each
  // other's saves. Optional for back-compat with any caller that hasn't been
  // updated to send it, in which case we fall back to unconditional write.
  baseVersion: z.string().datetime().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    if (!checkSameOrigin(req)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }
    const { id } = await params;
    const { session } = await loadOwnedInvitation(id);
    const rate = await applyRateLimit(req, `canvas_save:${session.user.id}`, RATE_LIMITS.API_CANVAS_SAVE);
    if (!rate.allowed) return rateLimitResponse(rate);
    // Edit is free per product model: pay at publication only.
    // (pricing kept for future, but no gate on PATCH for free users)
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

    // Project canvas onto the flat columns the OG image, .ics export, browser
    // tab title, reminders and dashboard read without parsing canvas — keeps
    // them from drifting behind whatever the editor/wizard/hub last wrote.
    const derived = deriveInvitationFieldsFromCanvas(doc);
    const derivedData: Record<string, unknown> = {};
    if (derived.title !== undefined) derivedData.title = derived.title;
    if (derived.eventDate !== undefined) derivedData.eventDate = derived.eventDate;
    if (derived.eventTime !== undefined) derivedData.eventTime = derived.eventTime;
    if (derived.eventPlace !== undefined) derivedData.eventPlace = derived.eventPlace;
    if (derived.address !== undefined) derivedData.address = derived.address;

    type PrismaTx = any;
    const { baseVersion } = parsed.data;
    const newUpdatedAt = await prisma.$transaction(async (tx: PrismaTx) => {
      if (baseVersion) {
        const result = await tx.invitation.updateMany({
          where: { id, updatedAt: new Date(baseVersion) },
          data: { canvas: doc as unknown as object, ...derivedData },
        });
        if (result.count === 0) return null;
      } else {
        await tx.invitation.update({
          where: { id },
          data: { canvas: doc as unknown as object, ...derivedData },
        });
      }
      const row = await tx.invitation.findUnique({ where: { id }, select: { updatedAt: true } });
      return row?.updatedAt ?? null;
    });

    if (!newUpdatedAt) {
      // Someone else (another tab, another device) saved this invitation
      // since the client last loaded it. Don't silently overwrite their
      // edit — tell the client to reconcile instead.
      throw new ApiError(
        'canvas_conflict',
        'Приглашение было изменено в другом окне. Обновите страницу, чтобы продолжить.',
        409
      );
    }

    return NextResponse.json({ success: true, document: doc, updatedAt: newUpdatedAt.toISOString() });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Canvas PATCH');
  }
}
