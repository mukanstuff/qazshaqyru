'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  Users,
  Share2,
  Palette,
  Type,
  Calendar,
  Music,
  LayoutTemplate,
  Bell,
  UserRoundCheck,
  UtensilsCrossed,
  Archive,
  Lock,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { HubSection } from '@/components/hub/HubSection';
import { HubSheetShare } from '@/components/hub/HubSheetShare';
import { HubSheetDesign } from '@/components/hub/HubSheetDesign';
import { HubSheetTexts } from '@/components/hub/HubSheetTexts';
import { HubSheetDates } from '@/components/hub/HubSheetDates';
import { HubSheetMusic } from '@/components/hub/HubSheetMusic';
import { HubSheetTemplate } from '@/components/hub/HubSheetTemplate';
import { HubSheetReminders } from '@/components/hub/HubSheetReminders';
import { useHubState } from '@/components/hub/useHubState';
import { checkoutInvitationClient } from '@/lib/payments/checkout-client';
import { resolveHostApiError } from '@/lib/guests/host-api-error';

export interface HubSectionListProps {
  invitationId: string;
  invitationSlug: string;
  invitationTitle: string;
  status: 'draft' | 'published' | 'archived';
  templateKey: string;
  editHref: string;

  // Hero / metrics
  viewCount: number;
  confirmedSeats: number;
  expectedSeats: number;

  // Text sheet initial values
  customText: {
    greeting?: string;
    intro?: string;
    details?: string;
    closing?: string;
    dressCode?: string;
    groomName?: string;
    brideName?: string;
    eventPlace?: string;
    address?: string;
  };

  // Dates sheet initial values
  eventDate: string; // yyyy-MM-dd (computed from ISO)
  eventTime: string;
  eventPlace: string;
  address: string;
  eventTimezone: string;

  // Music
  musicUrl: string;

  // Restaurant share
  restaurantLinkAllowed: boolean;

  // Guests stat (for the "Гости" section meta line)
  guestCount: number;
  guestCountAttending: number;

  // Pricing / plan
  fullAccess: boolean;
  priceKzt: number;
}

/**
 * 2026-08-18 (Phase 2, hub screen): card list of every primary action the
 * invitation owner needs after creation. Each section opens a HubSheet.
 *
 * The hub is meant to live inside the existing GuestOpsHub page (above the
 * funnel / share cards) — that page passes the props down. Keeping
 * GuestOpsHub untouched means we don't risk regressing the post-publish
 * share screen, the guests funnel, the CSV export, the restaurant share,
 * etc. — those still live in the legacy area below the hub.
 */
export function HubSectionList(props: HubSectionListProps) {
  const { t } = useI18n();
  const { activeSheet, openSheet, closeSheet } = useHubState();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Inline slug editor ────────────────────────────────────────────────
  const [slugDraft, setSlugDraft] = useState(props.invitationSlug);
  const [slugSaved, setSlugSaved] = useState(props.invitationSlug);
  useEffect(() => {
    setSlugDraft(props.invitationSlug);
    setSlugSaved(props.invitationSlug);
  }, [props.invitationSlug]);

  const saveSlug = useCallback(async () => {
    if (!props.fullAccess) return;
    if (slugDraft === slugSaved) return;
    setBusy('slug');
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${props.invitationId}/slug`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugDraft.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resolveHostApiError(data, t, 'dashboard.guestOps.slugError'));
      }
      setSlugSaved(data.slug as string);
      setSlugDraft(data.slug as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invitation.hub.error'));
    } finally {
      setBusy(null);
    }
  }, [props.fullAccess, props.invitationId, slugDraft, slugSaved, t]);

  // ── Upgrade CTA (used by locked sections) ─────────────────────────────
  const upgrade = useCallback(async () => {
    setBusy('upgrade');
    setError(null);
    try {
      const checkout = await checkoutInvitationClient(props.invitationId, { intent: 'pay' });
      if (checkout.paymentUrl) {
        window.location.href = checkout.paymentUrl;
        return;
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('dashboard.guestOps.payError'));
    } finally {
      setBusy(null);
    }
  }, [props.invitationId, t]);

  // ── Restaurant share (gated by entitlement) ───────────────────────────
  const [restaurantUrl, setRestaurantUrl] = useState<string | null>(null);
  const createRestaurantLink = useCallback(async () => {
    if (!props.restaurantLinkAllowed) return;
    setBusy('restaurant');
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${props.invitationId}/restaurant-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resolveHostApiError(data, t, 'dashboard.guestOps.linkError'));
      }
      const url = data.url as string;
      setRestaurantUrl(url);
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* ignore */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('dashboard.guestOps.genericError'));
    } finally {
      setBusy(null);
    }
  }, [props.invitationId, props.restaurantLinkAllowed, t]);

  // ── Archive ───────────────────────────────────────────────────────────
  const archive = useCallback(async () => {
    setBusy('archive');
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${props.invitationId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(resolveHostApiError(data, t, 'invitation.hub.error'));
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invitation.hub.error'));
    } finally {
      setBusy(null);
    }
  }, [props.invitationId, t]);

  // ── Derived display ───────────────────────────────────────────────────
  const statusClass = useMemo(() => {
    if (props.status === 'published') return 'hub-hero-status hub-hero-status--published';
    if (props.status === 'archived') return 'hub-hero-status hub-hero-status--archived';
    return 'hub-hero-status hub-hero-status--draft';
  }, [props.status]);

  const statusLabel = useMemo(() => {
    if (props.status === 'published') return t('invitation.hub.statusPublished');
    if (props.status === 'archived') return t('invitation.hub.statusArchived');
    return t('invitation.hub.statusDraft');
  }, [props.status, t]);

  const attendanceHint =
    props.expectedSeats > 0
      ? t('invitation.hub.heroAttendanceHint', { expected: props.expectedSeats })
      : t('invitation.hub.heroAttendanceHintNoExpected');

  const desc =
    props.status === 'archived'
      ? t('invitation.hub.archivedDesc')
      : props.status === 'published'
      ? t('invitation.hub.publishedDesc')
      : t('invitation.hub.draftDesc');

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="hub-shell">
      {/* Hero strip */}
      <div className="hub-hero">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={statusClass}>
            <span className="hub-hero-status-dot" />
            {statusLabel}
          </span>
        </div>
        <h1 className="hub-hero-title">{props.invitationTitle}</h1>
        <p className="hub-hero-sub">{desc}</p>

        <div className="hub-hero-stats">
          <div className="hub-hero-stat">
            <div className="hub-hero-stat-label">{t('invitation.hub.heroViews')}</div>
            <div className="hub-hero-stat-value">{props.viewCount}</div>
            <div className="hub-hero-stat-hint">
              <Eye size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} aria-hidden="true" />
            </div>
          </div>
          <div className="hub-hero-stat">
            <div className="hub-hero-stat-label">{t('invitation.hub.heroAttendance')}</div>
            <div className="hub-hero-stat-value">{props.confirmedSeats}</div>
            <div className="hub-hero-stat-hint">{attendanceHint}</div>
          </div>
        </div>

        {/* Inline slug editor (Phase 2 spec, item 9). Locked behind fullAccess. */}
        {props.fullAccess ? (
          <div className="hub-hero-slug">
            <span className="hub-hero-slug-prefix">/i/</span>
            <input
              className="hub-hero-slug-input"
              value={slugDraft}
              onChange={(e) => setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              maxLength={64}
              aria-label={t('invitation.hub.heroSlugLabel')}
            />
            <button
              type="button"
              className="hub-hero-slug-save"
              onClick={saveSlug}
              disabled={busy === 'slug' || slugDraft === slugSaved}
            >
              {busy === 'slug'
                ? t('common.saving')
                : slugDraft === slugSaved
                ? t('invitation.hub.heroSlugSaved')
                : t('invitation.hub.heroSlugSave')}
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="hub-sheet-toast hub-sheet-toast--err" style={{ marginTop: 10 }}>
            {error}
          </p>
        ) : null}
      </div>

      {/* Section list — primary 8 sections per spec */}
      <div className="hub-section-list">
        <HubSection
          icon={<Share2 size={18} aria-hidden="true" />}
          title={t('invitation.hub.sectionShareTitle')}
          description={t('invitation.hub.sectionShareDesc')}
          onClick={() => openSheet('share')}
        />
        <HubSection
          icon={<Palette size={18} aria-hidden="true" />}
          title={t('invitation.hub.sectionDesignTitle')}
          description={t('invitation.hub.sectionDesignDesc')}
          onClick={() => openSheet('design')}
        />
        <HubSection
          icon={<Type size={18} aria-hidden="true" />}
          title={t('invitation.hub.sectionTextsTitle')}
          description={t('invitation.hub.sectionTextsDesc')}
          onClick={() => openSheet('texts')}
        />
        <HubSection
          icon={<Calendar size={18} aria-hidden="true" />}
          title={t('invitation.hub.sectionDatesTitle')}
          description={t('invitation.hub.sectionDatesDesc')}
          onClick={() => openSheet('dates')}
        />
        <HubSection
          icon={<Music size={18} aria-hidden="true" />}
          title={t('invitation.hub.sectionMusicTitle')}
          description={t('invitation.hub.sectionMusicDesc')}
          meta={props.musicUrl ? '🎵 ' + props.musicUrl.split('/').pop() : undefined}
          onClick={() => openSheet('music')}
        />
        <HubSection
          icon={<LayoutTemplate size={18} aria-hidden="true" />}
          title={t('invitation.hub.sectionTemplateTitle')}
          description={t('invitation.hub.sectionTemplateDesc')}
          meta={props.templateKey}
          onClick={() => openSheet('template')}
        />
        <HubSection
          icon={<Bell size={18} aria-hidden="true" />}
          title={t('invitation.hub.sectionRemindersTitle')}
          description={t('invitation.hub.sectionRemindersDesc')}
          meta={t('invitation.hub.remindersSheet.waOnlyLabel')}
          onClick={() => openSheet('reminders')}
        />
        <HubSection
          icon={<UserRoundCheck size={18} aria-hidden="true" />}
          title={t('invitation.hub.sectionGuestsTitle')}
          description={t('invitation.hub.sectionGuestsDesc')}
          meta={
            props.guestCount > 0
              ? `${props.guestCountAttending} / ${props.guestCount}`
              : undefined
          }
          onClick={() => {
            // Reuse the existing editor "guests" panel inside the canvas editor.
            window.location.href = `${props.editHref}&panel=guests`;
          }}
        />

        {/* Secondary zone (Phase 2 spec, items 5, 9, 10). */}
        {props.fullAccess ? (
          <>
            <HubSection
              icon={<UtensilsCrossed size={18} aria-hidden="true" />}
              title={t('invitation.hub.sectionRestaurantTitle')}
              description={t('invitation.hub.sectionRestaurantDesc')}
              onClick={() => void createRestaurantLink()}
              disabled={busy === 'restaurant'}
            />
            <HubSection
              icon={<Archive size={18} aria-hidden="true" />}
              title={t('invitation.hub.sectionArchiveTitle')}
              description={t('invitation.hub.sectionArchiveDesc')}
              negative
              onClick={() => void archive()}
              disabled={busy === 'archive' || props.status === 'archived'}
            />
          </>
        ) : (
          <>
            <div className="hub-locked-card">
              <p className="hub-locked-card-title">
                <Lock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} aria-hidden="true" />
                {t('invitation.hub.lockedTitle')}
              </p>
              <p className="hub-locked-card-desc">{t('invitation.hub.lockedDesc')}</p>
              <button
                type="button"
                className="hub-btn hub-btn--primary"
                style={{ marginTop: 10 }}
                onClick={upgrade}
                disabled={busy === 'upgrade'}
              >
                {t('invitation.hub.lockedCta')} ·{' '}
                {(props.priceKzt || 3990).toLocaleString('ru-RU')} ₸
              </button>
            </div>
            {/* Disabled / locked restaurant card (Phase 2 spec, item 10). */}
            <HubSection
              icon={<UtensilsCrossed size={18} aria-hidden="true" />}
              title={t('invitation.hub.sectionRestaurantTitle')}
              description={t('invitation.hub.lockedDesc')}
              locked
            />
          </>
        )}

        {restaurantUrl ? (
          <div className="hub-url-box" style={{ marginTop: 4 }}>
            <span className="hub-url-text">{restaurantUrl}</span>
            <span
              className="hub-url-copy"
              style={{ background: 'var(--hub-surface-2)', color: 'var(--hub-text)' }}
            >
              {t('invitation.hub.shareSheet.copied')}
            </span>
          </div>
        ) : null}
      </div>

      {/* Sheets */}
      <HubSheetShare
        invitationId={props.invitationId}
        invitationSlug={slugSaved}
        invitationTitle={props.invitationTitle}
        open={activeSheet === 'share'}
        onClose={closeSheet}
      />
      <HubSheetDesign
        open={activeSheet === 'design'}
        onClose={closeSheet}
        editHref={props.editHref}
      />
      <HubSheetTexts
        open={activeSheet === 'texts'}
        onClose={closeSheet}
        invitationId={props.invitationId}
        initial={{
          greeting: props.customText.greeting ?? '',
          intro: props.customText.intro ?? '',
          details: props.customText.details ?? '',
          closing: props.customText.closing ?? '',
          dressCode: props.customText.dressCode ?? '',
          groomName: props.customText.groomName ?? '',
          brideName: props.customText.brideName ?? '',
          eventPlace: props.customText.eventPlace ?? props.eventPlace,
          address: props.customText.address ?? props.address,
        }}
      />
      <HubSheetDates
        open={activeSheet === 'dates'}
        onClose={closeSheet}
        invitationId={props.invitationId}
        initial={{
          eventDate: props.eventDate,
          eventTime: props.eventTime,
          eventPlace: props.eventPlace,
          address: props.address,
          eventTimezone: props.eventTimezone,
        }}
      />
      <HubSheetMusic
        open={activeSheet === 'music'}
        onClose={closeSheet}
        invitationId={props.invitationId}
        initialUrl={props.musicUrl}
      />
      <HubSheetTemplate
        open={activeSheet === 'template'}
        onClose={closeSheet}
        invitationId={props.invitationId}
        currentTemplateKey={props.templateKey}
      />
      <HubSheetReminders
        open={activeSheet === 'reminders'}
        onClose={closeSheet}
        invitationId={props.invitationId}
      />
    </div>
  );
}