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
import { buildBanquetExportXlsx, type BanquetLocale } from '@/lib/guests/restaurant-export-xlsx';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';

/**
 * Formats the banquet list is offered in.
 *
 * CSV stays because it imports anywhere; xlsx exists because Excel on a
 * Russian or Kazakh Windows splits on ";" and turns a comma-delimited file
 * into one unreadable column.
 */
type ExportFormat = 'csv' | 'xlsx';

async function buildBanquetExport(
  invitationId: string,
  userId: string,
  format: ExportFormat,
  locale: BanquetLocale
) {
  const pricing = await getInvitationPricing(invitationId, userId);
  if (!pricing) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }
  if (!pricing.fullAccess && !pricing.entitlements.csvExport) {
    throw new ApiError(
      'plan_required',
      'Экспорт гостей доступен после оплаты цены шаблона',
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

  type GuestExportRow = {
    id: string;
    name: string;
    phone: string;
    side: string | null;
    householdLabel: string | null;
    hasPlusOne: boolean;
    plusOneName: string | null;
    response?: { status: string; dietaryRestrictions?: string | null } | null;
    seating?: { table: { name: string } } | null;
  };

  const rows: BanquetExportGuest[] = guests.map((g: GuestExportRow) => ({
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

  if (format === 'xlsx') {
    return {
      body: await buildBanquetExportXlsx(invitation.title, rows, locale),
      filename: `banquet-${invitation.slug}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  return {
    body: buildBanquetExportCsv(invitation.title, rows),
    filename: `banquet-${invitation.slug}.csv`,
    contentType: 'text/csv; charset=utf-8',
  };
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

    // Anything other than an explicit "xlsx" stays CSV, so existing callers
    // that post an empty body keep working.
    const payload = (await request.json().catch(() => null)) as {
      format?: string;
      locale?: string;
    } | null;
    const format: ExportFormat = payload?.format === 'xlsx' ? 'xlsx' : 'csv';
    const locale: BanquetLocale = payload?.locale === 'kz' ? 'kz' : 'ru';

    const { body, filename, contentType } = await buildBanquetExport(
      id,
      ctx.user.id,
      format,
      locale
    );

    // Wrapped in a Blob because the response body is a string for CSV and
    // binary for xlsx, and that union does not satisfy BodyInit directly.
    return new NextResponse(new Blob([body], { type: contentType }), {
      headers: {
        'Content-Type': contentType,
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
