import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import { ApiError, apiErrorResponse, getCurrentSession } from '@/lib/shared/api';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';
import { parseCanvasOrEmpty } from '@/lib/canvas/validation';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

export const dynamic = 'force-dynamic';

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user.isAdmin) {
      throw new ApiError('forbidden', 'Требуются права администратора', 403);
    }
    const { id } = await params;
    const template = await (prisma as unknown as {
      template: {
        findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
      };
    }).template.findUnique({
      where: { id },
    });
    if (!template) {
      throw new ApiError('not_found', 'Шаблон не найден', 404);
    }

    let doc: InvitationCanvasDocument;
    if (template.canvas) {
      doc = parseCanvasOrEmpty(template.canvas);
    } else {
      doc = convertLegacyToCanvas({
        title: (template.nameRu as string) || 'Новое приглашение',
        eventType: (template.category as string) || 'wedding',
      });
    }

    return NextResponse.json({ success: true, template, document: doc });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Admin Template GET');
  }
}

const patchSchema = z.object({
  nameRu: z.string().min(1).max(120).optional(),
  nameKz: z.string().min(1).max(120).optional(),
  category: z.string().min(1).max(60).optional(),
  priceKzt: z.number().int().min(0).optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  canvas: z.unknown().optional(),
  mobileCanvas: z.unknown().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user.isAdmin) {
      throw new ApiError('forbidden', 'Требуются права администратора', 403);
    }
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400);
    }

    const updated = await (prisma as unknown as {
      template: {
        update: (args: unknown) => Promise<unknown>;
      };
    }).template.update({
      where: { id },
      data: parsed.data as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, template: updated });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Admin Template PATCH');
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user.isAdmin) {
      throw new ApiError('forbidden', 'Требуются права администратора', 403);
    }
    const { id } = await params;
    await (prisma as unknown as {
      template: {
        delete: (args: unknown) => Promise<unknown>;
      };
    }).template.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Admin Template DELETE');
  }
}
