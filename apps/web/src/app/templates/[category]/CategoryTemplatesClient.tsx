'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { ArrowRight } from 'lucide-react';
import { PublicShell } from '@/components/shared/PublicShell';
import {
  BlankCanvasCta,
  TemplateCatalogCard,
  TemplatePreviewModal,
  TemplatesFilterBar,
  TemplatesResultsSummary,
  TemplatesSeoBlock,
} from '@/components/templates';
import { Button } from '@/components/ui/button';
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

  const hasActiveFilter = searchQuery.trim().length > 0;

  return (
    <PublicShell isLoggedIn={isLoggedIn}>
      <TemplatesFilterBar
        categories={[
          { key: 'all', label: t('templatesPage.allTemplates') },
          { key: dbCategory, label: categoryLabel, count: templates.length },
        ]}
        active={dbCategory}
        onSelect={() => undefined}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        searchLabel={t('landing.templatesSearchLabel')}
        className="top-[4.75rem] md:top-[5.5rem]"
      />

      {seoSlot}

      <section className="pb-16 pt-6">
        <div className="us-container space-y-8">
          <TemplatesResultsSummary
            count={filteredTemplates.length}
            categoryLabel={categoryLabel}
            hasActiveFilter={hasActiveFilter}
            onReset={() => setSearchQuery('')}
          />

          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredTemplates.map((template) => {
                const displayName =
                  (locale === 'kz' ? template.nameKz : template.nameRu) ?? template.nameRu;
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
                  ? t('templatesPage.comingSoon')
                  : t('templatesPage.noResults')}
              </p>
              {templates.length === 0 ? (
                <p className="font-body text-sm text-us-ink-muted">
                  {t('templatesPage.roadmapNote')}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <LocaleLink href="/templates">{t('landing.allTemplates')}</LocaleLink>
                </Button>
                <Button variant="ghost" asChild>
                  <LocaleLink href="/">{t('errors.goHome')}</LocaleLink>
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
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="us-container">
          <BlankCanvasCta />
        </div>
      </section>

      <TemplatesSeoBlock />

      {previewTemplate ? (
        <TemplatePreviewModal
          template={previewTemplate}
          displayName={
            (locale === 'kz' ? previewTemplate.nameKz : previewTemplate.nameRu) ??
            previewTemplate.nameRu
          }
          onClose={() => setPreviewSlug(null)}
        />
      ) : null}
    </PublicShell>
  );
}