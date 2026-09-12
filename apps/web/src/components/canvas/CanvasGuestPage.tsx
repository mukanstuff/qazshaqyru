'use client';

import { useMemo, useState } from 'react';
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
  /**
   * The canvas document, already fetched by the parent.
   *
   * This component used to GET /api/invitations/public/<slug>/canvas itself,
   * which the parent had just finished doing to decide whether to mount it at
   * all — so every guest visit fetched the same document twice, and that
   * handler runs the invitation query plus up to two template queries each
   * time. One load, passed down.
   */
  canvas: unknown;
  /** Whether the viewer owns this invitation — only they can act on the watermark. */
  isOwner?: boolean;
  invitationId?: string | null;
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
  canvas,
  isOwner = false,
  invitationId = null,
  fullAccess = false,
  showWatermark = false,
  guestToken = null,
  openRsvp = true,
}: Props) {
  // Two flags, not one: `envelopeOpen` means the invitation may paint itself,
  // `gateRemoved` means the envelope layer above it is gone. They are separated
  // so the gate can dissolve over a page that is already there — see the
  // handover comment in EnvelopeGate.
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [gateRemoved, setGateRemoved] = useState(false);

  const docWithDefaults = useMemo(() => {
    if (canvas) return parseCanvasOrEmpty(canvas);

    // 2026-07-30 PRODUCT RULE (PRODUCT_MODEL_AND_RULES.md):
    // For fullAccess (paid template order) we MUST render canvas.
    // If we reached here without canvas on a fullAccess invite, it is a
    // data inconsistency — the public canvas route + ensureCanvasDocument
    // should have seeded it. We still render a converted doc (never legacy page).
    // Legacy section-engine is unreachable for paid/fullAccess invites.
    //
    // Non-paid / legacy rows only: the parent already decided NOT to mount this
    // component when there is neither a canvas nor full access.
    return convertLegacyToCanvas({});
  }, [canvas]);

  const autoScrollActive =
    !!docWithDefaults?.autoScroll?.enabled &&
    (!docWithDefaults?.envelopeEnabled || envelopeOpen);
  useAutoScroll(autoScrollActive, docWithDefaults?.autoScroll?.speed);

  if (!docWithDefaults) return null;

  const gateEnabled = Boolean(docWithDefaults.envelopeEnabled);
  const gate = gateEnabled && !gateRemoved ? (
    <EnvelopeGate
      document={docWithDefaults}
      onOpen={() => setEnvelopeOpen(true)}
      onFinished={() => setGateRemoved(true)}
    />
  ) : null;

  /*
   * One tree, two slots, in this order on purpose.
   *
   * The invitation does not mount until the envelope hands over: mounting it
   * early would run every entrance animation behind a closed envelope, and the
   * guest would open it onto a page that had already finished arriving. But the
   * envelope layer has to keep its place in the tree across that change, or
   * React unmounts and remounts it mid-dissolve and the clip starts again — so
   * the page slot renders `false` until it is time, rather than being absent.
   */
  return (
    <>
      {(!gateEnabled || envelopeOpen) && (
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
        removeHref={isOwner && invitationId ? `/invitations/${invitationId}` : undefined}
      />
    </div>
      )}
      {gate}
    </>
  );
}
