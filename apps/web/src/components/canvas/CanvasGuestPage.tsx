'use client';

import { useEffect, useMemo, useState } from 'react';
import { CanvasRenderer } from './CanvasRenderer';
import { EnvelopeGate } from './EnvelopeGate';
import { useAutoScroll } from './useAutoScroll';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';
import { parseCanvasOrEmpty } from '@/lib/canvas/validation';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';
import { PublicPublishWatermark } from '@/components/invitation-layouts/PublicPublishWatermark';
import { GuestActionBar } from '@/components/canvas/GuestActionBar';

interface Props {
  slug: string;
  shareUrl: string;
  /** When true (from paid template order), never show watermark */
  fullAccess?: boolean;
  /** Free-tier publish (unpaid): show the "remove watermark" banner. */
  showWatermark?: boolean;
  /** Personal guest link token (?guest=...) — routes the RSVP form to the
   *  token-identified endpoint instead of the open/public one. */
  guestToken?: string | null;
  /** False when this invitation only accepts answers via personal links. */
  openRsvp?: boolean;
}

type State =
  | { loading: true; doc: null; error: null }
  | { loading: false; doc: InvitationCanvasDocument | null; error: string | null };

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CANVAS GUEST PAGE — CANONICAL FOR PAID / FULL ACCESS INVITATIONS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PRODUCT RULE (see PRODUCT_MODEL_AND_RULES.md + PRODUCT_DECISIONS_2026-07-30.md + AUDIT_ISSUES.md):
 *   Pay Template.priceKzt once → fullAccess = true.
 *   → NO watermark, full editor, all guest ops, clean public page.
 *   Canvas is the ONLY renderer for new + paid invitations.
 * 
 * Legacy (InvitationLayoutRouter + ornate corners + section engine) is a
 * migration fallback ONLY for ancient rows that predate canvas seeding.
 * 
 * fullAccess prop (passed from parent when hasPaidOrder or canvas exists)
 * guarantees this page NEVER shows watermark or upsell.
 * 
 * Parent (public-invitation-client) aggressively chooses canvas for:
 *   hasCanvas || fullAccess
 */
export function CanvasGuestPage({
  slug,
  shareUrl,
  fullAccess = false,
  showWatermark = false,
  guestToken = null,
  openRsvp = true,
}: Props) {
  const [state, setState] = useState<State>({ loading: true, doc: null, error: null });
  // Only the owner can actually do anything about the watermark — a guest
  // clicking it used to land on their own dashboard with a dead `?pay=`
  // param that nothing read, for an invitation that isn't even theirs.
  const [owner, setOwner] = useState<{ isOwner: boolean; invitationId: string | null }>({
    isOwner: false,
    invitationId: null,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/invitations/public/${encodeURIComponent(slug)}/canvas`, {
          credentials: 'same-origin',
        });
        if (!res.ok) {
          if (alive) setState({ loading: false, doc: null, error: 'load_failed' });
          return;
        }
        const data = await res.json();
        if (!data.canvas) {
          if (alive) setState({ loading: false, doc: null, error: 'no_canvas' });
          return;
        }
        const doc = parseCanvasOrEmpty(data.canvas);
        if (alive) {
          setState({ loading: false, doc, error: null });
          setOwner({ isOwner: !!data.isOwner, invitationId: typeof data.id === 'string' ? data.id : null });
          // View tracking lives solely in public-invitation-client's mount
          // effect (POST /api/invitations/public/{slug}/view) — it fires
          // once regardless of which renderer (canvas or legacy) ends up
          // mounting. This used to *also* POST /api/invitations/{id}/event
          // here, so every real visit was counted twice before either the
          // owner-exclusion or the per-visitor dedup even had a chance to
          // matter.
        }
      } catch (e) {
        if (alive) setState({ loading: false, doc: null, error: 'load_failed' });
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const [envelopeOpen, setEnvelopeOpen] = useState(false);

  const doc = state.doc;
  const docWithDefaults = useMemo(() => {
    if (doc) return doc;
    if (state.loading) return null;

    // 2026-07-30 PRODUCT RULE (PRODUCT_MODEL_AND_RULES.md):
    // For fullAccess (paid template order) we MUST render canvas.
    // If we reached here without canvas on a fullAccess invite, it is a
    // data inconsistency — the public canvas route + ensureCanvasDocument
    // should have seeded it. We still render a converted doc (never legacy page).
    // Legacy section-engine is unreachable for paid/fullAccess invites.
    if (fullAccess) {
      // paid → canvas always
      return convertLegacyToCanvas({}); // bridge only; should be seeded
    }

    // Non-paid / legacy rows only: fall back for ancient data.
    // Parent (public-invitation-client) already decided NOT to mount CanvasGuestPage
    // when !hasCanvas && !fullAccess.
    return convertLegacyToCanvas({});
  }, [doc, state.loading, fullAccess]);

  const autoScrollActive =
    !!docWithDefaults?.autoScroll?.enabled &&
    (!docWithDefaults?.envelopeEnabled || envelopeOpen);
  useAutoScroll(autoScrollActive, docWithDefaults?.autoScroll?.speed);

  if (state.loading) {
    // No text. The invitation's own language is not known until its document
    // arrives, and this screen was showing a hardcoded Russian "Загрузка…" to
    // every guest of every Kazakh invitation. A spinner says the same thing in
    // no language at all.
    return (
      <div className="flex min-h-screen items-center justify-center bg-us-ivory">
        <span
          className="h-7 w-7 animate-spin rounded-full border-2 border-us-border border-t-us-accent"
          role="status"
          aria-label="…"
        />
      </div>
    );
  }
  if (state.error === 'no_canvas') return null;
  if (!docWithDefaults) return null;

  if (docWithDefaults.envelopeEnabled && !envelopeOpen) {
    return (
      <EnvelopeGate document={docWithDefaults} onOpen={() => setEnvelopeOpen(true)} />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[600px] relative">
        {/*
          fullAccess=true ⇒ paid, no watermark. Unpaid (free-tier) publishes
          show PublicPublishWatermark below, driven by `showWatermark` from
          the public canvas API (shouldShowPublishWatermark).
        */}
        <CanvasRenderer
          document={docWithDefaults}
          mode="guest"
          // Renderer-supplied labels (RSVP buttons, countdown units, calendar
          // month/weekday names) must match the language the invitation is
          // actually written in. Without this the renderer fell back to `ru`
          // for every invitation, so a fully Kazakh design still rendered
          // "ПН ВТ СР" in its calendar.
          locale={docWithDefaults.locale ?? 'ru'}
          shareUrl={shareUrl}
          slug={slug}
          fullAccess={fullAccess}
          guestToken={guestToken}
          openRsvp={openRsvp}
        />
      </div>
      {/*
        Replaces <FloatingShare/>: that stack offered a guest only "share this"
        and "copy the link" — the owner's actions — while the things a guest
        came to do (reply, get directions, save the date) had no affordance at
        all and the reply block sat at the bottom of a long scroll.
      */}
      <GuestActionBar
        document={docWithDefaults}
        shareUrl={shareUrl}
        slug={slug}
        locale={docWithDefaults.locale ?? 'ru'}
        canRsvp={Boolean(guestToken) || openRsvp}
      />
      <PublicPublishWatermark
        show={showWatermark}
        locale={docWithDefaults.locale ?? 'ru'}
        removeHref={owner.isOwner && owner.invitationId ? `/invitations/${owner.invitationId}` : undefined}
      />
    </div>
  );
}
