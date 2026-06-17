import { Sparkles, Package, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/db';

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
    <div>
      <h1 className="font-serif text-3xl text-stone-800 mb-8">Обзор</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={DollarSign} label="Выручка" value={`${(totalRevenue._sum.amountKzt || 0).toLocaleString('ru-RU')} ₸`} accent="emerald" />
        <StatCard icon={Package} label="Оплачено" value={paidOrders} accent="emerald" />
        <StatCard icon={Sparkles} label="Ожидают" value={pendingOrders} accent="amber" />
        <StatCard icon={Users} label="Приглашений" value={totalInvitations} />
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-medium text-stone-800">Последние заказы</h2>
          <Link href="/admin/orders" className="text-sm text-stone-500 hover:text-stone-900">Все →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="text-left px-6 py-3">ID</th>
              <th className="text-left px-6 py-3">Шаблон</th>
              <th className="text-left px-6 py-3">Клиент</th>
              <th className="text-right px-6 py-3">Сумма</th>
              <th className="text-right px-6 py-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {recentOrders.map((o) => (
              <tr key={o.id} className="hover:bg-stone-50">
                <td className="px-6 py-3 font-mono text-xs text-stone-500">{o.id.slice(0, 8)}</td>
                <td className="px-6 py-3 text-stone-800">{o.template.nameRu}</td>
                <td className="px-6 py-3 text-stone-600">{o.customerPhone}</td>
                <td className="px-6 py-3 text-right font-medium">{o.amountKzt.toLocaleString('ru-RU')} ₸</td>
                <td className="px-6 py-3 text-right">
                  <StatusPill status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent = 'stone' }: { icon: any; label: string; value: any; accent?: 'stone' | 'emerald' | 'amber' }) {
  const colors = { stone: 'text-stone-700 bg-stone-100', emerald: 'text-emerald-700 bg-emerald-50', amber: 'text-amber-700 bg-amber-50' };
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[accent]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-medium text-stone-800">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    refunded: 'bg-stone-100 text-stone-600 border-stone-200',
  };
  const labels: Record<string, string> = {
    pending: 'Ожидает',
    paid: 'Оплачен',
    cancelled: 'Отменён',
    refunded: 'Возврат',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${styles[status] || 'bg-stone-100 text-stone-600'}`}>
      {labels[status] || status}
    </span>
  );
}
