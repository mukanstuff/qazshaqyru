import { Search } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/shared/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import {
  AdminTableShell,
  adminTableHeadClass,
  adminTableThClass,
  adminTableTdClass,
  adminTableRowClass,
} from '@/components/admin/AdminTableShell';
import { cn } from '@/lib/shared/utils';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { status?: string; page?: string; q?: string };
}

const PAGE_SIZE = 20;

const FILTER_LABELS: Record<string, string> = {
  all: 'Все',
  pending: 'Ожидают',
  paid: 'Оплачены',
  cancelled: 'Отменены',
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page || '1', 10));
  const q = (searchParams.q || '').trim();
  const status = searchParams.status || 'all';

  const where: any = {};
  if (status !== 'all') where.status = status;
  if (q) {
    where.OR = [
      { id: { contains: q, mode: 'insensitive' } },
      { customerPhone: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
    ];
  }

type AdminOrderRow = {
  id: string;
  template: { nameRu: string; slug: string };
  customerName?: string | null;
  customerPhone?: string | null;
  amountKzt: number;
  status: string;
  createdAt: Date;
};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { phone: true } },
        template: { select: { nameRu: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }) as unknown as Promise<AdminOrderRow[]>,
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(nextPage?: number, nextStatus?: string) {
    const params = new URLSearchParams();
    const s = nextStatus ?? status;
    const p = nextPage ?? page;
    if (s !== 'all') params.set('status', s);
    if (q) params.set('q', q);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : '/admin/orders';
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-us-ink">Заказы</h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form action="/admin/orders" method="get" className="flex flex-1 gap-2 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-us-ink-muted" />
            <Input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Поиск..."
              className="pl-9"
            />
          </div>
          <input type="hidden" name="status" value={status} />
          <Button type="submit" size="sm">
            Найти
          </Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'paid', 'cancelled'] as const).map((s) => (
            <Button
              key={s}
              variant={status === s ? 'secondary' : 'outline'}
              size="sm"
              asChild
            >
              <Link href={buildHref(1, s)}>{FILTER_LABELS[s]}</Link>
            </Button>
          ))}
        </div>
      </div>

      <AdminTableShell>
        <thead className={adminTableHeadClass}>
          <tr>
            <th className={adminTableThClass}>ID</th>
            <th className={adminTableThClass}>Шаблон</th>
            <th className={adminTableThClass}>Клиент</th>
            <th className={adminTableThClass}>Сумма</th>
            <th className={adminTableThClass}>Статус</th>
            <th className={adminTableThClass}>Дата</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o: AdminOrderRow) => (
            <tr key={o.id} className={adminTableRowClass}>
              <td className={cn(adminTableTdClass, 'font-mono text-xs')}>
                {o.id.slice(0, 8)}
              </td>
              <td className={adminTableTdClass}>{o.template.nameRu}</td>
              <td className={adminTableTdClass}>
                {o.customerName && (
                  <div className="font-medium text-us-ink">{o.customerName}</div>
                )}
                <div className="text-us-ink-muted">{o.customerPhone}</div>
              </td>
              <td className={adminTableTdClass}>
                {o.amountKzt.toLocaleString('ru-RU')} ₸
              </td>
              <td className={adminTableTdClass}>
                <OrderStatusBadge status={o.status} />
              </td>
              <td className={cn(adminTableTdClass, 'text-us-ink-muted')}>
                {new Date(o.createdAt).toLocaleDateString('ru-RU')}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className={cn(adminTableTdClass, 'py-8 text-center text-us-ink-muted')}>
                Заказов не найдено
              </td>
            </tr>
          )}
        </tbody>
      </AdminTableShell>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" asChild disabled={page <= 1}>
            <Link href={buildHref(Math.max(1, page - 1))} aria-disabled={page <= 1}>
              ←
            </Link>
          </Button>
          <span className="text-sm text-us-ink-muted">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
            <Link href={buildHref(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages}>
              →
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
