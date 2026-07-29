'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { getTemplateSignature } from '@/lib/templates/template-identity';
import { getTemplatePreviewUrl } from '@/lib/templates';
import { quickWizardHref } from '@/lib/shared/quick-wizard-url';
import { cn } from '@/lib/shared/utils';
import type { Template } from '@prisma/client';

interface TemplateCatalogCardProps {
  template: Template;
  displayName: string;
  categoryLabel: string;
  onPreview: () => void;
}

export function TemplateCatalogCard({
  template,
  displayName,
  categoryLabel,
  onPreview,
}: TemplateCatalogCardProps) {
  const { t, locale } = useI18n();
  const signature = getTemplateSignature(template.slug, locale === 'kz' ? 'kz' : 'ru');
  const previewSrc = getTemplatePreviewUrl(template.slug, template.previewImageUrl);

  return (
    <Card className="group overflow-hidden border-us-border/70 bg-white transition-all hover:-translate-y-0.5 hover:border-us-accent/25 hover:shadow-us-md">
      <button
        type="button"
        onClick={onPreview}
        className="relative block w-full p-0 text-left"
        aria-label={`${t('templatesPage.previewFullscreen')}: ${displayName}`}
      >
        <div className="relative aspect-[3/5] overflow-hidden bg-us-ivory sm:aspect-[2/3]">
          {previewSrc ? (
            <Image
              src={previewSrc}
              alt={displayName}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              loading="lazy"
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-us-ink-muted">—</div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-us-ink/60 via-us-ink/5 to-transparent" />
        </div>

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {categoryLabel.trim() ? (
            <Badge
              variant="default"
              className="us-glass-soft border-white/40 bg-white/85 text-us-ink shadow-sm"
            >
              {categoryLabel}
            </Badge>
          ) : (
            <span />
          )}
          {template.priceKzt > 0 ? (
            <Badge
              variant="outline"
              className="us-glass-soft border-white/40 bg-white/85 text-us-ink shadow-sm"
            >
              {template.priceKzt.toLocaleString('ru-RU')} ₸
            </Badge>
          ) : null}
        </div>

        <div className="absolute inset-x-3 bottom-3 min-w-0 text-white">
          <h3 className="truncate font-display text-lg leading-tight drop-shadow-sm">{displayName}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-white/80">{signature}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 font-body text-xs text-white/90">
            <Maximize2 className="h-3.5 w-3.5" aria-hidden />
            {t('templatesPage.previewTemplate')}
          </span>
        </div>
      </button>

      <div className="us-glass-soft border-t border-us-border/50 p-3">
        <Link
          href={quickWizardHref(template.slug)}
          data-testid={`template-quick-${template.slug}`}
          className={cn(
            buttonVariants({ variant: 'default', size: 'sm' }),
            'flex min-h-11 w-full items-center justify-center gap-2',
          )}
        >
          {t('templatesPage.makeThisTemplate')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
