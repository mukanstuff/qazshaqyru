'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicShell } from '@/components/shared/PublicShell';
import {
  BlankCanvasCta,
  TemplateCatalogCard,
  TemplatePreviewModal,
  TemplatesFilterBar,
  type FilterCategory,
  TemplatesPageHero,
  TemplatesResultsSummary,
  TemplatesSeoBlock,
} from '@/components/templates';
import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';
import { templateMatchesSearch } from '@/lib/shared/ux-guided-flow';
import type { Template } from '@prisma/client';

const CATEGORY_ORDER = [
  'wedding',
  'toy',
  'betashar',
  'kyz_uzatu',
  'sundet_toy',
  'tusau_keser',
  'birthday',
  'anniversary',
  'corporate',
  'other',
] as const;

interface Props {
  templates: Template[];
  isLoggedIn?: boolean;
  showManaged?: boolean;
}

export function TemplatesClient({
  templates,
  isLoggedIn = false,
  showManaged = false,
}: Props) {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && CATEGORY_ORDER.includes(category as (typeof CATEGORY_ORDER)[number])) {
      setActiveCategory(category);
    }
  }, [searchParams]);

  const previewTemplate = useMemo(
    () => templates.find((tpl) => tpl.slug === previewSlug) ?? null,
    [templates, previewSlug],
  );

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.reduce<Record<string, Template[]>>((acc, cat) => {
        const items = templates.filter((tpl) => tpl.category === cat);
        if (items.length) acc[cat] = items;
        return acc;
      }, {}),
    [templates],
  );

  const totalTemplates = templates.length;

  const presentCategories = useMemo(
    () => CATEGORY_ORDER.filter((cat) => templates.some((tpl) => tpl.category === cat)),
    [templates],
  );

  const filterCategories = useMemo<FilterCategory[]>(
    () => [
      { key: 'all', label: t('templatesPage.allTemplates') },
      ...presentCategories.map((cat) => ({
        key: cat,
        label: t(`events.${cat}` as 'events.wedding'),
        count: grouped[cat]?.length ?? 0,
      })),
    ],
    [grouped, presentCategories, t],
  );

  const filteredItems = useMemo(() => {
    const source =
      activeCategory === 'all'
        ? templates
        : grouped[activeCategory] ?? [];
    if (!source.length) return [];
    return source.filter((template) => {
      const categoryLabel = t(`events.${template.category}` as 'events.wedding');
      return templateMatchesSearch({
        template,
        query: searchQuery,
        locale,
        categoryLabel,
      });
    });
  }, [activeCategory, grouped, locale, searchQuery, t, templates]);

  const hasActiveFilter = activeCategory !== 'all' || searchQuery.trim().length > 0;

  const handleReset = () => {
    setActiveCategory('all');
    setSearchQuery('');
  };

  const activeCategoryLabel =
    activeCategory === 'all'
      ? undefined
      : t(`events.${activeCategory}` as 'events.wedding');

  return (
    <PublicShell isLoggedIn={isLoggedIn}>
      <TemplatesPageHero
        variant="compact"
        eyebrow={t('templatesPage.overline')}
        breadcrumb={[{ label: t('templatesPage.compactBreadcrumb'), href: '/' }]}
        current={t('templatesPage.compactBreadcrumbCurrent')}
        stats={[
          { value: totalTemplates, label: t('templatesPage.compactStatsLabel') },
          { value: presentCategories.length, label: t('templatesPage.categoryCount') },
        ]}
      />

      <TemplatesFilterBar
        categories={filterCategories}
        active={activeCategory}
        onSelect={setActiveCategory}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        searchLabel={t('landing.templatesSearchLabel')}
      />

      <section className="pb-16 pt-6">
        <div className="us-container space-y-8">
          <TemplatesResultsSummary
            count={filteredItems.length}
            categoryLabel={activeCategoryLabel}
            hasActiveFilter={hasActiveFilter}
            onReset={handleReset}
          />

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredItems.map((template) => (
                <TemplateCatalogCard
                  key={template.id}
                  template={template}
                  displayName={(locale === 'kz' ? template.nameKz : template.nameRu) ?? template.nameRu}
                  categoryLabel={t(`events.${template.category}` as 'events.wedding')}
                  onPreview={() => setPreviewSlug(template.slug)}
                />
              ))}
            </div>
          ) : null}

          {filteredItems.length === 0 && templates.length > 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="font-body text-us-ink-muted">{t('templatesPage.noResults')}</p>
              <Button type="button" variant="outline" onClick={handleReset}>
                {t('templatesPage.resultsReset')}
              </Button>
            </div>
          ) : null}

          {templates.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="font-body text-us-ink-muted">{t('templatesPage.empty')}</p>
              <Button variant="outline" asChild>
                <LocaleLink href="/">{t('templatesPage.backHome')}</LocaleLink>
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="pb-16">
        <div className="us-container">
          <BlankCanvasCta />
        </div>
      </section>

      <TemplatesSeoBlock />

      {showManaged ? null : null}

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