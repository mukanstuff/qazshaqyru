'use client';

/**
 * GuestCanvasHeader — 2026-08-14.
 *
 * Lightweight top bar used while editing a draft canvas invitation as a guest
 * (filling in already-authored template). Mirrors toi.com.kz-style: minimal,
 * one-line, no chrome that screams "editor".
 *
 * Shows:
 *   - Back button (← Назад) — window.history.back if available, else /invitations.
 *   - Save status indicator (idle / saving / saved / error).
 *   - "Save" button — explicit trigger (autosave runs in the background; this
 *     is just a forced flush + tactile feedback).
 *
 * This is the first surface in the "one engine, two surfaces" plan. The admin
 * editor keeps the full EditorToolbar. See CanvasEditor.editorMode = 'guest'.
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n';
import type { SaveState } from './CanvasEditor';

interface Props {
  saveState: SaveState;
  lastSaved: Date | null;
  onSaveNow: () => void;
}

function formatAgo(d: Date | null, locale: 'ru' | 'kz') {
  if (!d) return '';
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 5) return locale === 'ru' ? 'только что' : 'жаңа ғана';
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  return `${m} мин`;
}

function SaveIndicator({
  state,
  onClick,
  locale,
  lastSaved,
}: {
  state: SaveState;
  onClick: () => void;
  locale: 'ru' | 'kz';
  lastSaved: Date | null;
}) {
  const { t } = useI18n();
  if (state === 'saving') {
    return <span className="ct-save-indicator is-saving">⟳ {t('invitation.edit.canvas.saving')}</span>;
  }
  if (state === 'error') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="ct-save-indicator is-error"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ⚠ {t('invitation.edit.canvas.saveError')}
      </button>
    );
  }
  if (state === 'saved') {
    return (
      <span className="ct-save-indicator is-saved">
        ✓ {t('invitation.edit.canvas.saved')} · {formatAgo(lastSaved, locale)}
      </span>
    );
  }
  return <span className="ct-save-indicator is-idle">{t('invitation.edit.canvas.idle')}</span>;
}

export function GuestCanvasHeader({ saveState, lastSaved, onSaveNow }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const handleBack = useCallback(() => {
    // Prefer in-app history (came from catalog preview probably). If there's no
    // history entry (direct deep-link), fall back to /invitations.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    // Fall back to /templates (catalog) — /invitations/{id} would expose
    // the draft uuid, which is exactly the leak /editor/[templateKey] hides.
    router.push('/templates');
  }, [router]);

  return (
    <header
      className="canvas-toolbar"
      data-testid="guest-canvas-header"
      style={{ minHeight: 48 }}
    >
      <button
        type="button"
        className="ct-btn"
        onClick={handleBack}
        aria-label={t('common.back')}
      >
        ← {t('common.back')}
      </button>

      <span className="ct-divider" />

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <SaveIndicator
          state={saveState}
          onClick={onSaveNow}
          locale={locale}
          lastSaved={lastSaved}
        />
        <button
          type="button"
          className="ct-btn ct-btn-primary"
          onClick={onSaveNow}
          disabled={saveState === 'saving'}
        >
          💾 {t('common.save')}
        </button>
      </div>
    </header>
  );
}
