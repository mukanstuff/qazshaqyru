'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { ArrowRight } from 'lucide-react';
import { PublicShell } from '@/components/shared/PublicShell';
import {
  TemplateCatalogCard,
  TemplatePreviewModal,
  TemplatesPageHero,
} from '@/components/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n';
import {
  categoryDbKeyFromRoute,
  type CategoryRouteSlug,
} from '@/lib/templates/template-categories';
import { templateMatchesSearch } from '@/lib/shared/ux-guided-flow';
import type { Template } from '@prisma/client';

interface Props {
  routeSlug: CategoryRouteSlug;
  templates: Template[];
  isLoggedIn?: boolean;
  seoSlot?: ReactNode;
}

export function CategoryTemplatesClient({
  routeSlug,
  templates,
  isLoggedIn = false,
  seoSlot,
}: Props) {
  const { t, locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const dbCategory = categoryDbKeyFromRoute(routeSlug);
  const categoryLabel = t(`events.${dbCategory}` as 'events.wedding');

  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) =>
        templateMatchesSearch({
          template,
          query: searchQuery,
          locale,
          categoryLabel,
        }),
      ),
    [categoryLabel, locale, searchQuery, templates],
  );

  const previewTemplate = useMemo(
    () => templates.find((template) => template.slug === previewSlug) ?? null,
    [previewSlug, templates],
  );

  return (
    <PublicShell isLoggedIn={isLoggedIn}>
      <TemplatesPageHero
        overline={t('categoryPage.label')}
        title={t(`categoryPage.${routeSlug}.title` as 'categoryPage.wedding.title')}
        subtitle={t(`categoryPage.${routeSlug}.subtitle` as 'categoryPage.wedding.subtitle')}
        stats={[
          {
            value: filteredTemplates.length,
            label: t('landing.templatesTitle'),
          },
          { value: 1, label: categoryLabel },
        ]}
      />

      {seoSlot}

      <section className="py-6">
        <div className="us-container max-w-xl">
          <Label htmlFor="category-templates-search" className="sr-only">
            {t('landing.templatesSearchLabel')}
          </Label>
          <Input
            id="category-templates-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('landing.templatesSearchLabel')}
            aria-label={t('landing.templatesSearchLabel')}
            data-testid="category-templates-search-input"
          />
        </div>
      </section>

      <section className="pb-16">
        <div className="us-container space-y-10">
          {filteredTemplates.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTemplates.map((template) => {
                const displayName = (locale === 'kz' ? template.nameKz : template.nameRu) ?? template.nameRu;
                return (
                  <TemplateCatalogCard
                    key={template.id}
                    template={template}
                    displayName={displayName}
                    categoryLabel={categoryLabel}
                    onPreview={() => setPreviewSlug(template.slug)}
                  />
                );
              })}
            </div>
          ) : null}

          {filteredTemplates.length === 0 ? (
            <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
              <p className="font-display text-2xl text-us-ink">
                {templates.length === 0
                  ? `Шаблоны для «${categoryLabel}» скоро`
                  : t('errors.tryAgain')}
              </p>
              {templates.length === 0 ? (
                <p className="font-body text-sm text-us-ink-muted">
                  {t('templatesPage.roadmapNote')}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <LocaleLink href="/templates">Все шаблоны</LocaleLink>
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <LocaleLink href="/templates">
                {t('landing.allTemplates')}
                <ArrowRight className="h-4 w-4" />
              </LocaleLink>
            </Button>
            <Button variant="ghost" asChild>
              <LocaleLink href="/">{t('errors.goHome')}</LocaleLink>
            </Button>
          </div>
        </div>
      </section>

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          displayName={(locale === 'kz' ? previewTemplate.nameKz : previewTemplate.nameRu) ?? previewTemplate.nameRu}
          onClose={() => setPreviewSlug(null)}
        />
      )}
    </PublicShell>
  );
}
