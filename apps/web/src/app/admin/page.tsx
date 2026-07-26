import { Sparkles, Package, Users, DollarSign, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/shared/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import {
  AdminTableShell,
  adminTableHeadClass,
  adminTableThClass,
  adminTableTdClass,
  adminTableRowClass,
} from '@/components/admin/AdminTableShell';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const [totalRevenue, paidOrders, pendingOrders, totalInvitations, recentOrders] = await Promise.all([
    prisma.order.aggregate({ where: { status: 'paid' }, _sum: { amountKzt: true } }),
    prisma.order.count({ where: { status: 'paid' } }),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.invitation.count(),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { phone: true } }, template: { select: { nameRu: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold text-us-ink">Обзор</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Выручка" value={`${(totalRevenue._sum.amountKzt || 0).toLocaleString('ru-RU')} ₸`} accent="gold" />
        <StatCard icon={Package} label="Оплачено" value={paidOrders} accent="gold" />
        <StatCard icon={Sparkles} label="Ожидают" value={pendingOrders} accent="amber" />
        <StatCard icon={Users} label="Приглашений" value={totalInvitations} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-us-ink">Последние заказы</h2>
          <Button variant="link" className="h-auto p-0" asChild>
            <Link href="/admin/orders">Все →</Link>
          </Button>
        </div>
        <AdminTableShell>
          <thead className={adminTableHeadClass}>
            <tr>
              <th className={adminTableThClass}>ID</th>
              <th className={adminTableThClass}>Шаблон</th>
              <th className={adminTableThClass}>Клиент</th>
              <th className={adminTableThClass}>Сумма</th>
              <th className={adminTableThClass}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id} className={adminTableRowClass}>
                <td className={`${adminTableTdClass} font-mono text-xs`}>{o.id.slice(0, 8)}</td>
                <td className={adminTableTdClass}>{o.template.nameRu}</td>
                <td className={adminTableTdClass}>{o.customerPhone}</td>
                <td className={adminTableTdClass}>{o.amountKzt.toLocaleString('ru-RU')} ₸</td>
                <td className={adminTableTdClass}>
                  <OrderStatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTableShell>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'stone',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: 'stone' | 'gold' | 'amber';
}) {
  const accentStyles = {
    stone: 'bg-us-accent/8 text-us-accent',
    gold: 'bg-us-cta/15 text-us-accent-strong',
    amber: 'bg-us-cta/20 text-amber-700',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className={`mb-3 inline-flex rounded-md p-2 ${accentStyles[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="font-body text-sm text-us-ink-muted">{label}</p>
        <p className="mt-1 font-display text-2xl font-semibold text-us-ink">{value}</p>
      </CardContent>
    </Card>
  );
}
