import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  checkSameOrigin,
  requireAdmin,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/shared/api';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';
import { parseCanvasOrEmpty } from '@/lib/canvas/validation';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

export const dynamic = 'force-dynamic';

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) {
      throw new ApiError('not_found', 'Шаблон не найден', 404);
    }

    let doc: InvitationCanvasDocument;
    if (template.canvas) {
      doc = parseCanvasOrEmpty(template.canvas);
    } else {
      doc = convertLegacyToCanvas({
        title: template.nameRu || 'Новое приглашение',
        eventType: template.category || 'wedding',
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
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  canvas: z.unknown().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    if (!checkSameOrigin(req)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }
    const { user } = await requireAdmin();
    const rate = await applyRateLimit(req, `admin_template:${user.id}`, RATE_LIMITS.API_ADMIN_MUTATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const existing = await prisma.template.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new ApiError('not_found', 'Шаблон не найден', 404);
    }

    const updated = await prisma.template.update({
      where: { id },
      data: parsed.data as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, template: updated });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Admin Template PATCH');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    if (!checkSameOrigin(req)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }
    const { user } = await requireAdmin();
    const rate = await applyRateLimit(req, `admin_template:${user.id}`, RATE_LIMITS.API_ADMIN_MUTATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const { id } = await params;

    const template = await prisma.template.findUnique({
      where: { id },
      select: {
        id: true,
        nameRu: true,
        _count: { select: { invitations: true, orders: true } },
      },
    });
    if (!template) {
      throw new ApiError('not_found', 'Шаблон не найден', 404);
    }

    // Order.templateId → Template is onDelete: Restrict at the DB level, so a
    // template with any historical order would otherwise fail with a raw
    // foreign-key error. Surface that as an actionable message and point at
    // the real way to retire a template: hide it, don't delete history.
    if (template._count.orders > 0 || template._count.invitations > 0) {
      throw new ApiError(
        'template_in_use',
        `Нельзя удалить «${template.nameRu}»: с ним связано приглашений — ${template._count.invitations}, заказов — ${template._count.orders}. Чтобы убрать шаблон из каталога, выключите «Активен».`,
        409
      );
    }

    await prisma.template.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Admin Template DELETE');
  }
}
