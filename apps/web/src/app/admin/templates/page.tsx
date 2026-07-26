import { ToggleTemplateButton } from '@/components/admin/ToggleTemplateButton';
import {
  AdminTableShell,
  adminTableHeadClass,
  adminTableThClass,
  adminTableTdClass,
  adminTableRowClass,
} from '@/components/admin/AdminTableShell';
import Image from 'next/image';
import prisma from '@/lib/shared/db';
import { cn } from '@/lib/shared/utils';

export const dynamic = 'force-dynamic';

export default async function AdminTemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { invitations: true, orders: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-us-ink">Шаблоны</h1>

      <AdminTableShell>
        <thead className={adminTableHeadClass}>
          <tr>
            <th className={adminTableThClass}>Шаблон</th>
            <th className={adminTableThClass}>Категория</th>
            <th className={adminTableThClass}>Цена</th>
            <th className={adminTableThClass}>Использований</th>
            <th className={adminTableThClass}>Активен</th>
            <th className={adminTableThClass}>Хит</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className={adminTableRowClass}>
              <td className={adminTableTdClass}>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md border border-us-border bg-us-accent/5">
                    <Image
                      src={t.previewImageUrl}
                      alt={t.nameRu}
                      width={40}
                      height={48}
                      className="h-full w-full object-cover"
                      unoptimized={t.previewImageUrl.startsWith('/uploads/')}
                    />
                  </div>
                  <div>
                    <div className="font-medium text-us-ink">{t.nameRu}</div>
                    <div className="text-xs text-us-ink-muted">{t.slug}</div>
                  </div>
                </div>
              </td>
              <td className={cn(adminTableTdClass, 'capitalize')}>{t.category}</td>
              <td className={adminTableTdClass}>
                {t.priceKzt.toLocaleString('ru-RU')} ₸
              </td>
              <td className={cn(adminTableTdClass, 'text-us-ink-muted')}>
                {t._count.invitations} / {t._count.orders}
              </td>
              <td className={adminTableTdClass}>
                <ToggleTemplateButton id={t.id} initial={t.isActive} field="isActive" />
              </td>
              <td className={adminTableTdClass}>
                <ToggleTemplateButton id={t.id} initial={t.isFeatured} field="isFeatured" />
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTableShell>
    </div>
  );
}
