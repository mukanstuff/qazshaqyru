'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/utils';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Новая' },
  { value: 'contacted', label: 'Связались' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'ready', label: 'Готово' },
  { value: 'delivered', label: 'Доставлено' },
  { value: 'cancelled', label: 'Отменено' },
] as const;

const selectClassName = cn(
  'flex h-8 w-full min-w-[120px] rounded-md border border-us-border bg-us-surface px-2 py-1 font-body text-xs text-us-ink shadow-us-sm transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-us-accent focus-visible:ring-offset-1 focus-visible:ring-offset-us-ivory'
);

const textareaClassName = cn(
  'mt-2 w-full min-w-[160px] resize-y rounded-md border border-us-border bg-us-surface px-2 py-1.5 font-body text-xs text-us-ink shadow-us-sm transition-colors',
  'placeholder:text-us-ink-muted',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-us-accent focus-visible:ring-offset-1 focus-visible:ring-offset-us-ivory'
);

interface Props {
  orderId: string;
  initialStatus: string;
  initialNotes: string | null;
}

export function ManagedOrderStatusForm({ orderId, initialStatus, initialNotes }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managedStatus: status, adminNotes: notes }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Сохранено');
      } else {
        setMessage(data.message || 'Ошибка сохранения');
      }
    } catch {
      setMessage('Ошибка сети');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-[160px] space-y-1">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className={selectClassName}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Заметки админа"
        rows={2}
        className={textareaClassName}
      />
      <Button
        type="button"
        size="sm"
        onClick={() => void handleSave()}
        disabled={saving}
        className="w-full"
      >
        {saving ? '…' : 'Сохранить'}
      </Button>
      {message && (
        <span
          className={cn(
            'block text-xs',
            message === 'Сохранено' ? 'text-us-success' : 'text-us-danger'
          )}
        >
          {message}
        </span>
      )}
    </div>
  );
}
