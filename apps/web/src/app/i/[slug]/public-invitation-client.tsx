'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/shared/ornaments';
import { useI18n } from '@/i18n';
import { CanvasGuestPage } from '@/components/canvas/CanvasGuestPage';

/**
 * 'legacy' is gone. It routed to the section-engine renderer
 * (components/invitation-layouts/), whose only reachable output for a guest was
 * PlaceholderLayout — a bare shell whose own body text reads "визуальный дизайн
 * в разработке". Every failure path in this component fell into it, so a guest
 * of a paying customer got that page instead of an honest error. Canvas is the
 * only renderer; anything it cannot show is an error and now says so.
 *
 * The `/i/demo` branch is gone too. It fetched a catalogue template through
 * /api/templates/[slug]/preview and rendered it as a fake invitation, with
 * OpenGraph metadata for an invented couple ("Асет & Айым", "Ресторан
 * «Жарық»"). Nothing has linked to it since the landing page's demo links were
 * removed, so it was an unreachable route carrying a made-up wedding, a demo
 * banner, a dismissal flag in localStorage and its own API endpoint.
 */
type RenderMode = 'loading' | 'canvas' | 'error';

export default function PublicInvitationClient({
  slug,
  guestToken,
}: {
  slug: string;
  guestToken: string | null;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<RenderMode>('loading');
  // 2026-07-30: store fullAccess from canvas API so we can pass it at render time
  const [fullAccessFromApi, setFullAccessFromApi] = useState(false);
  const [showWatermarkFromApi, setShowWatermarkFromApi] = useState(false);
  // Whether a guest without a personal ?guest= token may answer at all.
  const [openRsvpFromApi, setOpenRsvpFromApi] = useState(true);
  // The document itself, handed to CanvasGuestPage so it does not re-request
  // what this component has just downloaded.
  const [canvas, setCanvas] = useState<unknown>(null);
  const [owner, setOwner] = useState<{ isOwner: boolean; id: string | null }>({ isOwner: false, id: null });
  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/i/${slug}` : `/i/${slug}`;

  useEffect(() => {
    // === 2026-07-30 + NEXT ===
    // Canvas is the canonical renderer for all new/paid invitations.
    // We prefer canvas aggressively:
    // - if canvas doc exists, or
    // - if fullAccess (paid template order) is true (the public canvas route seeds it)
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/invitations/public/${encodeURIComponent(slug)}/canvas`, {
          credentials: 'same-origin',
        });
        if (!res.ok) {
          if (alive) setMode('error');
          return;
        }
        const data = await res.json();

        const hasCanvas = !!data.canvas;
        const isFullAccess = !!data.fullAccess;

        if (alive) {
          // 2026-07-30 PRODUCT RULE: canvas OR fullAccess (paid template) → canvas renderer (clean, no watermark).
          // Legacy only for ancient unpaid rows without canvas ever seeded.
          if (hasCanvas || isFullAccess) {
            setCanvas(data.canvas ?? null);
            setOwner({ isOwner: !!data.isOwner, id: typeof data.id === 'string' ? data.id : null });
            setFullAccessFromApi(isFullAccess);
            setShowWatermarkFromApi(!!data.showWatermark);
            setOpenRsvpFromApi(data.openRsvp !== false);
            setMode('canvas');
          } else {
            setMode('error');
          }
        }
      } catch {
        if (alive) setMode('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    void fetch(`/api/invitations/public/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
    }).catch(() => {});
  }, [slug]);

  return (
    <div className="relative min-h-screen">
      {/*
        The QazShaqyru badge is our branding sitting in the corner of somebody
        else's wedding invitation. That is exactly what a customer pays to
        remove, so it is shown on free publishes only — the same rule the
        watermark strip follows. It used to be unconditional, so paying
        customers kept it.
      */}
      {!fullAccessFromApi && (
        <div className="pointer-events-none fixed left-4 top-4 z-50">
          <Link
            href="/"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-us-accent/90 text-white shadow-us-sm backdrop-blur-sm transition-opacity hover:opacity-90"
            title="QazShaqyru"
          >
            <LogoMark size={18} />
          </Link>
        </div>
      )}

      {mode === 'loading' && <PublicLoadingHold label={t('public.loading')} />}
      {mode === 'error' && (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-us-ivory px-6 text-center">
          <LogoMark size={28} />
          <p className="font-display text-lg text-us-ink">{t('public.errors.notAvailable')}</p>
          <p className="max-w-sm font-body text-sm text-us-ink-muted">
            {t('public.errors.notFound')}
          </p>
        </div>
      )}
      {mode === 'canvas' && (
        <CanvasGuestPage
          slug={slug}
          shareUrl={shareUrl}
          canvas={canvas}
          isOwner={owner.isOwner}
          invitationId={owner.id}
          fullAccess={fullAccessFromApi}
          showWatermark={showWatermarkFromApi}
          guestToken={guestToken}
          openRsvp={openRsvpFromApi}
        />
      )}
    </div>
  );
}

/**
 * What a guest sees while the invitation is being fetched.
 *
 * This used to be a pulsing 420x320 rounded card with a hero block and four
 * grey bars, and no invitation in this product has ever looked like that: they
 * are full-bleed, 390px wide, and most of them open behind an envelope. A
 * skeleton is a promise about the shape of what is coming, so a wrong one is
 * worse than none — and this was the first thing a guest saw of somebody's
 * wedding.
 *
 * What is left is the paper the app is made of and the mark, and even that
 * waits 250ms: most loads finish inside that, and a loading state that flashes
 * for two frames is noise on its own.
 */
function PublicLoadingHold({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 250);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-us-ivory"
      aria-busy
      aria-label={label}
    >
      <span
        className={`text-us-accent transition-opacity duration-700 ${visible ? 'opacity-60' : 'opacity-0'}`}
        style={{ animation: visible ? 'publicHoldBreath 2.2s ease-in-out infinite' : undefined }}
      >
        <LogoMark size={34} />
      </span>
      <style>{`
        @keyframes publicHoldBreath {
          0%, 100% { opacity: 0.32; }
          50% { opacity: 0.72; }
        }
      `}</style>
    </div>
  );
}
