import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import { ApiError, apiErrorResponse, getCurrentSession } from '@/lib/shared/api';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: RouteCtx) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user.isAdmin) {
      throw new ApiError('forbidden', 'Требуются права администратора', 403);
    }
    const { id } = await params;

    const source = await (prisma as unknown as {
      template: {
        findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
      };
    }).template.findUnique({
      where: { id },
    });
    if (!source) {
      throw new ApiError('not_found', 'Шаблон не найден', 404);
    }

    const newSlug = `${String(source.slug)}-copy-${nanoid(5).toLowerCase()}`;

    const cloned = await (prisma as unknown as {
      template: {
        create: (args: unknown) => Promise<unknown>;
      };
    }).template.create({
      data: {
        slug: newSlug,
        nameRu: `${String(source.nameRu)} (копия)`,
        nameKz: `${String(source.nameKz || source.nameRu)} (көшірмесі)`,
        category: source.category,
        priceKzt: source.priceKzt,
        previewImageUrl: source.previewImageUrl || '/assets/placeholder.jpg',
        isPublic: false, // hide clone by default so admin can review
        isActive: true,
        isFeatured: false,
        sortOrder: (typeof source.sortOrder === 'number' ? source.sortOrder : 100) + 1,
        canvas: source.canvas ?? null,
        mobileCanvas: source.mobileCanvas ?? null,
      },
    });

    return NextResponse.json({ success: true, template: cloned }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Clone template');
  }
}
