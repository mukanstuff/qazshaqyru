'use client';

import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';

interface EditorPreviewWatermarkProps {
  show: boolean;
  needsPayment?: boolean;
}

/** Non-intrusive draft preview overlay before publication/payment. */
export function EditorPreviewWatermark({ show, needsPayment = false }: EditorPreviewWatermarkProps) {
  const { t } = useI18n();

  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4" aria-hidden>
      <div className="flex flex-col items-center gap-1">
        <Badge variant="default" className="bg-us-ink/75 text-white backdrop-blur-sm">
          {t('quickWizard.previewWatermark')}
        </Badge>
        {needsPayment ? (
          <span className="rounded-md bg-us-surface/90 px-2 py-0.5 font-body text-[10px] text-us-ink-muted shadow-us-sm backdrop-blur-sm">
            {t('publishFlow.editingFree')}
          </span>
        ) : null}
      </div>
    </div>
  );
}
