'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { LogoMark } from '@/components/shared/ornaments';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { DEFAULT_QUICK_TEMPLATE, quickWizardHref } from '@/lib/shared/quick-wizard-url';
import { hasSeenEnvelope } from '@/components/invitation-layouts/guest-mobile';
import { GuestInvitationPage } from './GuestInvitationPage';
import { CanvasGuestPage } from '@/components/canvas/CanvasGuestPage';

type RenderMode = 'loading' | 'canvas' | 'legacy' | 'error';

export default function PublicInvitationClient({
  slug,
  guestToken,
  familyToken,
  demoLayout,
  embedPreview = false,
}: {
  slug: string;
  guestToken: string | null;
  familyToken: string | null;
  demoLayout?: string;
  /** Hide demo chrome when embedded in template preview modal */
  embedPreview?: boolean;
}) {
  const { t } = useI18n();
  const isDemo = slug === 'demo';
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [mode, setMode] = useState<RenderMode>('loading');
  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/i/${slug}` : `/i/${slug}`;

  const showDemoBanner =
    isDemo && !embedPreview && !bannerDismissed && envelopeOpened;
  const quickHref = quickWizardHref(demoLayout || DEFAULT_QUICK_TEMPLATE);

  useEffect(() => {
    if (!isDemo) return;
    try {
      if (window.localStorage.getItem('us-demo-banner-dismissed') === '1') {
        setBannerDismissed(true);
      }
      if (hasSeenEnvelope(slug)) {
        setEnvelopeOpened(true);
      }
    } catch {
      /* non-critical */
    }
    const onOpen = () => setEnvelopeOpened(true);
    window.addEventListener('qazshaqyru:envelope-open', onOpen);
    return () => window.removeEventListener('qazshaqyru:envelope-open', onOpen);
  }, [isDemo, slug]);

  useEffect(() => {
    if (isDemo) {
      // Demo keeps legacy for historical screenshots / marketing
      setMode('legacy');
      return;
    }

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
          if (alive) setMode('legacy');
          return;
        }
        const data = await res.json();

        const hasCanvas = !!data.canvas;
        const isFullAccess = !!data.fullAccess;

        if (alive) {
          // Paid or has canvas document → canvas mode (clean, no watermark)
          if (hasCanvas || isFullAccess) {
            setMode('canvas');
          } else {
            setMode('legacy');
          }
        }
      } catch {
        if (alive) setMode('legacy');
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, isDemo]);

  useEffect(() => {
    if (isDemo) return;
    void fetch(`/api/invitations/public/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
    }).catch(() => {});
  }, [slug, isDemo]);

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      window.localStorage.setItem('us-demo-banner-dismissed', '1');
    } catch {
      /* non-critical */
    }
  };

  return (
    <div className="relative min-h-screen">
      {!isDemo && (
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

      {showDemoBanner && (
        <div className="sticky top-0 z-40 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]" data-testid="demo-cta-banner">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-2 rounded-full border border-[color-mix(in_srgb,#C4954A_35%,transparent)] bg-[color-mix(in_srgb,#faf6ef_88%,#C4954A_12%)] px-3 py-2 shadow-us-sm backdrop-blur-sm sm:px-4">
            <p className="min-w-0 flex-1 truncate font-body text-xs leading-snug text-[#3d3428] sm:text-sm">
              {t('public.demoBannerShort')}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-8 min-h-8 shrink-0 rounded-full border-[#C4954A]/50 bg-transparent px-2.5 text-xs text-[#3d3428] hover:bg-[#C4954A]/10"
              asChild
            >
              <Link href={quickHref}>
                {t('public.demoBannerCta')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <button
              type="button"
              onClick={dismissBanner}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#3d3428]/70 transition-colors hover:bg-[#3d3428]/8 hover:text-[#3d3428]"
              aria-label={t('common.close')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {mode === 'loading' && (
        <div className="min-h-screen flex items-center justify-center text-us-ink-muted text-sm" aria-busy>
          …
        </div>
      )}
      {mode === 'legacy' && (
        <GuestInvitationPage
          slug={slug}
          guestToken={guestToken}
          familyToken={familyToken}
          demoLayout={demoLayout}
          suppressGuestChrome={embedPreview}
        />
      )}
      {mode === 'canvas' && (
        <CanvasGuestPage 
          slug={slug} 
          shareUrl={shareUrl} 
          fullAccess={true} // parent already decided based on fullAccess or canvas presence for paid invites
        />
      )}
    </div>
  );
}
