import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import { ApiError, apiErrorResponse, applyRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/shared/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';

    // Rate limit public template listing to prevent scraping
    const rate = await applyRateLimit(request, 'public_templates', RATE_LIMITS.API_TEMPLATES);
    if (!rate.allowed) return rateLimitResponse(rate);

    const VALID_CATEGORIES = ['wedding', 'toy', 'betashar', 'kyz_uzatu', 'sundet_toy', 'tusau_keser', 'birthday', 'anniversary', 'corporate', 'other'] as const;
    type TemplateCategoryT = (typeof VALID_CATEGORIES)[number];

    // Show all published & active templates in the catalog.
    const where: {
      isActive: boolean;
      category?: TemplateCategoryT;
      isFeatured?: boolean;
    } = {
      isActive: true,
    };
    if (category && (VALID_CATEGORIES as readonly string[]).includes(category)) {
      where.category = category as TemplateCategoryT;
    }
    if (featured) where.isFeatured = true;

    const templates = await prisma.template.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        nameRu: true,
        nameKz: true,
        descriptionRu: true,
        descriptionKz: true,
        category: true,
        previewImageUrl: true,
        priceKzt: true,
        isFeatured: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Get templates');
  }
}
