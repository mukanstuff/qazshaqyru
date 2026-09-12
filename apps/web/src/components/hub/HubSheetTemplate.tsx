'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';
import { resolveHostApiError } from '@/lib/guests/host-api-error';

interface TemplateCard {
  id: string;
  slug: string;
  nameRu: string;
  nameKz: string | null;
  previewImageUrl: string | null;
}

/**
 * The card's name in the reader's language.
 *
 * The sheet rendered `nameRu` unconditionally, so a Kazakh host picking a new
 * design saw «Элегантное золото» in an otherwise Kazakh screen — even though
 * the row carries `nameKz: "Талғампаз алтын"`. The hub's own section meta had
 * the locale check; this list did not.
 */
function cardName(tpl: TemplateCard, locale: string): string {
  return (locale === 'kz' ? tpl.nameKz : tpl.nameRu) || tpl.nameRu;
}

interface Props {
  open: boolean;
  onClose: () => void;
  invitationId: string;
  currentTemplateKey: string;
}

/**
 * 2026-08-18 (Phase 2, hub screen): pick a new template. Backend merges the
 * user's customText + couple-names + audio + event meta onto the new canvas;
 * colors / fonts / decorative blocks are owned by the chosen template.
 */
export function HubSheetTemplate({
  open,
  onClose,
  invitationId,
  currentTemplateKey,
}: Props) {
  const { t, locale } = useI18n();
  const [templates, setTemplates] = useState<TemplateCard[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  // Load templates when the sheet opens.
  useEffect(() => {
    if (!open || templates) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/templates', { method: 'GET' });
        const data = await res.json();
        if (!cancelled) {
          setTemplates((data.templates ?? []) as TemplateCard[]);
        }
      } catch {
        if (!cancelled) setTemplates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, templates]);

  const onApply = async () => {
    if (!selectedId) return;
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/switch-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedId,
          templateKey: templates?.find((tpl) => tpl.id === selectedId)?.slug,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resolveHostApiError(data, t, 'invitation.hub.templateSheet.error'));
      }
      setToast({ kind: 'ok', message: t('invitation.hub.templateSheet.success') });
      window.setTimeout(() => {
        setToast(null);
        onClose();
        // Force a hard reload so the editor / public page both pick up the
        // new canvas + templateKey.
        if (typeof window !== 'undefined') window.location.reload();
      }, 900);
    } catch (e) {
      setToast({
        kind: 'err',
        message: e instanceof Error ? e.message : t('invitation.hub.templateSheet.error'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <HubSheet
      open={open}
      onClose={onClose}
      title={t('invitation.hub.templateSheet.title')}
      subtitle={t('invitation.hub.templateSheet.subtitle')}
      footer={
        <div className="hub-share-buttons" style={{ marginTop: 0 }}>
          <button type="button" className="hub-btn" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="hub-btn hub-btn--primary"
            onClick={onApply}
            disabled={busy || !selectedId || templates?.find((tpl) => tpl.id === selectedId)?.slug === currentTemplateKey}
          >
            {busy ? t('common.saving') : t('invitation.hub.templateSheet.apply')}
          </button>
        </div>
      }
    >
      {toast ? (
        <div
          className={
            toast.kind === 'ok'
              ? 'hub-sheet-toast hub-sheet-toast--ok'
              : 'hub-sheet-toast hub-sheet-toast--err'
          }
        >
          {toast.message}
        </div>
      ) : null}

      {!templates ? (
        <p className="hub-note">{t('common.loading')}</p>
      ) : templates.length === 0 ? (
        <p className="hub-note">{t('invitation.hub.error')}</p>
      ) : (
        <div className="hub-tpl-grid">
          {templates.map((tpl) => {
            const isCurrent = tpl.slug === currentTemplateKey;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => !isCurrent && setSelectedId(tpl.id)}
                disabled={isCurrent}
                className={
                  'hub-tpl-card' +
                  (isCurrent || selectedId === tpl.id ? ' hub-tpl-card--current' : '')
                }
              >
                <div className="hub-tpl-thumb">
                  {tpl.previewImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tpl.previewImageUrl} alt={cardName(tpl, locale)} loading="lazy" />
                  ) : (
                    <span>{cardName(tpl, locale)}</span>
                  )}
                </div>
                <div className="hub-tpl-name">{cardName(tpl, locale)}</div>
                {isCurrent ? (
                  <div className="hub-tpl-current-badge">{t('invitation.hub.templateSheet.current')}</div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </HubSheet>
  );
}