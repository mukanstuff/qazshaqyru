import prisma from '@/lib/shared/db';
import { PromoAdminTable } from '@/components/admin/PromoAdminTable';

export const dynamic = 'force-dynamic';

export type PromoRow = {
  id: string;
  code: string;
  kind: string;
  value: number;
  scope: string;
  maxRedemptions: number | null;
  redemptions: number;
  expiresAt: string | null;
  isActive: boolean;
  note: string | null;
  createdAt: string;
  stats: { paidOrders: number; revenueKzt: number; discountedKzt: number };
};

/**
 * Promo codes.
 *
 * Read on the server so the first paint has the real list, then handed to a
 * client table that does creation and toggling through /api/admin/promo.
 */
export default async function AdminPromoPage() {
  const [codes, earned] = await Promise.all([
    prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.order.groupBy({
      by: ['promoCodeId'],
      where: { status: 'paid', promoCodeId: { not: null } },
      _sum: { amountKzt: true, discountKzt: true },
      _count: { _all: true },
    }),
  ]);

  type EarnedRow = {
    promoCodeId: string | null;
    _sum: { amountKzt: number | null; discountKzt: number | null };
    _count: { _all: number };
  };
  const byId = new Map(
    (earned as EarnedRow[]).map((row) => [
      row.promoCodeId,
      {
        paidOrders: row._count._all,
        revenueKzt: row._sum.amountKzt ?? 0,
        discountedKzt: row._sum.discountKzt ?? 0,
      },
    ])
  );

  type CodeRow = {
    id: string;
    code: string;
    kind: string;
    value: number;
    scope: string;
    maxRedemptions: number | null;
    redemptions: number;
    expiresAt: Date | null;
    isActive: boolean;
    note: string | null;
    createdAt: Date;
  };

  const rows: PromoRow[] = (codes as CodeRow[]).map((c) => ({
    id: c.id,
    code: c.code,
    kind: c.kind,
    value: c.value,
    scope: c.scope,
    maxRedemptions: c.maxRedemptions,
    redemptions: c.redemptions,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    isActive: c.isActive,
    note: c.note,
    createdAt: c.createdAt.toISOString(),
    stats: byId.get(c.id) ?? { paidOrders: 0, revenueKzt: 0, discountedKzt: 0 },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-us-ink">Промокоды</h1>
        <p className="mt-1 font-body text-sm text-us-ink-muted">
          Скидка применяется к сумме одного платежа. Цена шаблона и то, что уже оплачено, не
          меняются.
        </p>
      </div>
      <PromoAdminTable initialRows={rows} />
    </div>
  );
}
