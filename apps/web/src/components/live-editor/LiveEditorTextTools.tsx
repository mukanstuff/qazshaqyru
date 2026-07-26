'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Type } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useToast } from '@/components/ui/toaster';
import { AiFillPanel } from '@/components/editor/AiFillPanel';
import { TextPresetsPanel } from '@/components/editor/TextPresetsPanel';
import { EditorPanelPortal } from '@/components/editor/EditorPanelPortal';
import { aiFillToFieldPatches } from '@/lib/ai/apply-ai-fill';
import type { AiFillOutput } from '@/lib/ai/fill-invitation';
import type { EventType } from '@prisma/client';

interface Props {
  eventType: string;
  defaultNames: string;
  onFieldChange: (path: string, value: string) => void | Promise<void>;
}

type Panel = 'ai' | 'presets' | null;

/**
 * One-tap шақыру text + optional tone panel for Live Editor.
 * No LLM in guest path — owner editor only.
 */
export function LiveEditorTextTools({ eventType, defaultNames, onFieldChange }: Props) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);

  const applyFill = async (data: AiFillOutput) => {
    for (const patch of aiFillToFieldPatches(data)) {
      await onFieldChange(patch.path, patch.value);
    }
  };

  const oneTap = async () => {
    if (!defaultNames.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/ai/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          names: defaultNames.trim(),
          tone: 'traditional',
          language: 'both',
        }),
      });
      const json = (await res.json()) as { data?: AiFillOutput; message?: string };
      if (!res.ok || !json.data) throw new Error(json.message || 'AI failed');
      await applyFill(json.data);
      toast({
        title: locale === 'kz' ? 'Мәтін қойылды' : 'Текст подставлен',
      });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : t('errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="live-editor-text-tools" data-testid="live-editor-text-tools">
        <button
          type="button"
          className="live-editor-pill"
          onClick={() => void oneTap()}
          disabled={busy || !defaultNames.trim()}
          title={locale === 'kz' ? 'Шақыру мәтіні (KK/RU)' : 'Текст шақыру (KK/RU)'}
          data-testid="live-editor-ai-one-tap"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden />
          )}
          <span>{locale === 'kz' ? 'Мәтін' : 'Текст'}</span>
        </button>
        <button
          type="button"
          className="live-editor-pill"
          onClick={() => setPanel('presets')}
          data-testid="live-editor-presets"
        >
          <Type className="h-4 w-4" aria-hidden />
          <span>{locale === 'kz' ? 'Үлгілер' : 'Пресеты'}</span>
        </button>
        <button
          type="button"
          className="live-editor-pill live-editor-pill--ghost"
          onClick={() => setPanel('ai')}
          data-testid="live-editor-ai-panel"
          title={locale === 'kz' ? 'Тон мен орын' : 'Тон и место'}
        >
          <span className="text-xs">···</span>
        </button>
      </div>

      {panel === 'ai' ? (
        <EditorPanelPortal>
          <AiFillPanel
            eventType={eventType}
            defaultNames={defaultNames}
            onApply={async (data) => {
              await applyFill(data);
            }}
            onClose={() => setPanel(null)}
          />
        </EditorPanelPortal>
      ) : null}

      {panel === 'presets' ? (
        <EditorPanelPortal>
          <TextPresetsPanel
            eventType={eventType as EventType}
            onApply={(greeting, closing) => {
              void onFieldChange('customText.greeting', greeting);
              void onFieldChange('customText.hostsLine', greeting);
              if (closing) {
                void onFieldChange('customText.closing', closing);
                void onFieldChange('customText.finalText', closing);
              }
            }}
            onClose={() => setPanel(null)}
          />
        </EditorPanelPortal>
      ) : null}
    </>
  );
}
