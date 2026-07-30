'use client';

import { useEffect, useMemo, useState } from 'react';
import { CanvasRenderer } from './CanvasRenderer';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';
import { parseCanvasOrEmpty } from '@/lib/canvas/validation';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';
import { ShareIcon } from 'lucide-react';

interface Props {
  slug: string;
  shareUrl: string;
  /** When true (from paid template order), never show watermark */
  fullAccess?: boolean;
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
export function CanvasGuestPage({ slug, shareUrl, fullAccess = false }: Props) {
  const [state, setState] = useState<State>({ loading: true, doc: null, error: null });

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
          if (data.id) {
            fetch(`/api/invitations/${data.id}/event`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'open', userAgent: navigator.userAgent }),
            }).catch(() => {});
          }
        }
      } catch (e) {
        if (alive) setState({ loading: false, doc: null, error: 'load_failed' });
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

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

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-us-ivory text-us-ink-muted text-sm">
        Загрузка…
      </div>
    );
  }
  if (state.error === 'no_canvas') return null;
  if (!docWithDefaults) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[600px] relative">
        {/* 
          2026-07-30 PRODUCT MODEL (PRODUCT_MODEL_AND_RULES.md):
          CanvasGuestPage is ONLY mounted for paid/fullAccess or already-canvas invites.
          fullAccess=true ⇒ NEVER watermark, clean public page.
          We explicitly pass fullAccess down so future elements (watermark, upsell)
          inside the canvas tree can guard themselves.
          Legacy watermark logic lives ONLY in section-engine / GuestInvitationPage.
        */}
        <CanvasRenderer 
          document={docWithDefaults} 
          mode="guest" 
          shareUrl={shareUrl} 
          fullAccess={fullAccess}
        />
      </div>
      <FloatingShare shareUrl={shareUrl} />
    </div>
  );
}

function FloatingShare({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  const wa = `https://wa.me/?text=${encodeURIComponent(shareUrl)}`;
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
        title="WhatsApp"
      >
        <ShareIcon className="h-5 w-5" />
      </a>
      <button
        onClick={copy}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-us-accent text-white shadow-lg text-xs"
        title="Скопировать ссылку"
      >
        {copied ? '✓' : '🔗'}
      </button>
    </div>
  );
}
