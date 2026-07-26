'use client';

import { useEffect, useMemo, useState } from 'react';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { LogoMark } from '@/components/shared/ornaments';
import { PublicShell } from '@/components/shared/PublicShell';
import {
  CatalogDesignerNote,
  SuretCatalogCard,
  TemplateCatalogCard,
  TemplateFilterChip,
  TemplatePreviewModal,
  TemplatesPageHero,
} from '@/components/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n';
import { ManagedOrderForm } from '@/components/orders/ManagedOrderForm';
import { PLAN_CATALOG } from '@/lib/entitlements/plan-catalog';
import { templateMatchesSearch } from '@/lib/shared/ux-guided-flow';
import { COMING_SOON_TEMPLATES, comingSoonByProduct, type ComingSoonProduct } from '@/lib/templates/coming-soon';
import { listSuretManifests } from '@/lib/templates/suret-manifests';
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

type ProductFilter = 'all' | ComingSoonProduct;

function parseProductFilter(raw: string | null): ProductFilter {
  if (raw === 'site' || raw === 'suret') return raw;
  return 'all';
}

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
  const [productFilter, setProductFilter] = useState<ProductFilter>(() =>
    parseProductFilter(searchParams.get('product') ?? searchParams.get('category')),
  );
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [managedOpen, setManagedOpen] = useState(showManaged);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && CATEGORY_ORDER.includes(category as (typeof CATEGORY_ORDER)[number])) {
      setActiveCategory(category);
    }
  }, [searchParams]);

  useEffect(() => {
    const category = searchParams.get('category');
    const product = searchParams.get('product');
    if (product === 'site' || product === 'suret') {
      setProductFilter(product);
    } else if (category === 'site' || category === 'suret') {
      setProductFilter(category);
    }
  }, [searchParams]);

  const previewTemplate = useMemo(
    () => templates.find((tpl) => tpl.slug === previewSlug) ?? null,
    [templates, previewSlug],
  );

  const liveTemplates = useMemo(() => {
    if (productFilter === 'suret') return [] as Template[];
    return templates;
  }, [productFilter, templates]);

  const suretLive = useMemo(() => {
    // P0-3: Suret not ready for public catalog (no DB row / wiring path).
    return [] as ReturnType<typeof listSuretManifests>;
  }, []);

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.reduce<Record<string, Template[]>>((acc, cat) => {
        const items = liveTemplates.filter((tpl) => tpl.category === cat);
        if (items.length) acc[cat] = items;
        return acc;
      }, {}),
    [liveTemplates],
  );

  const totalTemplates = liveTemplates.length + (productFilter === 'site' ? 0 : suretLive.length);

  const visibleGroups = useMemo(() => {
    if (activeCategory === 'all') return grouped;
    return grouped[activeCategory] ? { [activeCategory]: grouped[activeCategory] } : {};
  }, [activeCategory, grouped]);

  const filteredGroups = useMemo(
    () =>
      Object.entries(visibleGroups).reduce<Record<string, Template[]>>((acc, [category, items]) => {
        const categoryLabel = t(`events.${category}` as 'events.wedding');
        const filtered = items.filter((template) =>
          templateMatchesSearch({
            template,
            query: searchQuery,
            locale,
            categoryLabel,
          }),
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {}),
    [locale, searchQuery, t, visibleGroups],
  );

  const hasVisibleTemplates = Object.values(filteredGroups).some((items) => items.length > 0);
  const hasSuret = suretLive.length > 0 && !searchQuery.trim();

  const ritualHints = useMemo(() => {
    const byProduct = comingSoonByProduct(productFilter === 'all' ? 'all' : productFilter);
    return byProduct
      .filter((item) => activeCategory === 'all' || item.category === activeCategory)
      .slice(0, 8)
      .map((item) => (locale === 'kz' ? item.nameKz : item.nameRu));
  }, [activeCategory, locale, productFilter]);

  const liveCountShown =
    Object.values(filteredGroups).reduce((n, items) => n + items.length, 0) +
    (hasSuret ? suretLive.length : 0);

  return (
    <PublicShell isLoggedIn={isLoggedIn}>
      <TemplatesPageHero
        overline={t('templatesPage.overline')}
        title={t('templatesPage.title')}
        subtitle={t('templatesPage.subtitle')}
        stats={[
          { value: totalTemplates, label: t('templatesPage.totalTemplates') },
          { value: CATEGORY_ORDER.length, label: t('templatesPage.categoryCount') },
        ]}
      />

      <section className="border-b border-us-border/60 bg-us-surface/40 py-4">
        <div className="us-container flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          <TemplateFilterChip
            active={productFilter === 'all'}
            onClick={() => setProductFilter('all')}
            label={locale === 'kz' ? 'Барлығы' : 'Все форматы'}
          />
          <TemplateFilterChip
            active={productFilter === 'site'}
            onClick={() => setProductFilter('site')}
            label={locale === 'kz' ? 'Сайт-шақыру' : 'Сайт-приглашение'}
          />
          <TemplateFilterChip
            active={productFilter === 'suret'}
            onClick={() => setProductFilter('suret')}
            label={locale === 'kz' ? 'Сүрет' : 'Сүрет (фото)'}
          />
        </div>
      </section>

      <section className="border-b border-us-border/60 py-4">
        <div className="us-container flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          <TemplateFilterChip
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            label={t('templatesPage.allTemplates')}
          />
          {CATEGORY_ORDER.map((cat) => {
            const liveCount = grouped[cat]?.length ?? 0;
            const suretCount = listSuretManifests().filter((m) => m.category === cat).length;
            const count = liveCount + (productFilter === 'site' ? 0 : suretCount);
            return (
              <TemplateFilterChip
                key={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                label={`${t(`events.${cat}` as 'events.wedding')}${count ? ` · ${count}` : ''}`}
              />
            );
          })}
        </div>
      </section>

      <section className="py-6">
        <div className="us-container max-w-xl">
          <Label htmlFor="templates-search-input" className="sr-only">
            {t('landing.templatesSearchLabel')}
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-us-ink-muted"
              aria-hidden
            />
            <Input
              id="templates-search-input"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('landing.templatesSearchLabel')}
              aria-label={t('landing.templatesSearchLabel')}
              data-testid="templates-search-input"
              className="border-us-border/80 pl-9 shadow-none focus-visible:ring-us-accent/30"
            />
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="us-container space-y-12">
          <p className="font-body text-sm text-us-ink-muted" data-testid="templates-count-label">
            {t('templatesPage.showingCount').replace('{count}', String(liveCountShown))}
          </p>

          {Object.entries(filteredGroups).map(([category, items]) => (
            <section key={category}>
              {activeCategory === 'all' && (
                <h2 className="mb-6 font-display text-2xl font-medium text-us-ink">
                  {t(`events.${category}` as 'events.wedding')}
                </h2>
              )}

              <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
                {items.map((template) => (
                  <TemplateCatalogCard
                    key={template.id}
                    template={template}
                    displayName={locale === 'kz' ? template.nameKz : template.nameRu}
                    categoryLabel={t(`events.${template.category}` as 'events.wedding')}
                    onPreview={() => setPreviewSlug(template.slug)}
                  />
                ))}
              </div>
            </section>
          ))}

          {hasSuret ? (
            <section>
              <h2 className="mb-6 font-display text-2xl font-medium text-us-ink">
                {locale === 'kz' ? 'Сүрет · Stories' : 'Сүрет · Stories'}
              </h2>
              <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
                {suretLive.map((manifest) => (
                  <SuretCatalogCard key={manifest.slug} manifest={manifest} />
                ))}
              </div>
            </section>
          ) : null}

          {!searchQuery.trim() && COMING_SOON_TEMPLATES.length > 0 ? (
            <CatalogDesignerNote ritualHints={ritualHints} />
          ) : null}

          {!hasVisibleTemplates && !hasSuret && templates.length > 0 && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <LogoMark size={60} />
              <p className="font-body text-us-ink-muted">{t('templatesPage.noResults')}</p>
              <Button type="button" variant="outline" onClick={() => setSearchQuery('')}>
                {t('templatesPage.clearSearch')}
              </Button>
            </div>
          )}

          {templates.length === 0 && !hasSuret && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <LogoMark size={60} />
              <p className="font-body text-us-ink-muted">{t('templatesPage.empty')}</p>
              <Button variant="outline" asChild>
                <LocaleLink href="/">{t('templatesPage.backHome')}</LocaleLink>
              </Button>
            </div>
          )}

          <div className="rounded-2xl border border-us-border bg-us-ivory/70 p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-us-ink">
                  {t('templatesPage.managedTitle')}
                </h2>
                <p className="mt-1 max-w-xl font-body text-sm text-us-ink-muted">
                  {t('templatesPage.managedDesc')}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setManagedOpen((v) => !v)}
              >
                {managedOpen ? t('templatesPage.managedHide') : t('templatesPage.managedCta')}
              </Button>
            </div>
            {managedOpen && templates[0] ? (
              <ManagedOrderForm
                templateId={templates[0].id}
                templateName={
                  locale === 'kz' ? templates[0].nameKz : templates[0].nameRu
                }
                managedPrice={
                  templates[0].priceKzt > 0
                    ? templates[0].priceKzt
                    : PLAN_CATALOG.premium.priceKzt
                }
              />
            ) : null}
          </div>
        </div>
      </section>

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          displayName={locale === 'kz' ? previewTemplate.nameKz : previewTemplate.nameRu}
          onClose={() => setPreviewSlug(null)}
        />
      )}
    </PublicShell>
  );
}
