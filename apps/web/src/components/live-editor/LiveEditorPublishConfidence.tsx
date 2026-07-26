'use client';

import { useEffect } from 'react';
import { Check, AlertCircle, Rocket, Share2, ExternalLink } from 'lucide-react';
import type { ReadinessResult } from '@/lib/invitations/editor-readiness';
import { FamilyPreviewCard } from '@/components/editor/FamilyPreviewCard';
import { useI18n } from '@/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  readiness: ReadinessResult;
  previewHref: string | null;
  title: string;
  isPublishing: boolean;
  isPublished: boolean;
  onPublish: () => void;
  onShare?: () => void;
  serverInvitationId?: string;
}

export function LiveEditorPublishConfidence({
  open,
  onClose,
  readiness,
  previewHref,
  title,
  isPublishing,
  isPublished,
  onPublish,
  onShare,
  serverInvitationId,
}: Props) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canPublish = readiness.requiredComplete;
  const displayTitle = title || t('liveEditor.publishModal.untitled');

  return (
    <div
      className="live-editor-publish-root"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="live-editor-publish-confidence"
    >
      <div
        className="live-editor-publish live-editor-publish--safe"
        role="dialog"
        aria-modal="true"
        aria-labelledby="le-publish-title"
      >
        <h2 id="le-publish-title" className="live-editor-publish__title">
          {isPublished
            ? t('liveEditor.publishModal.titleDone')
            : t('liveEditor.publishModal.titleReady')}
        </h2>
        <p className="live-editor-publish__sub">
          {t('liveEditor.publishModal.readinessLine', {
            title: displayTitle,
            done: readiness.completedSteps,
            total: readiness.totalSteps,
          })}
        </p>

        <ul className="live-editor-publish__list">
          {readiness.steps.map((step) => (
            <li
              key={step.id}
              className={
                step.completed
                  ? 'live-editor-publish__item live-editor-publish__item--ok'
                  : 'live-editor-publish__item'
              }
            >
              {step.completed ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <AlertCircle className="h-4 w-4" aria-hidden />
              )}
              <span>
                {step.label}
                {step.required ? ' *' : ''}
                {!step.completed && step.issues[0] ? (
                  <span className="live-editor-publish__issue"> — {step.issues[0].title}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>

        <div className="live-editor-publish__reassure">
          <p>{t('liveEditor.publishModal.freeNote')}</p>
          <p>{t('liveEditor.publishModal.editAfter')}</p>
          <p>{t('liveEditor.publishModal.linkStable')}</p>
        </div>

        {serverInvitationId ? (
          <div className="live-editor-publish__family">
            <FamilyPreviewCard invitationId={serverInvitationId} />
          </div>
        ) : null}

        <div className="live-editor-publish__actions">
          <button type="button" className="live-editor-pill" onClick={onClose}>
            {t('liveEditor.publishModal.keepEditing')}
          </button>
          {previewHref ? (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="live-editor-pill"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              {t('liveEditor.publishModal.guestView')}
            </a>
          ) : null}
          {isPublished && onShare ? (
            <button type="button" className="live-editor-topbar__save" onClick={onShare}>
              <Share2 className="h-4 w-4" aria-hidden />
              {t('liveEditor.share')}
            </button>
          ) : canPublish ? (
            <div className="live-editor-publish__commit">
              <p className="live-editor-publish__legal">{t('liveEditor.publishModal.legal')}</p>
              <button
                type="button"
                className="live-editor-topbar__save"
                disabled={isPublishing}
                onClick={onPublish}
                data-testid="live-editor-publish-confirm"
              >
                <Rocket className="h-4 w-4" aria-hidden />
                {isPublishing
                  ? t('liveEditor.publishModal.publishing')
                  : t('liveEditor.publish')}
              </button>
            </div>
          ) : (
            <p className="live-editor-publish__not-ready" data-testid="live-editor-publish-blocked">
              {t('liveEditor.publishModal.blocked')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
