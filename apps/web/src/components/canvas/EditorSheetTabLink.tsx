'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Lock } from 'lucide-react';
import { useI18n } from '@/i18n';
import { resolveHostApiError } from '@/lib/guests/host-api-error';
import { buildPublicInviteUrl } from '@/lib/invitations/share-url';
import { formatKzt } from '@/lib/shared/format-price';

interface Props {
  invitationId: string;
  slug: string;
  /** Same gate as the hub's own slug editor: template price paid = full access. */
  fullAccess: boolean;
  onSlugChange: (nextSlug: string) => void;
  priceKzt: number;
}

/**
 * Link customization, reachable from inside the editor rather than only
 * after leaving it for the hub. Same PATCH /api/invitations/[id]/slug and
 * the same fullAccess gate the hub's own slug editor already uses — this
 * isn't a second implementation, just a second place to reach the same one.
 */
export function EditorSheetTabLink({ invitationId, slug, fullAccess, onSlugChange, priceKzt }: Props) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(slug);
  const [saved, setSaved] = useState(slug);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDraft(slug);
    setSaved(slug);
  }, [slug]);

  const publicUrl =
    typeof window !== 'undefined' ? buildPublicInviteUrl(window.location.origin, saved) : `/i/${saved}`;

  const save = useCallback(async () => {
    if (!fullAccess) return;
    if (draft === saved) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/slug`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: draft.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resolveHostApiError(data, t, 'dashboard.guestOps.slugError'));
      }
      const next = data.slug as string;
      setSaved(next);
      setDraft(next);
      onSlugChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invitation.hub.error'));
    } finally {
      setBusy(false);
    }
  }, [fullAccess, invitationId, draft, saved, onSlugChange, t]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }, [publicUrl]);

  return (
    <div className="editor-sheet-section-stack editor-design-tab">
      <div className="editor-sheet-section">
        <h3 className="editor-sheet-section-title">{t('invitation.edit.canvas.sheet.tabs.link')}</h3>

        <div className="hub-url-box">
          <span className="hub-url-text">{publicUrl}</span>
          <button type="button" className="hub-url-copy" onClick={copy}>
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          </button>
        </div>

        {fullAccess ? (
          <div className="hub-hero-slug" style={{ marginTop: 12 }}>
            <span className="hub-hero-slug-prefix">/i/</span>
            <input
              className="hub-hero-slug-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              maxLength={64}
              aria-label={t('invitation.hub.heroSlugLabel')}
            />
            <button
              type="button"
              className="hub-hero-slug-save"
              onClick={save}
              disabled={busy || draft === saved}
            >
              {busy ? t('common.saving') : draft === saved ? t('invitation.hub.heroSlugSaved') : t('invitation.hub.heroSlugSave')}
            </button>
          </div>
        ) : (
          <p className="editor-sheet-hint" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} aria-hidden="true" />
            {t('invitation.hub.lockedCta')} · {formatKzt(priceKzt)} ₸
          </p>
        )}

        {error ? <p className="hub-sheet-toast hub-sheet-toast--err">{error}</p> : null}
      </div>
    </div>
  );
}
