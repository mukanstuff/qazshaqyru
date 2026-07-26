'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EditorPanelShell } from './EditorPanelShell';
import type { EditorGuestInfo } from './types';

type SeatingTable = {
  id: string;
  name: string;
  capacity: number;
  assignedCount: number;
  guestIds: string[];
};

interface Props {
  invitationId: string;
  guests: EditorGuestInfo[];
  onClose: () => void;
}

export function SeatingPanel({ invitationId, guests, onClose }: Props) {
  const { t } = useI18n();
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState('10');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/invitations/${invitationId}/seating`);
      const data = (await res.json()) as { tables?: SeatingTable[]; message?: string };
      if (!res.ok) throw new Error(data.message || 'Failed');
      setTables(data.tables ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [invitationId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const addTable = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/invitations/${invitationId}/seating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          capacity: Math.min(50, Math.max(1, parseInt(newCapacity, 10) || 10)),
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Failed');
      setNewName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  const removeTable = async (tableId: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/invitations/${invitationId}/seating`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  const assignGuest = async (guestId: string, tableId: string | null) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/invitations/${invitationId}/seating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, tableId }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  const exportBanquet = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/invitations/${invitationId}/guests/export`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `banquet-${invitationId.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  const tableByGuest = new Map<string, string>();
  for (const table of tables) {
    for (const guestId of table.guestIds) {
      tableByGuest.set(guestId, table.id);
    }
  }

  const serverGuests = guests.filter((g) => g.id);

  return (
    <EditorPanelShell title={t('invitation.edit.toolbarSeating')} onClose={onClose}>
      <p className="font-body text-sm text-us-ink-muted">{t('invitation.edit.seatingHint')}</p>

      {error ? <p className="font-body text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => void exportBanquet()} disabled={saving}>
          {t('invitation.edit.seatingExport')}
        </Button>
      </div>

      <div className="space-y-2 rounded-md border border-us-border p-3">
        <Label htmlFor="seat-name">{t('invitation.edit.seatingTableName')}</Label>
        <Input
          id="seat-name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Стол 1"
        />
        <Label htmlFor="seat-cap">{t('invitation.edit.seatingCapacity')}</Label>
        <Input
          id="seat-cap"
          type="number"
          min={1}
          max={50}
          value={newCapacity}
          onChange={(e) => setNewCapacity(e.target.value)}
        />
        <Button type="button" size="sm" onClick={() => void addTable()} disabled={saving || !newName.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t('invitation.edit.seatingAddTable')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-us-ink-muted" />
        </div>
      ) : tables.length === 0 ? (
        <p className="font-body text-sm text-us-ink-muted">{t('invitation.edit.seatingEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {tables.map((table) => (
            <li
              key={table.id}
              className="flex items-center justify-between gap-2 rounded-md border border-us-border px-3 py-2"
            >
              <div>
                <p className="font-body text-sm font-medium text-us-ink">{table.name}</p>
                <p className="font-body text-xs text-us-ink-muted">
                  {table.assignedCount}/{table.capacity}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void removeTable(table.id)}
                disabled={saving}
                aria-label="delete table"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {serverGuests.length > 0 && tables.length > 0 ? (
        <div className="space-y-2">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-us-ink-muted">
            {t('invitation.edit.seatingAssign')}
          </p>
          {serverGuests.map((guest) => (
            <div key={guest.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-body text-sm text-us-ink">{guest.name}</span>
              <select
                className="max-w-[140px] rounded-md border border-us-border bg-us-surface px-2 py-1 font-body text-xs"
                value={tableByGuest.get(guest.id!) ?? ''}
                disabled={saving}
                onChange={(e) =>
                  void assignGuest(guest.id!, e.target.value ? e.target.value : null)
                }
              >
                <option value="">{t('invitation.edit.seatingUnassigned')}</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ) : null}
    </EditorPanelShell>
  );
}
