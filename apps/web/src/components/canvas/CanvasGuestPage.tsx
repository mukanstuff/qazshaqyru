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
}

type State =
  | { loading: true; doc: null; error: null }
  | { loading: false; doc: InvitationCanvasDocument | null; error: string | null };

/**
 * Canvas guest page: fetches canvas JSON and renders.
 * Used in tandem with a parent that decides whether to mount this or fall
 * back to the legacy LayoutRouter. For now this is a lightweight
 * implementation — a more thorough mobile-responsive version with
 * functional element interactivity comes in later stages.
 */
export function CanvasGuestPage({ slug, shareUrl }: Props) {
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
    // If fetch says no canvas — fallback to a lightweight legacy converter
    // so guests can still see something. In production this path should not
    // be reached because the parent routes legacy invites to LayoutRouter.
    return convertLegacyToCanvas({});
  }, [doc, state.loading]);

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
        <CanvasRenderer document={docWithDefaults} mode="guest" shareUrl={shareUrl} />
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
