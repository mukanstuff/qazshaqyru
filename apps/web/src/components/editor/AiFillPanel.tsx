'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EditorPanelShell } from './EditorPanelShell';
import type { AiFillOutput } from '@/lib/ai/fill-invitation';

interface Props {
  eventType: string;
  defaultNames: string;
  onApply: (data: AiFillOutput) => void | Promise<void>;
  onClose: () => void;
}

export function AiFillPanel({ eventType, defaultNames, onApply, onClose }: Props) {
  const { t } = useI18n();
  const [names, setNames] = useState(defaultNames);
  const [tone, setTone] = useState<'warm' | 'formal' | 'playful' | 'traditional'>('warm');
  const [venue, setVenue] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<AiFillOutput | null>(null);
  const [source, setSource] = useState<'ai' | 'fallback' | null>(null);
  const [error, setError] = useState('');

  const run = async () => {
    if (!names.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          names: names.trim(),
          tone,
          language: 'both',
          venue: venue.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        data?: AiFillOutput;
        source?: 'ai' | 'fallback';
        message?: string;
      };
      if (!res.ok || !data.data) throw new Error(data.message || 'AI failed');
      setPreview(data.data);
      setSource(data.source ?? 'fallback');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await onApply(preview);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <EditorPanelShell title={t('invitation.edit.aiFillTitle')} onClose={onClose}>
      <p className="font-body text-sm text-us-ink-muted">{t('invitation.edit.aiFillHint')}</p>

      <div className="space-y-2">
        <Label htmlFor="ai-names">Имена</Label>
        <Input id="ai-names" value={names} onChange={(e) => setNames(e.target.value)} />
        <Label htmlFor="ai-tone">Тон</Label>
        <select
          id="ai-tone"
          className="w-full rounded-md border border-us-border bg-us-surface px-3 py-2 font-body text-sm"
          value={tone}
          onChange={(e) => setTone(e.target.value as typeof tone)}
        >
          <option value="warm">Тёплый</option>
          <option value="formal">Формальный</option>
          <option value="playful">Лёгкий</option>
          <option value="traditional">Традиционный</option>
        </select>
        <Label htmlFor="ai-venue">Место (опционально)</Label>
        <Input id="ai-venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
      </div>

      {error ? <p className="font-body text-sm text-red-700">{error}</p> : null}

      <Button type="button" size="sm" onClick={() => void run()} disabled={loading || !names.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {t('invitation.edit.aiFillRun')}
      </Button>

      {preview ? (
        <div className="space-y-2 rounded-md border border-us-border bg-us-ivory p-3">
          {source ? (
            <p className="font-body text-xs text-us-ink-muted">
              {source === 'ai' ? 'AI' : 'Offline fallback'}
            </p>
          ) : null}
          {preview.bodyRu ? (
            <p className="font-body text-sm text-us-ink whitespace-pre-wrap">{preview.bodyRu}</p>
          ) : null}
          {preview.bodyKz ? (
            <p className="font-body text-sm text-us-ink-muted whitespace-pre-wrap">{preview.bodyKz}</p>
          ) : null}
          {preview.dressCode ? (
            <p className="font-body text-xs text-us-ink-muted">Dress: {preview.dressCode}</p>
          ) : null}
          <Button type="button" size="sm" onClick={() => void apply()} disabled={loading}>
            {t('invitation.edit.aiFillApply')}
          </Button>
        </div>
      ) : null}
    </EditorPanelShell>
  );
}
