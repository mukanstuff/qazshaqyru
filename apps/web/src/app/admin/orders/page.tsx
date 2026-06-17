import { Search } from 'lucide-react';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { status?: string; page?: string; q?: string };
}

const PAGE_SIZE = 20;

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
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-serif text-3xl text-stone-800 mb-6">Заказы</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Поиск по ID, телефону или имени..."
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:border-stone-400"
            />
          </div>
          <input type="hidden" name="status" value={status} />
          <button className="h-11 px-5 rounded-xl bg-stone-900 text-white text-sm font-medium">Найти</button>
        </form>
        <div className="flex gap-2">
          {['all', 'pending', 'paid', 'cancelled'].map((s) => (
            <a
              key={s}
              href={`/admin/orders?status=${s}${q ? `&q=${q}` : ''}`}
              className={`h-11 px-4 inline-flex items-center rounded-xl text-sm font-medium ${
                status === s ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {s === 'all' ? 'Все' : s === 'pending' ? 'Ожидают' : s === 'paid' ? 'Оплачены' : 'Отменены'}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Шаблон</th>
              <th className="text-left px-4 py-3">Клиент</th>
              <th className="text-right px-4 py-3">Сумма</th>
              <th className="text-center px-4 py-3">Статус</th>
              <th className="text-right px-4 py-3">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 font-mono text-xs text-stone-500">{o.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-stone-800">{o.template.nameRu}</td>
                <td className="px-4 py-3 text-stone-600 text-xs">
                  {o.customerName && <div className="text-stone-800">{o.customerName}</div>}
                  {o.customerPhone}
                </td>
                <td className="px-4 py-3 text-right font-medium">{o.amountKzt.toLocaleString('ru-RU')} ₸</td>
                <td className="px-4 py-3 text-center">
                  <StatusPill status={o.status} />
                </td>
                <td className="px-4 py-3 text-right text-xs text-stone-500">
                  {new Date(o.createdAt).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-stone-400">
                  Заказов не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <a href={`/admin/orders?page=${Math.max(1, page - 1)}${q ? `&q=${q}` : ''}&status=${status}`} className="h-10 px-4 rounded-lg border border-stone-200 hover:bg-white">
            ←
          </a>
          <span className="text-sm text-stone-500">{page} / {totalPages}</span>
          <a href={`/admin/orders?page=${Math.min(totalPages, page + 1)}${q ? `&q=${q}` : ''}&status=${status}`} className="h-10 px-4 rounded-lg border border-stone-200 hover:bg-white">
            →
          </a>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    paid: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-rose-50 text-rose-700',
    refunded: 'bg-stone-100 text-stone-600',
  };
  const labels: Record<string, string> = {
    pending: 'Ожидает',
    paid: 'Оплачен',
    cancelled: 'Отменён',
    refunded: 'Возврат',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs ${styles[status] || 'bg-stone-100 text-stone-600'}`}>
      {labels[status] || status}
    </span>
  );
}
