'use client';

import { useMemo, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SuretTemplateManifest } from '@/lib/templates/manifest-types';
import { downloadBlob, renderSuretToBlob } from '@/lib/templates/suret-export';

interface Props {
  manifest: SuretTemplateManifest;
  locale?: 'ru' | 'kz';
  /** When true, show editable slot inputs (designer wiring / owner edit). */
  editable?: boolean;
  initialSlots?: Record<string, string>;
  onSlotsChange?: (slots: Record<string, string>) => void;
}

export function SuretRenderer({
  manifest,
  locale = 'ru',
  editable = true,
  initialSlots,
  onSlotsChange,
}: Props) {
  const defaults = useMemo(() => {
    const map: Record<string, string> = {};
    for (const slot of manifest.texts) {
      map[slot.id] =
        initialSlots?.[slot.id] ??
        (locale === 'kz' ? slot.defaultText.kk : slot.defaultText.ru);
    }
    return map;
  }, [manifest, locale, initialSlots]);

  const [slots, setSlots] = useState<Record<string, string>>(defaults);

  const updateSlot = (id: string, value: string) => {
    setSlots((prev) => {
      const next = { ...prev, [id]: value };
      onSlotsChange?.(next);
      return next;
    });
  };
  const [exporting, setExporting] = useState(false);
  const [bgFailed, setBgFailed] = useState(false);

  const exportImage = async (type: 'image/png' | 'image/webp') => {
    setExporting(true);
    try {
      const blob = await renderSuretToBlob(manifest, slots, locale, type);
      const ext = type === 'image/webp' ? 'webp' : 'png';
      downloadBlob(blob, `${manifest.slug}.${ext}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4" data-testid="suret-renderer">
      <div
        className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-us-border bg-us-ivory shadow-us-md"
        style={{
          backgroundImage: bgFailed ? undefined : `url(${manifest.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={manifest.background}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
          onError={() => setBgFailed(true)}
        />
        {bgFailed ? (
          <div className="absolute inset-0 bg-gradient-to-b from-[#f7f1e8] to-[#e8dcc8]" />
        ) : null}
        {manifest.texts.map((slot) => (
          <p
            key={slot.id}
            className="absolute left-1/2 w-[86%] -translate-x-1/2 text-center"
            style={{
              top: `${slot.top}%`,
              color: slot.color,
              fontSize: `${Math.max(12, (slot.fontSize ?? 24) * 0.35)}px`,
              fontFamily: 'Georgia, "Times New Roman", serif',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {slots[slot.id]}
          </p>
        ))}
      </div>

      {editable ? (
        <div className="space-y-2">
          {manifest.texts.map((slot) => (
            <Input
              key={slot.id}
              value={slots[slot.id] ?? ''}
              onChange={(e) => updateSlot(slot.id, e.target.value)}
              aria-label={slot.id}
              data-testid={`suret-slot-${slot.id}`}
            />
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          className="flex-1"
          disabled={exporting}
          onClick={() => void exportImage('image/png')}
          data-testid="suret-export-png"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          PNG
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={exporting}
          onClick={() => void exportImage('image/webp')}
          data-testid="suret-export-webp"
        >
          WebP
        </Button>
      </div>
      {bgFailed ? (
        <p className="text-center text-xs text-us-ink-muted">
          Фон ещё не загружен дизайнером — показан fallback. Экспорт слотов работает.
        </p>
      ) : null}
    </div>
  );
}
