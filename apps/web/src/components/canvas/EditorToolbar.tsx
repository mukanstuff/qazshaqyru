'use client';

import { ArrowLeft, Redo2, Undo2 } from 'lucide-react';
import { useI18n } from '@/i18n';

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** Omit in a host that already renders its own back/save control (e.g.
   *  the admin template builder) — otherwise this floating circle/pill
   *  lands in the exact same top-left/top-right corner as that host's own
   *  button and visually collides with it. */
  onBack?: () => void;
  onPublish?: () => void;
}

/**
 * Top controls: Back / Undo / Redo on the left, Опубликовать on the right —
 * each its own floating circle (or pill, for Publish) directly over the
 * canvas, no shared bar behind them.
 *
 * This used to be an in-flow `<header>` with a solid background spanning the
 * full width — which pushed the canvas down by its height and, on a phone,
 * read as a second toolbar sitting on top of the invitation instead of
 * floating over it. It's `position: fixed` now (see `.editor-topbar-wrap`
 * in canvas-editor.css), laid out the same robust way as the bottom dock:
 * one flex row does the positioning so nothing needs hand-tuned pixel
 * offsets — that's exactly what the *previous* floating-buttons attempt got
 * wrong (`EditorFloatingClusters`, since removed) and why it became an
 * in-flow bar in the first place. This time the positioning wrapper is
 * `pointer-events: none` and only the buttons themselves are interactive,
 * so there's no invisible strip stealing clicks from the canvas underneath.
 */
export function EditorToolbar({ canUndo, canRedo, onUndo, onRedo, onBack, onPublish }: EditorToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="editor-topbar-wrap">
      <div className="editor-topbar-cluster">
        {onBack ? (
          <button
            type="button"
            className="editor-topbar-btn"
            onClick={onBack}
            aria-label={t('common.back')}
            title={t('common.back')}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          className="editor-topbar-btn"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={t('invitation.edit.canvas.undo')}
          title={t('invitation.edit.canvas.undo')}
        >
          <Undo2 size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="editor-topbar-btn"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label={t('invitation.edit.canvas.redo')}
          title={t('invitation.edit.canvas.redo')}
        >
          <Redo2 size={18} aria-hidden="true" />
        </button>
      </div>

      {onPublish ? (
        <button type="button" className="editor-topbar-btn editor-topbar-btn--publish" onClick={onPublish}>
          {t('invitation.edit.canvas.publish')}
        </button>
      ) : null}
    </div>
  );
}
