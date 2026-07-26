'use client';

import Link from 'next/link';
import { ArrowRight, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import type { SuretTemplateManifest } from '@/lib/templates/manifest-types';
import { cn } from '@/lib/shared/utils';

interface Props {
  manifest: SuretTemplateManifest;
}

const CATEGORY_TITLE: Record<string, { kz: string; ru: string }> = {
  kyz_uzatu: { kz: 'қыз ұзату', ru: 'қыз ұзату' },
};

export function SuretCatalogCard({ manifest }: Props) {
  const { locale, t } = useI18n();
  const cat = CATEGORY_TITLE[manifest.category] ?? {
    kz: manifest.category,
    ru: manifest.category,
  };
  const title = locale === 'kz' ? `Сүрет · ${cat.kz}` : `Сүрет · ${cat.ru}`;
  // Catalog card stays human; create path goes to templates if Suret DB row missing.
  const href = '/templates';

  return (
    <Card
      className="mx-auto w-full max-w-[340px] overflow-hidden border-us-border shadow-us-sm transition-all hover:border-us-accent/25 hover:shadow-us-md sm:max-w-none"
      data-testid={`suret-catalog-${manifest.slug}`}
    >
      <Link href={href} className="group relative block w-full p-3 text-left">
        <div
          className="relative aspect-[9/16] overflow-hidden rounded-lg border border-us-border bg-us-ivory"
          style={{
            backgroundImage: `url(${manifest.background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-1.5 rounded-md bg-us-accent-strong/90 px-2.5 py-1.5 font-body text-xs text-white opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <ImageIcon className="h-3.5 w-3.5" />
            {locale === 'kz' ? 'Stories 9:16' : 'Stories 9:16'}
          </div>
        </div>
        <div className="absolute inset-x-3 top-3">
          <Badge variant="default">Сүрет</Badge>
        </div>
      </Link>
      <div className="space-y-3 px-4 pb-4">
        <div>
          <h3 className="font-display text-base font-medium text-us-ink">{title}</h3>
          <p className="mt-1 font-body text-sm text-us-ink-muted">
            {locale === 'kz'
              ? 'WhatsApp Status пен Instagram үшін бір сурет'
              : 'Одна картинка для WhatsApp Status и Instagram'}
          </p>
        </div>
        <Link
          href={href}
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'inline-flex')}
        >
          {t('templatesPage.makeThisTemplate')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
