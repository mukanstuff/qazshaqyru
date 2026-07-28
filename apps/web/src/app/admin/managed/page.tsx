import prisma from '@/lib/shared/db';
import { ManagedOrderStatusForm } from '@/components/admin/ManagedOrderStatusForm';
import {
  AdminTableShell,
  adminTableHeadClass,
  adminTableThClass,
  adminTableTdClass,
  adminTableRowClass,
} from '@/components/admin/AdminTableShell';
import { cn } from '@/lib/shared/utils';

export const dynamic = 'force-dynamic';

export default async function AdminManagedOrdersPage() {
type ManagedOrderRow = {
  id: string;
  customerName?: string | null;
  customerPhone: string;
  template: { nameRu: string; slug: string };
  comment?: string | null;
  notes?: string | null;
  managedStatus?: string | null;
  adminNotes?: string | null;
  status: string;
  createdAt: Date;
};

  const orders = (await prisma.order.findMany({
    where: { orderType: 'managed' },
    include: { template: { select: { nameRu: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })) as unknown as ManagedOrderRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-us-ink">
          Заявки «Сделаем за вас»
        </h1>
        <p className="mt-2 text-sm text-us-ink-muted">
          Управление статусом заявок без входа клиента в систему.
        </p>
      </div>

      <AdminTableShell>
        <thead className={adminTableHeadClass}>
          <tr>
            <th className={adminTableThClass}>Клиент</th>
            <th className={adminTableThClass}>Шаблон</th>
            <th className={adminTableThClass}>Комментарий</th>
            <th className={adminTableThClass}>Статус</th>
            <th className={adminTableThClass}>Дата</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o: ManagedOrderRow) => (
            <tr key={o.id} className={adminTableRowClass}>
              <td className={adminTableTdClass}>
                <div className="font-medium text-us-ink">{o.customerName || '—'}</div>
                <div className="text-sm text-us-ink-muted">{o.customerPhone}</div>
              </td>
              <td className={adminTableTdClass}>{o.template.nameRu}</td>
              <td className={cn(adminTableTdClass, 'max-w-xs text-us-ink-muted')}>
                {o.notes || '—'}
              </td>
              <td className={adminTableTdClass}>
                <ManagedOrderStatusForm
                  orderId={o.id}
                  initialStatus={o.managedStatus ?? 'pending'}
                  initialNotes={o.adminNotes ?? null}
                />
              </td>
              <td className={cn(adminTableTdClass, 'whitespace-nowrap text-us-ink-muted')}>
                {new Date(o.createdAt).toLocaleDateString('ru-RU')}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className={cn(adminTableTdClass, 'py-8 text-center text-us-ink-muted')}>
                Заявок пока нет
              </td>
            </tr>
          )}
        </tbody>
      </AdminTableShell>
    </div>
  );
}
