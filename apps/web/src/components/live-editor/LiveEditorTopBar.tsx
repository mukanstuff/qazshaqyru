'use client';

import Link from 'next/link';
import { ArrowLeft, Eye, MoreHorizontal, Rocket, Save, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/i18n';

interface Props {
  title: string;
  subtitle: string;
  backHref: string;
  isSaving: boolean;
  isPublishing?: boolean;
  readinessLabel: string;
  readinessScore?: number;
  previewHref: string | null;
  isPublished: boolean;
  onSave: () => void;
  onPublish: () => void;
  onShare?: () => void;
  progressSlot?: React.ReactNode;
}

export function LiveEditorTopBar({
  title,
  subtitle,
  backHref,
  isSaving,
  isPublishing = false,
  readinessLabel,
  readinessScore = 100,
  previewHref,
  isPublished,
  onSave,
  onPublish,
  onShare,
  progressSlot,
}: Props) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const publishIsPrimary = isPublished || readinessScore >= 100;

  return (
    <header className="live-editor-topbar">
      <Link href={backHref} className="live-editor-topbar__back" aria-label={t('liveEditor.back')}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span className="live-editor-topbar__back-label">{t('liveEditor.back')}</span>
      </Link>

      {progressSlot ? (
        <div className="live-editor-topbar__progress">{progressSlot}</div>
      ) : null}
      <div className="live-editor-topbar__meta">
        <h1 className="live-editor-topbar__title">{title}</h1>
        <p className="live-editor-topbar__sub">
          {subtitle}
          <span className="live-editor-topbar__ready" data-testid="live-editor-readiness">
            {' '}
            · {readinessLabel}
          </span>
        </p>
      </div>

      <div className="live-editor-topbar__actions">
        <div className="live-editor-topbar__desktop-actions">
          <button
            type="button"
            className="live-editor-pill live-editor-topbar__secondary"
            onClick={onSave}
            disabled={isSaving}
            data-testid="live-editor-save"
          >
            <Save className="h-4 w-4" aria-hidden />
            <span>{isSaving ? '…' : t('liveEditor.save')}</span>
          </button>

          {previewHref ? (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="live-editor-pill live-editor-topbar__secondary"
              data-testid="live-editor-view"
            >
              <Eye className="h-4 w-4" aria-hidden />
              <span>{t('liveEditor.preview')}</span>
            </a>
          ) : (
            <button
              type="button"
              className="live-editor-pill live-editor-topbar__secondary"
              disabled
              title={t('liveEditor.previewDisabled')}
            >
              <Eye className="h-4 w-4" aria-hidden />
              <span>{t('liveEditor.preview')}</span>
            </button>
          )}

          {isPublished && onShare ? (
            <button
              type="button"
              className="live-editor-pill live-editor-topbar__secondary"
              onClick={onShare}
              data-testid="live-editor-share"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              <span>{t('liveEditor.share')}</span>
            </button>
          ) : null}
        </div>

        <button
          type="button"
          className="live-editor-topbar__menu-btn"
          aria-expanded={menuOpen}
          aria-label="Дополнительные действия"
          onClick={() => setMenuOpen((v) => !v)}
          data-testid="live-editor-menu"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>

        {menuOpen ? (
          <div className="live-editor-topbar__menu" role="menu">
            <button
              type="button"
              className="live-editor-topbar__menu-item"
              onClick={() => {
                onSave();
                setMenuOpen(false);
              }}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" aria-hidden />
              {isSaving ? '…' : t('liveEditor.save')}
            </button>
            {previewHref ? (
              <a
                href={previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="live-editor-topbar__menu-item"
                onClick={() => setMenuOpen(false)}
              >
                <Eye className="h-4 w-4" aria-hidden />
                {t('liveEditor.preview')}
              </a>
            ) : null}
            {isPublished && onShare ? (
              <button
                type="button"
                className="live-editor-topbar__menu-item"
                onClick={() => {
                  onShare();
                  setMenuOpen(false);
                }}
              >
                <Share2 className="h-4 w-4" aria-hidden />
                {t('liveEditor.share')}
              </button>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          className={
            publishIsPrimary ? 'live-editor-topbar__save' : 'live-editor-pill live-editor-topbar__publish-soft'
          }
          onClick={onPublish}
          disabled={isPublishing}
          data-testid="live-editor-publish"
        >
          <Rocket className="h-4 w-4" aria-hidden />
          <span>{isPublishing ? '…' : isPublished ? t('liveEditor.status') : t('liveEditor.publish')}</span>
        </button>
      </div>
    </header>
  );
}
