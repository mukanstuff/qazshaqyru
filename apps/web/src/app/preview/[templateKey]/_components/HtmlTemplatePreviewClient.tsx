'use client';

/**
 * HtmlTemplatePreviewClient — client wrapper for the HTML template preview.
 *
 * Fetches template data and renders the phone frame + "Редактировать" button.
 * When "Редактировать" is clicked, navigates to /invitations/new to create a draft
 * then opens the full split-panel editor.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/templates/html-engine/types';

interface Props {
  templateSlug: string;
  templateTitle: string;
  backHref: string;
  locale: Locale;
  html: string;
}

export function HtmlTemplatePreviewClient({
  templateSlug,
  templateTitle,
  backHref,
  locale,
  html,
}: Props) {
  const router = useRouter();
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  // Render HTML into blob URL for iframe
  useEffect(() => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setIframeSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [html]);

  const handleEdit = useCallback(() => {
    router.push(`/invitations/new?template=${encodeURIComponent(templateSlug)}`);
  }, [router, templateSlug]);

  return (
    <div className="relative h-screen overflow-hidden" style={{ background: '#1c1c1e' }}>
      {/* Back button */}
      <Link
        href={backHref}
        className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        В каталог
      </Link>

      {/* Title */}
      <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
        <p className="truncate rounded-full bg-black/40 px-4 py-1.5 font-body text-xs text-white/70">
          {templateTitle}
        </p>
      </div>

      {/* Phone frame */}
      <div
        className="flex h-full items-center justify-center overflow-hidden"
        style={{ background: '#1c1c1e' }}
      >
        {iframeSrc ? (
          <div
            style={{
              background: '#0d0d0d',
              borderRadius: '54px',
              padding: '12px',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 96px rgba(0,0,0,0.9)',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '390px',
                height: '844px',
                borderRadius: '38px',
                background: '#000',
                overflow: 'hidden',
              }}
            >
              <iframe
                src={iframeSrc}
                title="Приглашение"
                allow="fullscreen"
                sandbox="allow-same-origin allow-scripts allow-forms"
                style={{ display: 'block', width: '100%', height: '100%', border: 'none' }}
              />
              {/* Notch */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '126px',
                  height: '34px',
                  background: '#0d0d0d',
                  borderRadius: '0 0 20px 20px',
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-[844px] w-[390px] items-center justify-center">
            <p className="text-white/40">Загрузка…</p>
          </div>
        )}
      </div>

      {/* Edit button */}
      <button
        type="button"
        onClick={handleEdit}
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-7 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Редактировать
      </button>
    </div>
  );
}
