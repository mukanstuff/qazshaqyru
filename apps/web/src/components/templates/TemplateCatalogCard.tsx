'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import { getTemplatePreviewUrl } from '@/lib/templates';
import { editorHref } from '@/lib/shared/quick-wizard-url';
import type { Template } from '@prisma/client';
import { formatKzt } from '@/lib/shared/format-price';

interface TemplateCatalogCardProps {
  template: Template;
  displayName: string;
  categoryLabel: string;
}

/**
 * One template in the catalog grid.
 *
 * The whole card is a single link into the editor. It deliberately does NOT
 * stack name/description/price on top of the artwork the way the previous
 * version did: the preview image is itself a piece of typography-heavy design,
 * so overlaying more text on it made both unreadable. Artwork stays clean and
 * unobstructed; metadata sits underneath it.
 */
export function TemplateCatalogCard({
  template,
  displayName,
  categoryLabel,
}: TemplateCatalogCardProps) {
  const { t, locale } = useI18n();
  const previewSrc = getTemplatePreviewUrl(template.slug, template.previewImageUrl);
  // Descriptions come from the Template row. This used to fall back to
  // getTemplateSignature(), a hand-written lookup table whose only entry was
  // keyed on `luxe-gold` — a slug that does not exist in the database — so the
  // fallback returned '' for every template that actually ships. Removed.
  const description =
    (locale === 'kz' ? template.descriptionKz : template.descriptionRu)?.trim() || '';

  return (
    <Link
      href={editorHref(template.slug)}
      data-testid={`template-quick-${template.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-us-border/70 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-us-accent/30 hover:shadow-us-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-us-accent focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-us-ivory">
        {previewSrc ? (
          <Image
            src={previewSrc}
            alt={displayName}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-us-ink-muted">
            —
          </div>
        )}

        {/* Category sits on the artwork as a single small chip — one piece of
            metadata is legible over an image, a paragraph is not. */}
        {categoryLabel.trim() ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-us-ink shadow-sm backdrop-blur-sm">
            {categoryLabel}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {/* Two lines rather than one truncated line: at catalogue card width a
            single `truncate` cut most template names mid-word ("Элегантное
            золо…"), which reads as a bug rather than as a design. */}
        <h3 className="line-clamp-2 font-display text-base leading-snug text-us-ink">
          {displayName}
        </h3>
        {description ? (
          <p className="line-clamp-2 text-xs leading-snug text-us-ink-muted">{description}</p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-3">
          {template.priceKzt > 0 ? (
            <span className="font-display text-sm text-us-ink">
              {formatKzt(template.priceKzt)} ₸
            </span>
          ) : null}

          {/* The call to action is the point of the card, so it gets the full
              width and a solid fill. Previously it was a small text link that
              had to share a row with the price and wrapped onto two lines.
              The whole card is still the link — this is its visible affordance,
              not a nested control, hence a span rather than a button. */}
          <span className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-us-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 group-hover:brightness-110 group-hover:shadow-md">
            {t('templatesPage.makeThisTemplate')}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
