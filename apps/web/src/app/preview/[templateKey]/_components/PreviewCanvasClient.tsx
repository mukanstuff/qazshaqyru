'use client';

/**
 * PreviewCanvasClient — read-only canvas preview for /preview/[templateKey].
 *
 * Used for canvas-backed templates (Template.isCanvasTemplate = true) on the
 * catalog preview page. Renders the Template.canvas document via the shared
 * CanvasRenderer in guest mode and offers a single CTA to /editor/[templateKey].
 *
 * 1.1: minimal canvas branch. No wizard, no auto-save, no inline editing.
 */

import Link from 'next/link';
import { CanvasRenderer } from '@/components/canvas/CanvasRenderer';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

interface Props {
  templateSlug: string;
  templateName: string;
  locale: 'ru' | 'kz';
  document: InvitationCanvasDocument;
}

export function PreviewCanvasClient({ templateSlug, templateName, locale, document }: Props) {
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{templateName}</h1>
          <p className="text-sm text-neutral-500">Read-only canvas preview</p>
        </div>
        <Link
          href={`/editor/${templateSlug}`}
          className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Редактировать
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <CanvasRenderer document={document} mode="guest" locale={locale} />
      </div>
    </div>
  );
}