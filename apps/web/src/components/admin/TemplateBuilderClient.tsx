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
  const [nameRu, setNameRu] = useState('');
  const [nameKz, setNameKz] = useState('');
  const [category, setCategory] = useState('wedding');
  // 2026-07-30 OWNER MODEL: 3990 is ONLY admin/dev default.
  // Real price = Template.priceKzt from DB (see docs/PRODUCT_MODEL_AND_RULES.md).
  // Never surface hardcoded 3990 in user CTAs, wizard, pricing surfaces.
  const [priceKzt, setPriceKzt] = useState(3990);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/templates/${templateId}`)
      .then((r) => r.json())
      .then((data) => {
        if (alive && data.success && data.document) {
          setDoc(data.document);
          setNameRu(data.template?.nameRu || '');
          setNameKz(data.template?.nameKz || '');
          setCategory(data.template?.category || 'wedding');
          setPriceKzt(data.template?.priceKzt || 3990);
          setLoading(false);
        } else {
          toast({ title: 'Ошибка загрузки шаблона', variant: 'destructive' });
        }
      })
      .catch(() => {
        toast({ title: 'Ошибка загрузки шаблона', variant: 'destructive' });
      });
    return () => {
      alive = false;
    };
  }, [templateId, toast]);

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

  if (loading || !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1b1419] text-zinc-400">
        Загрузка конструктора шаблона…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#1b1419]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-900/90 px-6 py-3 text-zinc-100">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
            onClick={() => router.push('/admin/templates')}
          >
            ← К списку
          </Button>
          <span className="font-display text-sm font-bold text-[#c9a961]">
            Режим создания шаблона
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            placeholder="Название (RU)"
            className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-white"
          />
          <input
            type="text"
            value={nameKz}
            onChange={(e) => setNameKz(e.target.value)}
            placeholder="Название (KZ)"
            className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-white"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-white"
          >
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
            className="w-20 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-white"
          />
          <Button
            size="sm"
            className="bg-[#c9a961] text-zinc-950 font-bold hover:bg-[#b8956b]"
            disabled={saving}
            onClick={() => void handleSave(doc)}
          >
            {saving ? 'Сохраняется...' : 'Сохранить шаблон'}
          </Button>
        </div>
      </header>

      <div className="flex-1">
        <CanvasEditor
          initialDocument={doc}
          mode="template-builder"
          onSaveRequest={async (d) => {
            await handleSave(d);
          }}
        />
      </div>
    </div>
  );
}
