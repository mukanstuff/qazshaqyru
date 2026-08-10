'use client';

import Link from 'next/link';
import { HtmlTemplateFrame } from './HtmlTemplateFrame';
import type { Locale } from '@/lib/templates/html-engine/types';

interface PreviewFrameProps {
  templateSlug: string;
  backHref: string;
  locale: Locale;
  html: string;
  onEdit: () => void;
}

export function PreviewFrame({
  backHref,
  onEdit,
}: PreviewFrameProps) {
  return (
    <div className="relative h-screen overflow-hidden" style={{ background: '#1c1c1e' }}>
      {/* Top-left: back to catalog */}
      <Link
        href={backHref}
        className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        В каталог
      </Link>

      {/* Phone frame — centered */}
      <div className="flex h-full items-center justify-center overflow-hidden">
        {/* Content passed as children */}
      </div>

      {/* Bottom-center: Edit button */}
      <button
        type="button"
        onClick={onEdit}
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
