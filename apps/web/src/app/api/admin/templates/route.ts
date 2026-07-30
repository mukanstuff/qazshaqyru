import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import { ApiError, apiErrorResponse, getCurrentSession } from '@/lib/shared/api';
import { createEmptyDocument } from '@/lib/canvas/mutations';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  nameRu: z.string().min(1).max(120),
  nameKz: z.string().min(1).max(120).optional(),
  category: z.string().min(1).max(60).default('wedding'),
  // 2026-07-30 ADMIN ONLY default. Real prices come from Template DB.
  // Never hardcode in user-facing flows. See PRODUCT_MODEL_AND_RULES.md + PRODUCT_DECISIONS_2026-07-30.md
  // 2026-07-30 OWNER MODEL (PRODUCT_MODEL_AND_RULES.md): default 3990 is admin-only fallback.
  // Real price must be set on the Template record. Pay template.priceKzt once = fullAccess.
  priceKzt: z.number().int().min(0).default(3990),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.user.isAdmin) {
      throw new ApiError('forbidden', 'Требуются права администратора', 403);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400);
    }

    const slug = `custom-${nanoid(8).toLowerCase()}`;
    const emptyDoc = createEmptyDocument(390, { type: 'solid', color: '#fff8f1' });

    const table = await (prisma as unknown as {
      template: {
        create: (args: unknown) => Promise<unknown>;
      };
    }).template.create({
      data: {
        slug,
        nameRu: parsed.data.nameRu,
        nameKz: parsed.data.nameKz || parsed.data.nameRu,
        category: parsed.data.category,
        priceKzt: parsed.data.priceKzt,
        previewImageUrl: '/assets/placeholder.jpg',
        isPublic: true,
        isActive: true,
        isFeatured: false,
        sortOrder: 100,
        canvas: emptyDoc as unknown as object,
      },
    });

    return NextResponse.json({ success: true, template: table }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Create template');
  }
}
