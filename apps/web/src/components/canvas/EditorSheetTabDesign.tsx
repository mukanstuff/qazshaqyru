'use client';

import { useI18n } from '@/i18n';

/**
 * "Design" tab — placeholder.
 *
 * Out of scope for this revision. Will eventually house theme presets
 * (font pairings, color palettes, background style picker).
 */
export function EditorSheetTabDesign() {
  const { t } = useI18n();
  return (
    <div className="editor-sheet-empty editor-sheet-coming-soon">
      <p>{t('invitation.edit.canvas.sheet.designComingSoon')}</p>
    </div>
  );
}
