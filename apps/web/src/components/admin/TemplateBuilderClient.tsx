'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CanvasEditor } from '@/components/canvas/CanvasEditor';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

interface Props {
  templateId: string;
}

export function TemplateBuilderClient({ templateId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<InvitationCanvasDocument | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nameRu, setNameRu] = useState('');
  const [nameKz, setNameKz] = useState('');
  const [category, setCategory] = useState('wedding');
  // 2026-07-30 OWNER MODEL: 3990 is ONLY admin/dev default.
  // Real price = Template.priceKzt from DB (see docs/PRODUCT_MODEL_AND_RULES.md).
  // Never surface hardcoded 3990 in user CTAs, wizard, pricing surfaces.
  const [priceKzt, setPriceKzt] = useState(3990);
  const [saving, setSaving] = useState(false);

  // Load once per templateId. This deliberately does NOT depend on `toast`:
  // the failure paths below set local state instead of firing a toast, so the
  // effect has a single stable dependency. (It used to list `toast`, which —
  // while the Toaster provider was mis-mounted and handing out a fresh no-op
  // object every render — re-ran this fetch on every render forever.)
  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/templates/${templateId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data.success && data.document) {
          setDoc(data.document);
          setNameRu(data.template?.nameRu || '');
          setNameKz(data.template?.nameKz || '');
          setCategory(data.template?.category || 'wedding');
          setPriceKzt(data.template?.priceKzt || 3990);
        } else {
          setLoadError(data.message || 'Шаблон не найден');
        }
      })
      .catch(() => {
        if (alive) setLoadError('Не удалось загрузить шаблон');
      })
      // Previously only the success branch cleared `loading`, so any failure
      // left the page stuck on the loading text forever.
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [templateId]);

  const handleSave = async (currentDoc: InvitationCanvasDocument) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameRu,
          nameKz,
          category,
          priceKzt: Number(priceKzt) || 0,
          canvas: currentDoc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ошибка сохранения');
      toast({ title: 'Успешно', description: 'Шаблон сохранён' });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось сохранить шаблон',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-us-ivory text-us-ink-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-us-accent border-t-transparent" />
        <p className="text-sm">Загрузка конструктора шаблона…</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-us-ivory px-6 text-center">
        <p className="font-display text-lg text-us-ink">Не удалось открыть конструктор</p>
        <p className="text-sm text-us-ink-muted">{loadError ?? 'Шаблон не найден'}</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/templates')}>
          ← К списку шаблонов
        </Button>
      </div>
    );
  }

  const fieldClass =
    'rounded-lg border border-us-border bg-us-surface px-2.5 py-1.5 text-xs text-us-ink placeholder:text-us-ink-muted focus:outline-none focus:ring-2 focus:ring-us-accent/30';

  return (
    <div className="flex min-h-screen flex-col bg-us-ivory">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-us-border bg-us-surface px-6 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/templates')}>
            ← К списку
          </Button>
          <span className="font-display text-sm font-bold text-us-accent-strong">
            Режим создания шаблона
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            placeholder="Название (RU)"
            className={fieldClass}
          />
          <input
            type="text"
            value={nameKz}
            onChange={(e) => setNameKz(e.target.value)}
            placeholder="Название (KZ)"
            className={fieldClass}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
            <option value="wedding">Свадьба (wedding)</option>
            <option value="toy">Той (toy)</option>
            <option value="betashar">Беташар (betashar)</option>
            <option value="kyz_uzatu">Қыз ұзату (kyz_uzatu)</option>
            <option value="sundet_toy">Сүндет той (sundet_toy)</option>
            <option value="tusau_keser">Тұсаукесер (tusau_keser)</option>
            <option value="birthday">Туған күн (birthday)</option>
            <option value="anniversary">Мерейтой (anniversary)</option>
            <option value="corporate">Корпоратив (corporate)</option>
          </select>
          <input
            type="number"
            value={priceKzt}
            onChange={(e) => setPriceKzt(Number(e.target.value))}
            placeholder="Цена ₸"
            className={`w-20 ${fieldClass}`}
          />
          <Button size="sm" disabled={saving} onClick={() => void handleSave(doc)}>
            {saving ? 'Сохраняется...' : 'Сохранить шаблон'}
          </Button>
        </div>
      </header>

      <div className="flex-1">
        <CanvasEditor
          initialDocument={doc}
          mode="template-builder"
          templateId={templateId}
          onSaveRequest={async (d) => {
            await handleSave(d);
          }}
        />
      </div>
    </div>
  );
}
