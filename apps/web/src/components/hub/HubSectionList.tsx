'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Armchair,
  Eye,
  HeartHandshake,
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
import { formatEventDateLine } from '@/lib/shared/kazakh-datetime';
import { HubSection } from '@/components/hub/HubSection';
import { HubSheetShare } from '@/components/hub/HubSheetShare';
import { HubSheetManualPay } from '@/components/hub/HubSheetManualPay';
import { usePendingOrder } from '@/components/hub/usePendingOrder';
import { HubNextStep } from '@/components/hub/HubNextStep';
import { HubPendingPay } from '@/components/hub/HubPendingPay';
import { HubReviewPrompt } from '@/components/hub/HubReviewPrompt';
import { HubSheetDesign } from '@/components/hub/HubSheetDesign';
import { HubSheetTexts } from '@/components/hub/HubSheetTexts';
import { HubSheetDates } from '@/components/hub/HubSheetDates';
import { HubSheetMusic } from '@/components/hub/HubSheetMusic';
import { HubSheetTemplate } from '@/components/hub/HubSheetTemplate';
import { HubSheetReminders } from '@/components/hub/HubSheetReminders';
import { HubSheetGuests } from '@/components/hub/HubSheetGuests';
import { isGuestPending, type HubGuest } from '@/components/hub/useHubGuests';
import { useHubState } from '@/components/hub/useHubState';
import { checkoutInvitationClient } from '@/lib/payments/checkout-client';
import { resolveHostApiError } from '@/lib/guests/host-api-error';
import { PaymentStatusBanner } from '@/components/orders/PaymentStatusBanner';
import { PaymentPendingBanner } from '@/components/dashboard/PaymentPendingBanner';
import { PromoCodeField } from '@/components/orders/PromoCodeField';
import { formatKzt } from '@/lib/shared/format-price';

export interface HubSectionListProps {
  invitationId: string;
  invitationSlug: string;
  invitationTitle: string;
  status: 'draft' | 'published' | 'archived';
  templateKey: string;
  /** Display name of the current template — never the slug. */
  templateLabel: string;
  editHref: string;
  /** Template preview thumbnail — gives the hero a "this is YOUR invitation" postcard. */
  previewImageUrl?: string | null;

  // Hero / metrics
  viewCount: number;
  confirmedSeats: number;
  expectedSeats: number;

  // Text sheet initial values — read from the canvas document's
  // placeholder-bound elements (see deriveHubTextDefaults), since those are
  // the actual text guests see, not a customText column the renderer ignores.
  textDefaults: {
    groomName: string;
    brideName: string;
    greeting: string;
    dressCode: string;
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

  // Guests stat (for the "Гости" section meta line) + full roster for the sheet
  guestCount: number;
  guestCountAttending: number;
  guests: HubGuest[];

  // Pricing / plan
  fullAccess: boolean;
  priceKzt: number;
  /** Whether answering from the plain public link is currently allowed. */
  openRsvp: boolean;

  // Post-publish / payment banners (replaces the old full-screen PostPublishShareScreen)
  showPublishedBanner?: boolean;
  showPaymentFailed?: boolean;
  showPaymentInvalid?: boolean;
  showPaymentPending?: boolean;
  /** True once the event date is in the past — gates the review ask. */
  eventPassed?: boolean;
  /** True when this invitation already carries a review. */
  alreadyReviewed?: boolean;
  /** Prefills the review signature. */
  ownerDisplayName?: string;
}

/**
 * The single owner-facing hub for an invitation: card list of every primary
 * action, each opening a HubSheet. Guests, share, texts, dates, music,
 * template, reminders, restaurant and archive all live here — no separate
 * legacy dashboard rendered alongside it.
 */
export function HubSectionList(props: HubSectionListProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { activeSheet, openSheet, closeSheet } = useHubState();
  const basePath = `/invitations/${props.invitationId}`;

  /*
   * Numbers for the section badges.
   *
   * Counted here rather than passed in, because both are derived from data the
   * hub already holds. Guests still owing an answer is the one that matters
   * most: it is literally the size of the job the reminders sheet exists to do.
   */
  const pendingGuestCount = useMemo(
    () => props.guests.filter(isGuestPending).length,
    [props.guests],
  );
  const editableTextCount = useMemo(
    () => Object.values(props.textDefaults).filter((v) => typeof v === 'string' && v.trim().length > 0).length,
    [props.textDefaults],
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thumbBroken, setThumbBroken] = useState(false);
  const thumbImgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // A same-URL image that already 404'd earlier this session can finish
    // loading (from the browser's negative cache) before React attaches the
    // onError handler, so the synthetic event never fires. Catch that case
    // once on mount instead of leaving a broken-image icon in the hero.
    const img = thumbImgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setThumbBroken(true);
  }, [props.previewImageUrl]);

  // Auto-open the share sheet right after publishing, instead of the old
  // full-screen PostPublishShareScreen replacing the whole hub.
  useEffect(() => {
    if (props.showPublishedBanner) openSheet('share');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.showPublishedBanner]);

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
  // 'manual' means paymentUrl is the site owner's own free Kaspi Pay link
  // (pay.kaspi.kz/pay/...) — the customer types the amount in themselves and
  // confirms over WhatsApp, there's no hosted checkout page or webhook to
  // redirect back from, so it needs its own panel instead of a blind
  // window.location.href navigation away from the site.
  const [manualPay, setManualPay] = useState<{ orderId: string; paymentUrl: string } | null>(null);
  /** Validated preview only — the server decides again at checkout. */
  const [promoCode, setPromoCode] = useState<string | null>(null);
  // Only meaningful while the invitation is still unpaid.
  const pendingOrder = usePendingOrder(props.invitationId, !props.fullAccess);
  const upgrade = useCallback(async () => {
    setBusy('upgrade');
    setError(null);
    try {
      const checkout = await checkoutInvitationClient(props.invitationId, { intent: 'pay', promoCode });
      if (checkout.manual && checkout.paymentUrl && checkout.orderId) {
        setManualPay({ orderId: checkout.orderId, paymentUrl: checkout.paymentUrl });
        return;
      }
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
  }, [promoCode, props.invitationId, t]);

  // ── Free-tier publish (no payment, watermarked) ────────────────────────
  const publishFree = useCallback(async () => {
    setBusy('publishFree');
    setError(null);
    try {
      await checkoutInvitationClient(props.invitationId, { intent: 'publish' });
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
      // POST /api/invitations/[id]/archive does not exist — there is no such
      // route file, so this button answered 404 and the invitation stayed put.
      // Archiving lives on DELETE of the invitation itself (a soft delete:
      // status → archived, publishedAt cleared).
      const res = await fetch(`/api/invitations/${props.invitationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(resolveHostApiError(data, t, 'invitation.hub.error'));
      }
      // Archived invitations are filtered out of the hub and the dashboard, so
      // reloading this page would land on a redirect. Go to the list directly.
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('invitation.hub.error'));
    } finally {
      setBusy(null);
    }
  }, [props.invitationId, router, t]);

  // ── Derived display ───────────────────────────────────────────────────
  // Whether the /i/[slug] link is actually live for anyone but the owner.
  const canShare = props.status === 'published';

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

  // The event line the owner actually cares about, replacing the old
  // "● Жоба" status chip. Status is already obvious from which action the
  // hero offers (pay / publish / share), so restating it as a badge was
  // decoration, not information.
  const whenWhere = useMemo(() => {
    const parts: string[] = [];
    if (props.eventDate) {
      const d = new Date(`${props.eventDate}T00:00:00`);
      if (!Number.isNaN(d.getTime())) {
        parts.push(formatEventDateLine(d, locale));
      }
    }
    if (props.eventTime) parts.push(props.eventTime);
    if (props.eventPlace) parts.push(props.eventPlace);
    return parts.join(' · ');
  }, [props.eventDate, props.eventTime, props.eventPlace, locale]);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="hub-shell">
      {props.showPublishedBanner ? <PaymentStatusBanner variant="published" /> : null}
      {!props.showPublishedBanner && props.showPaymentFailed ? (
        <PaymentStatusBanner variant="failed" />
      ) : null}
      {!props.showPublishedBanner && props.showPaymentInvalid ? (
        <PaymentStatusBanner variant="invalid" />
      ) : null}
      {props.showPaymentPending ? <PaymentPendingBanner initialPending alwaysPoll /> : null}

      {/* Hero */}
      <div className="hub-hero">
        <div className="hub-hero-top">
          {props.previewImageUrl && !thumbBroken ? (
            <div className="hub-hero-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={thumbImgRef}
                src={props.previewImageUrl}
                alt=""
                onError={() => setThumbBroken(true)}
              />
            </div>
          ) : null}
          <div className="hub-hero-meta">
            <h1 className="hub-hero-title">{props.invitationTitle}</h1>
            {whenWhere ? <p className="hub-hero-when">{whenWhere}</p> : null}
            <p className="hub-hero-sub">{desc}</p>
          </div>
        </div>

        {/* Stats are meaningful only once the invitation is live. On a draft
            both counters are structurally always zero (the public page 404s
            and no guest can respond), so rendering two big "0" cards was
            noise dressed up as a dashboard. */}
        {canShare ? (
          <div className="hub-hero-stats">
            <div className="hub-hero-stat">
              <span className="hub-hero-stat-icon">
                <Eye size={13} aria-hidden="true" />
              </span>
              <div className="hub-hero-stat-label">{t('invitation.hub.heroViews')}</div>
              <div className="hub-hero-stat-value">{props.viewCount}</div>
            </div>
            <div className="hub-hero-stat hub-hero-stat--accent">
              <span className="hub-hero-stat-icon">
                <HeartHandshake size={13} aria-hidden="true" />
              </span>
              <div className="hub-hero-stat-label">{t('invitation.hub.heroAttendance')}</div>
              <div className="hub-hero-stat-value">{props.confirmedSeats}</div>
              <div className="hub-hero-stat-hint">{attendanceHint}</div>
            </div>
          </div>
        ) : null}

        {/* The public /i/[slug] link 404s for anyone but the owner until the
            invitation is actually published (see assertCanPublishInvitation
            — publishing itself requires payment). Sharing it earlier would
            hand guests a dead link, so the CTA guides the owner toward
            whichever step unlocks it instead of pretending it's ready. */}
        {canShare ? (
          <button type="button" className="hub-hero-cta" onClick={() => openSheet('share')}>
            <Share2 size={16} aria-hidden="true" />
            {t('invitation.hub.sectionShareTitle')}
          </button>
        ) : props.fullAccess ? (
          <Link href={props.editHref} className="hub-hero-cta">
            <Palette size={16} aria-hidden="true" />
            {t('invitation.hub.publishCta')}
          </Link>
        ) : pendingOrder ? (
          /* A payment is already in flight. Showing the plain "Оплатить" button
             here invites a second payment for the same invitation. */
          <HubPendingPay
            orderId={pendingOrder.id}
            onReopen={upgrade}
            busy={busy === 'upgrade'}
          />
        ) : (
          <div className="hub-hero-cta-group">
            <button
              type="button"
              className="hub-hero-cta"
              onClick={upgrade}
              disabled={busy === 'upgrade' || busy === 'publishFree'}
            >
              <Lock size={16} aria-hidden="true" />
              {t('invitation.hub.lockedCta')} · {formatKzt(props.priceKzt || 3990)} ₸
            </button>
            <button
              type="button"
              className="hub-hero-cta-secondary"
              onClick={publishFree}
              disabled={busy === 'upgrade' || busy === 'publishFree'}
            >
              {t('invitation.hub.publishFreeCta')}
            </button>
            {/* The watermark used to be crammed into the button label —
                "Опубликовать бесплатно (с водяным знаком)" — which reads as a
                warning on the control itself. Same fact, stated once, next to
                the button instead of inside it. */}
            <p className="hub-hero-cta-note">{t('invitation.hub.publishFreeNote')}</p>
            <PromoCodeField invitationId={props.invitationId} onApplied={setPromoCode} />
          </div>
        )}

        {/* Inline slug editor. Locked behind fullAccess. */}
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

      <HubNextStep
        status={props.status}
        guests={props.guests}
        guestCount={props.guestCount}
        onPublish={props.fullAccess ? publishFree : upgrade}
        onOpenGuests={() => openSheet('guests')}
        onOpenReminders={() => openSheet('reminders')}
        onOpenSeating={() => router.push(`${basePath}/seating`)}
      />

      {/* Renders itself only after the event, and only once. */}
      <HubReviewPrompt
        invitationId={props.invitationId}
        defaultAuthorName={props.ownerDisplayName ?? ''}
        eventPassed={Boolean(props.eventPassed)}
        alreadyReviewed={Boolean(props.alreadyReviewed)}
      />

      {/* Content group — everything about how the invitation itself looks */}
      <div className="hub-section-group">
        <p className="hub-section-group-label">{t('invitation.hub.groupContent')}</p>
        <div className="hub-section-list">
          <HubSection
            icon={<Palette size={18} aria-hidden="true" />}
            title={t('invitation.hub.sectionDesignTitle')}
            description={t('invitation.hub.sectionDesignDesc')}
            onClick={() => openSheet('design')}
          />
          <HubSection
            icon={<Type size={18} aria-hidden="true" />}
            title={t('invitation.hub.sectionTextsTitle')}
            count={editableTextCount}
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
            meta={props.templateLabel}
            onClick={() => openSheet('template')}
          />
        </div>
      </div>

      {/* Guests group — everything about talking to and tracking guests */}
      <div className="hub-section-group">
        <p className="hub-section-group-label">{t('invitation.hub.groupGuests')}</p>
        <div className="hub-section-list">
          <HubSection
            icon={<UserRoundCheck size={18} aria-hidden="true" />}
            title={t('invitation.hub.sectionGuestsTitle')}
            count={props.guestCount}
            description={
              props.fullAccess
                ? t('invitation.hub.sectionGuestsDesc')
                : t('invitation.hub.sectionGuestsLockedDesc')
            }
            meta={
              props.guestCount > 0
                ? `${props.guestCountAttending} / ${props.guestCount}`
                : undefined
            }
            locked={!props.fullAccess}
            onClick={props.fullAccess ? () => openSheet('guests') : undefined}
          />
          <HubSection
            icon={<Bell size={18} aria-hidden="true" />}
            title={t('invitation.hub.sectionRemindersTitle')}
            count={pendingGuestCount}
            description={
              props.fullAccess
                ? t('invitation.hub.sectionRemindersDesc')
                : t('invitation.hub.sectionRemindersLockedDesc')
            }
            meta={props.fullAccess ? t('invitation.hub.remindersSheet.waOnlyLabel') : undefined}
            locked={!props.fullAccess}
            onClick={props.fullAccess ? () => openSheet('reminders') : undefined}
          />
          <HubSection
            icon={<Armchair size={18} aria-hidden="true" />}
            title={t('invitation.hub.sectionSeatingTitle')}
            description={
              props.fullAccess
                ? t('invitation.hub.sectionSeatingDesc')
                : t('invitation.hub.sectionSeatingLockedDesc')
            }
            locked={!props.fullAccess}
            onClick={props.fullAccess ? () => router.push(`${basePath}/seating`) : undefined}
          />
          <HubSection
            icon={<Share2 size={18} aria-hidden="true" />}
            title={t('invitation.hub.sectionShareTitle')}
            /* Never locked. Before publication it opens the preview rather
               than the link; see HubSheetShare. This row is the answer to
               "what am I paying for", so locking it was backwards. */
            description={
              canShare
                ? t('invitation.hub.sectionShareDesc')
                : t('invitation.hub.sectionSharePreviewDesc')
            }
            onClick={() => openSheet('share')}
          />

          {props.fullAccess ? (
            <HubSection
            icon={<UtensilsCrossed size={18} aria-hidden="true" />}
              title={t('invitation.hub.sectionRestaurantTitle')}
              description={t('invitation.hub.sectionRestaurantDesc')}
              onClick={() => void createRestaurantLink()}
              disabled={busy === 'restaurant'}
            />
          ) : (
            /*
             * The venue row used to repeat the long "Оплатите публикацию, чтобы
             * пользоваться всеми возможностями." as its own description, sitting
             * directly under an upsell card that had already said it — after
             * three rows that each said "Откроется после оплаты". Five
             * restatements of one fact in one screen. The row now reads like
             * its locked siblings; the upsell card below says it once.
             */
            <HubSection
              icon={<UtensilsCrossed size={18} aria-hidden="true" />}
              title={t('invitation.hub.sectionRestaurantTitle')}
              description={t('invitation.hub.sectionRestaurantLockedDesc')}
              locked
            />
          )}

          {!props.fullAccess ? (
            <div className="hub-locked-card">
              <p className="hub-locked-card-title">
                <Lock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} aria-hidden="true" />
                {t('invitation.hub.lockedTitle')}
              </p>
              <p className="hub-locked-card-desc">{t('invitation.hub.lockedDesc')}</p>
              {/*
                A payment in flight replaces the price here too.
                Publishing is free, so an invitation can be published and unpaid
                at the same time — and in that state the hero shows the share
                button, not the pending notice, so this card was the only thing
                on the screen talking about money and it kept asking for it.
              */}
              {pendingOrder ? (
                <HubPendingPay
                  orderId={pendingOrder.id}
                  onReopen={upgrade}
                  busy={busy === 'upgrade'}
                />
              ) : (
                <button
                  type="button"
                  className="hub-btn hub-btn--primary"
                  style={{ marginTop: 10 }}
                  onClick={upgrade}
                  disabled={busy === 'upgrade'}
                >
                  {t('invitation.hub.lockedCta')} · {formatKzt(props.priceKzt || 3990)} ₸
                </button>
              )}
            </div>
          ) : null}

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

          {/* Not gated on fullAccess any more. Archiving is how you get rid of
              an invitation, and the ones people most want to get rid of are
              exactly the unpaid drafts — so hiding it behind payment left junk
              drafts on the dashboard with no way to remove them at all. */}
          <HubSection
            icon={<Archive size={18} aria-hidden="true" />}
            title={t('invitation.hub.sectionArchiveTitle')}
            description={t('invitation.hub.sectionArchiveDesc')}
            negative
            onClick={() => void archive()}
            disabled={busy === 'archive' || props.status === 'archived'}
          />
        </div>
      </div>

      {/* Sheets */}
      {manualPay ? (
        <HubSheetManualPay
          open={!!manualPay}
          onClose={() => setManualPay(null)}
          orderId={manualPay.orderId}
          paymentUrl={manualPay.paymentUrl}
          invitationTitle={props.invitationTitle}
          amountKzt={props.priceKzt || 3990}
        />
      ) : null}
      <HubSheetShare
        invitationId={props.invitationId}
        invitationSlug={slugSaved}
        invitationTitle={props.invitationTitle}
        published={canShare}
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
        initial={props.textDefaults}
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
      <HubSheetGuests
        open={activeSheet === 'guests'}
        onClose={closeSheet}
        invitationId={props.invitationId}
        invitationSlug={slugSaved}
        initialGuests={props.guests}
        openRsvp={props.openRsvp}
      />
    </div>
  );
}