'use client';

import { useCallback, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import type { PromoRow } from '@/app/admin/promo/page';
import { Button } from '@/components/ui/button';
import { formatKzt } from '@/lib/shared/format-price';
import {
  AdminTableShell,
  adminTableHeadClass,
  adminTableThClass,
  adminTableTdClass,
  adminTableRowClass,
} from '@/components/admin/AdminTableShell';

const SCOPE_LABEL: Record<string, string> = {
  template: 'Шаблон',
  agency: 'Agency',
  all: 'Везде',
};

/**
 * Create and switch off promo codes.
 *
 * Editing a code's kind or value is deliberately not offered: a customer quoted
 * "20% by this code" and paying an hour later would be charged whatever the
 * code says at that moment. Switch the old one off and make a new one.
 */
export function PromoAdminTable({ initialRows }: { initialRows: PromoRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [kind, setKind] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('10');
  const [scope, setScope] = useState<'template' | 'agency' | 'all'>('template');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');

  const create = useCallback(async () => {
    setBusy('create');
    setError(null);
    try {
      const res = await fetch('/api/admin/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          kind,
          value: Number(value),
          scope,
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
          // A date input gives a calendar day; the code stays usable through
          // the whole of it rather than expiring at midnight that morning.
          expiresAt: expiresAt ? new Date(expiresAt + 'T23:59:59').toISOString() : null,
          note: note || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        promoCode?: PromoRow;
        message?: string;
      };
      if (!res.ok || !data.promoCode) throw new Error(data.message || 'Не удалось создать код');
      const created = data.promoCode;
      setRows((prev) => [
        { ...created, stats: { paidOrders: 0, revenueKzt: 0, discountedKzt: 0 } },
        ...prev,
      ]);
      setCode('');
      setNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  }, [code, expiresAt, kind, maxRedemptions, note, scope, value]);

  const toggle = useCallback(async (row: PromoRow) => {
    setBusy(row.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/promo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, isActive: !row.isActive }),
      });
      if (!res.ok) throw new Error('Не удалось изменить код');
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive: !row.isActive } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(null);
    }
  }, []);

  const inputClass = 'min-h-10 rounded-xl border border-us-border px-3 font-body text-sm';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-us-border bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-us-ink-muted">Код</span>
            <input
              className={inputClass + ' uppercase'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="TOI10"
              maxLength={40}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-us-ink-muted">Тип скидки</span>
            <select
              className={inputClass}
              value={kind}
              onChange={(e) => setKind(e.target.value as 'percent' | 'fixed')}
            >
              <option value="percent">Процент</option>
              <option value="fixed">Фиксированная сумма</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-us-ink-muted">
              {kind === 'percent' ? 'Процент (1–100)' : 'Сумма, ₸'}
            </span>
            <input
              type="number"
              className={inputClass}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min={1}
              max={kind === 'percent' ? 100 : undefined}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-us-ink-muted">Где действует</span>
            <select
              className={inputClass}
              value={scope}
              onChange={(e) => setScope(e.target.value as 'template' | 'agency' | 'all')}
            >
              <option value="template">Шаблон</option>
              <option value="agency">Agency</option>
              <option value="all">Везде</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-us-ink-muted">Лимит использований</span>
            <input
              type="number"
              className={inputClass}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="без лимита"
              min={1}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-us-ink-muted">Действует до</span>
            <input
              type="date"
              className={inputClass}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs text-us-ink-muted">Заметка</span>
            <input
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="для @blogger, март"
              maxLength={200}
            />
          </label>
          <div className="flex items-end">
            <Button
              type="button"
              className="min-h-10 w-full"
              disabled={busy === 'create' || code.trim().length < 3}
              onClick={() => void create()}
            >
              {busy === 'create' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Создать
            </Button>
          </div>
        </div>
        {error ? <p className="mt-3 font-body text-sm text-us-danger">{error}</p> : null}
      </div>

      {rows.length === 0 ? (
        <p className="font-body text-sm text-us-ink-muted">Промокодов пока нет.</p>
      ) : (
        <AdminTableShell>
          <thead className={adminTableHeadClass}>
            <tr>
              <th className={adminTableThClass}>Код</th>
              <th className={adminTableThClass}>Скидка</th>
              <th className={adminTableThClass}>Где</th>
              <th className={adminTableThClass}>Выдано</th>
              <th className={adminTableThClass}>Оплачено</th>
              <th className={adminTableThClass}>До</th>
              <th className={adminTableThClass}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={adminTableRowClass}>
                <td className={adminTableTdClass}>
                  <span className="font-semibold tracking-wide">{r.code}</span>
                  {r.note ? <span className="block text-xs text-us-ink-muted">{r.note}</span> : null}
                </td>
                <td className={adminTableTdClass}>
                  {r.kind === 'percent' ? r.value + '%' : formatKzt(r.value) + ' ₸'}
                </td>
                <td className={adminTableTdClass}>{SCOPE_LABEL[r.scope] ?? r.scope}</td>
                {/* "Выдано" counts orders created with the code, paid or not —
                    that is what consumes the limit. */}
                <td className={adminTableTdClass}>
                  {r.redemptions}
                  {r.maxRedemptions === null ? '' : ' / ' + r.maxRedemptions}
                </td>
                <td className={adminTableTdClass}>
                  {r.stats.paidOrders === 0 ? (
                    '—'
                  ) : (
                    <>
                      {r.stats.paidOrders} · {formatKzt(r.stats.revenueKzt)} ₸
                      <span className="block text-xs text-us-ink-muted">
                        скидка {formatKzt(r.stats.discountedKzt)} ₸
                      </span>
                    </>
                  )}
                </td>
                <td className={adminTableTdClass}>
                  {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString('ru-RU') : '—'}
                </td>
                <td className={adminTableTdClass}>
                  <button
                    type="button"
                    className={
                      'rounded-full border px-3 py-1 text-xs font-semibold ' +
                      (r.isActive
                        ? 'border-us-accent/40 bg-us-accent/10 text-us-ink'
                        : 'border-us-border text-us-ink-muted')
                    }
                    disabled={busy === r.id}
                    onClick={() => void toggle(r)}
                  >
                    {r.isActive ? 'Активен' : 'Выключен'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTableShell>
      )}
    </div>
  );
}
