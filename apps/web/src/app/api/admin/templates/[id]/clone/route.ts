import { NextRequest, NextResponse } from 'next/server';
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
import { nanoid } from 'nanoid';
import { PLACEHOLDER_PREVIEW } from '@/lib/templates/placeholder-preview';

export const dynamic = 'force-dynamic';

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    if (!checkSameOrigin(req)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }
    const { user } = await requireAdmin();
    const rate = await applyRateLimit(req, `admin_template:${user.id}`, RATE_LIMITS.API_ADMIN_MUTATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const { id } = await params;

    const source = await prisma.template.findUnique({ where: { id } });
    if (!source) {
      throw new ApiError('not_found', 'Шаблон не найден', 404);
    }

    const newSlug = `${source.slug}-copy-${nanoid(5).toLowerCase()}`;

    const cloned = await prisma.template.create({
      data: {
        slug: newSlug,
        nameRu: `${source.nameRu} (копия)`,
        nameKz: `${source.nameKz || source.nameRu} (көшірмесі)`,
        category: source.category,
        priceKzt: source.priceKzt,
        previewImageUrl: source.previewImageUrl || PLACEHOLDER_PREVIEW,
        // Cloned inactive so an admin can review/edit before it reaches the catalog.
        isActive: false,
        isFeatured: false,
        sortOrder: source.sortOrder + 1,
        canvas: source.canvas ?? undefined,
      },
    });

    return NextResponse.json({ success: true, template: cloned }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Clone template');
  }
}
