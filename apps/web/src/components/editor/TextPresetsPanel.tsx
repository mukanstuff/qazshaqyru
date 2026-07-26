'use client';

import { useI18n } from '@/i18n';
import { getTextPresets } from '@/lib/templates/text-presets';
import type { EventType } from '@prisma/client';
import { cn } from '@/lib/shared/utils';
import { EditorPanelShell } from './EditorPanelShell';

interface Props {
  eventType: EventType;
  onApply: (greeting: string, closing?: string) => void;
  onClose: () => void;
}

export function TextPresetsPanel({ eventType, onApply, onClose }: Props) {
  const { t, locale } = useI18n();
  const presets = getTextPresets(eventType);
  const isKz = locale === 'kz';

  return (
    <EditorPanelShell title={t('invitation.edit.toolbarTextPresets')} onClose={onClose}>
      <p className="font-body text-sm text-us-ink-muted">{t('invitation.edit.textPresetsKzHint')}</p>
      <p className="font-body text-xs text-us-ink-muted">{t('invitation.edit.textPresetsHint')}</p>
      <div className="space-y-2">
        {presets.map((preset, index) => {
          const greeting = isKz ? preset.greetingKz : preset.greetingRu;
          const closing = isKz ? preset.closingKz : preset.closingRu;
          const label = isKz ? preset.labelKz : preset.labelRu;
          const previewSecondary = isKz ? preset.greetingRu : preset.greetingKz;

          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                onApply(greeting, closing);
                onClose();
              }}
              className={cn(
                'w-full rounded-md border border-us-border bg-us-surface p-3 text-left transition-colors',
                'hover:border-us-accent/30 hover:bg-us-accent/[0.03]'
              )}
            >
              <span className="block font-body text-sm font-medium text-us-ink">{label}</span>
              <span className="mt-1 block font-body text-xs text-us-ink-muted">
                {greeting.slice(0, 100)}
                {greeting.length > 100 ? '…' : ''}
              </span>
              <span className="mt-0.5 block font-body text-[10px] text-us-ink-muted/80">
                {previewSecondary.slice(0, 72)}
                {previewSecondary.length > 72 ? '…' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </EditorPanelShell>
  );
}
