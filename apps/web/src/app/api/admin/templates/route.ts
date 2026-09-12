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
import { createEmptyDocument } from '@/lib/canvas/mutations';
import { nanoid } from 'nanoid';
import { PLACEHOLDER_PREVIEW } from '@/lib/templates/placeholder-preview';

export const dynamic = 'force-dynamic';

// Mirrors the `TemplateCategory` enum in prisma/schema.prisma. Not imported
// by name from @prisma/client because that named export doesn't resolve
// cleanly through this workspace's module graph (bundler moduleResolution +
// pnpm's nested .prisma/client) — but the Prisma create() call below still
// type-checks structurally against the real enum, so this list is the only
// thing that has to stay in sync with the schema.
const TEMPLATE_CATEGORIES = [
  'wedding',
  'toy',
  'betashar',
  'kyz_uzatu',
  'sundet_toy',
  'tusau_keser',
  'birthday',
  'anniversary',
  'corporate',
  'other',
] as const;

const createSchema = z.object({
  nameRu: z.string().min(1).max(120),
  nameKz: z.string().min(1).max(120).optional(),
  category: z.enum(TEMPLATE_CATEGORIES).default('wedding'),
  // 2026-07-30 ADMIN ONLY default. Real prices come from Template DB.
  // Never hardcode in user-facing flows. See PRODUCT_MODEL_AND_RULES.md + PRODUCT_DECISIONS_2026-07-30.md
  priceKzt: z.number().int().min(0).default(3990),
});

export async function POST(req: NextRequest) {
  try {
    if (!checkSameOrigin(req)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }
    const { user } = await requireAdmin();
    const rate = await applyRateLimit(req, `admin_template:${user.id}`, RATE_LIMITS.API_ADMIN_MUTATE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('validation_error', 'Ошибка валидации', 400, parsed.error.flatten());
    }

    const slug = `custom-${nanoid(8).toLowerCase()}`;
    const emptyDoc = createEmptyDocument(390, { type: 'solid', color: '#fff8f1' });

    const template = await prisma.template.create({
      data: {
        slug,
        nameRu: parsed.data.nameRu,
        nameKz: parsed.data.nameKz || parsed.data.nameRu,
        category: parsed.data.category,
        priceKzt: parsed.data.priceKzt,
        previewImageUrl: PLACEHOLDER_PREVIEW,
        isActive: true,
        isFeatured: false,
        sortOrder: 100,
        canvas: emptyDoc as unknown as object,
      },
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Create template');
  }
}
