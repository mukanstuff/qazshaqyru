import { ToggleTemplateButton } from '@/components/admin/toggle-template-button';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminTemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { invitations: true, orders: true } } },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-stone-800 mb-6">Шаблоны</h1>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="text-left px-4 py-3">Шаблон</th>
              <th className="text-left px-4 py-3">Категория</th>
              <th className="text-right px-4 py-3">Цена</th>
              <th className="text-right px-4 py-3">Использований</th>
              <th className="text-center px-4 py-3">Активен</th>
              <th className="text-center px-4 py-3">Хит</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {templates.map((t) => (
              <tr key={t.id} className="hover:bg-stone-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 rounded bg-stone-100 overflow-hidden flex-shrink-0">
                      <img src={t.previewImageUrl} alt={t.nameRu} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-medium text-stone-800">{t.nameRu}</div>
                      <div className="text-xs text-stone-500">{t.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-600">{t.category}</td>
                <td className="px-4 py-3 text-right font-medium">{t.priceKzt.toLocaleString('ru-RU')} ₸</td>
                <td className="px-4 py-3 text-right text-stone-600">
                  {t._count.invitations} / {t._count.orders}
                </td>
                <td className="px-4 py-3 text-center">
                  <ToggleTemplateButton id={t.id} initial={t.isActive} field="isActive" />
                </td>
                <td className="px-4 py-3 text-center">
                  <ToggleTemplateButton id={t.id} initial={t.isFeatured} field="isFeatured" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
