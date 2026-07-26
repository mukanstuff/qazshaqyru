import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/shared/db';
import {
  ApiError,
  apiErrorResponse,
  requireAuth,
  applyRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  checkSameOrigin,
} from '@/lib/shared/api';
import { buildBanquetExportCsv, type BanquetExportGuest } from '@/lib/guests/restaurant-export';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';

async function buildBanquetCsv(invitationId: string, userId: string) {
  const pricing = await getInvitationPricing(invitationId, userId);
  if (!pricing) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }
  if (!pricing.entitlements.csvExport) {
    throw new ApiError(
      'plan_required',
      'Список для тойханы доступен на тарифе Стандарт и выше',
      402
    );
  }

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId },
    select: { id: true, slug: true, title: true },
  });
  if (!invitation) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }

  const guests = await prisma.guest.findMany({
    where: { invitationId },
    include: {
      response: true,
      seating: { include: { table: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const rows: BanquetExportGuest[] = guests.map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    side: g.side,
    householdLabel: g.householdLabel,
    hasPlusOne: g.hasPlusOne,
    plusOneName: g.plusOneName,
    responseStatus: g.response?.status ?? 'pending',
    dietary: g.response?.dietaryRestrictions ?? null,
    tableName: g.seating?.table.name ?? null,
  }));

  const csv = buildBanquetExportCsv(invitation.title, rows);
  const filename = `banquet-${invitation.slug}.csv`;
  return { csv, filename };
}

/** POST — CSRF-safe banquet export for restaurant / тойхана. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkSameOrigin(request)) {
      throw new ApiError('forbidden', 'Неверный origin', 403);
    }

    const { id } = await params;
    const ctx = await requireAuth();

    const exportRate = await applyRateLimit(request, `export:${ctx.user.id}`, RATE_LIMITS.API_GUEST_EXPORT);
    if (!exportRate.allowed) return rateLimitResponse(exportRate);

    const { csv, filename } = await buildBanquetCsv(id, ctx.user.id);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return apiErrorResponse(error as Error, 'Export banquet guests');
  }
}

/** @deprecated Use POST — GET is vulnerable to CSRF via top-level navigation. */
export async function GET() {
  return NextResponse.json(
    { error: 'method_not_allowed', message: 'Используйте POST для экспорта гостей' },
    { status: 405 }
  );
}
