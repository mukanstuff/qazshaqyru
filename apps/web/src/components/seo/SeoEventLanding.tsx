import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getCurrentSession } from '@/lib/shared/api';
import { PublicShell } from '@/components/shared/PublicShell';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/seo/JsonLd';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { LinkifyPaths } from '@/components/seo/LinkifyPaths';
import { CITIES } from '@/lib/seo/cities';
import { getCityEvent } from '@/lib/seo/city-event';
import { getSeoLanding, type SeoLandingKey } from '@/lib/seo/event-landings';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildServiceSchema,
} from '@/lib/seo/json-ld';
import { getI18n } from '@/i18n/server';
import prisma from '@/lib/shared/db';
import type { Template } from '@prisma/client';
import { TemplateCatalogCard } from '@/components/templates';
import { LandingTemplateStrip } from '@/components/seo/LandingTemplateStrip';

export async function buildSeoLandingMetadata(key: SeoLandingKey): Promise<Metadata> {
  const [{ locale }, headerStore] = await Promise.all([getI18n(), headers()]);
  const L = getSeoLanding(key, locale);
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: L.title,
    description: L.description,
    alternates: buildLanguageAlternates(L.path, urlLocale),
    openGraph: {
      title: L.title,
      description: L.description,
      type: 'website',
      url: L.path,
      siteName: 'QazShaqyru',
    },
  };
}

/**
 * Which catalogue category this landing is actually about. The two city pages
 * (Almaty / Astana) are not about one kind of event, so they get the general
 * catalogue.
 */
const LANDING_CATEGORY: Partial<Record<SeoLandingKey, string>> = {
  uzatu: 'kyz_uzatu',
  sundet: 'sundet_toy',
  tusaukeser: 'tusau_keser',
  wedding: 'wedding',
  betashar: 'betashar',
  mereytoi: 'anniversary',
};

export async function SeoEventLanding({ landingKey }: { landingKey: SeoLandingKey }) {
  const { locale, t } = await getI18n();
  const L = getSeoLanding(landingKey, locale);

  /*
   * Designs, on the page that sells designs.
   *
   * These landings are where search traffic arrives, and they were pure text:
   * an h1, a quote, two buttons and five sections of grey paragraphs, with not
   * one image on a product whose entire proposition is that the invitation
   * looks beautiful. A visitor had to take our word for it and click through to
   * the catalogue to find out.
   *
   * Shown from the landing's own category when it has designs, and from the
   * catalogue at large when it does not — labelled honestly either way, never
   * pretending a betashar design exists because a wedding one does.
   */
  const category = LANDING_CATEGORY[landingKey];
  const [inCategory, anyActive]: [Template[], Template[]] = await Promise.all([
    category
      ? prisma.template.findMany({
          where: { isActive: true, category },
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
          take: 4,
        })
      : Promise.resolve([]),
    prisma.template.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 4,
    }),
  ]);
  const templates = inCategory.length > 0 ? inCategory : anyActive;
  const isCategoryMatch = inCategory.length > 0;
  const faqHeading = locale === 'kz' ? 'Жиі қойылатын сұрақтар' : 'Частые вопросы';
  const relatedHeading = locale === 'kz' ? 'Сондай-ақ қараңыз' : 'Смотрите также';
  // Null for landings that are themselves cities (/almaty, /astana).
  const cityEvent = getCityEvent(landingKey);
  const citiesHeading = locale === 'kz' ? 'Қалалар бойынша' : 'По городам';
  const allTemplatesLabel = locale === 'kz' ? 'Барлық үлгілер' : 'Все шаблоны';
  const faqLabel = locale === 'kz' ? 'Сервис FAQ' : 'FAQ сервиса';
  const createLabel = locale === 'kz' ? 'Шақыру жасау' : 'Создать приглашение';

  const schemas = [
    buildServiceSchema({
      name: L.serviceName,
      description: L.description,
      path: L.path,
    }),
    buildFaqPageSchema(L.faqs),
    buildBreadcrumbSchema([
      { name: 'QazShaqyru', path: '/' },
      { name: L.h1, path: L.path },
    ]),
  ];

  return (
    <>
      {schemas.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
      <article className="us-container max-w-3xl space-y-10 py-12">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-us-ink-muted">
            QazShaqyru
          </p>
          <h1 className="font-display text-4xl text-us-ink md:text-5xl">{L.h1}</h1>
          <blockquote className="border-l-2 border-us-accent/40 pl-4 font-body text-base leading-relaxed text-us-ink-muted">
            {L.definition}
          </blockquote>
        </header>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <LocaleLink href={L.primaryCta.href}>{L.primaryCta.label}</LocaleLink>
          </Button>
          <Button variant="outline" asChild>
            <LocaleLink href={L.secondaryCta.href}>{L.secondaryCta.label}</LocaleLink>
          </Button>
        </div>

        {templates.length > 0 ? (
          <LandingTemplateStrip
            heading={
              isCategoryMatch
                ? locale === 'kz'
                  ? 'Дайын үлгілер'
                  : 'Готовые шаблоны'
                : locale === 'kz'
                  ? 'Каталогтағы үлгілер'
                  : 'Шаблоны из каталога'
            }
            note={
              isCategoryMatch
                ? null
                : locale === 'kz'
                  ? 'Бұл сипатқа арналған үлгілер дайындалуда — қазір каталогта барлары.'
                  : 'Шаблоны для этого повода ещё готовятся — пока показываем то, что есть в каталоге.'
            }
            allHref={isCategoryMatch ? L.primaryCta.href : '/templates'}
            allLabel={allTemplatesLabel}
          >
            {templates.map((template) => (
              <TemplateCatalogCard
                key={template.id}
                template={template}
                displayName={
                  (locale === 'kz' ? template.nameKz : template.nameRu) ?? template.nameRu
                }
                categoryLabel={t(`events.${template.category}` as 'events.wedding')}
              />
            ))}
          </LandingTemplateStrip>
        ) : null}

        {/* Keyed by position, not by content.
            `key={p.slice(0, 48)}` keyed a paragraph on its own first 48
            characters, and this copy repeats openings: in the Kazakh set one
            48-character prefix occurs ten times across the file. Two of those
            inside one section gave React two children with the same key, which
            is the console warning that showed up on every occasion landing.
            These lists are static and never reorder, so the index is a correct
            and stable key. */}
        {L.sections.map((section, sIdx) => (
          <section key={`${sIdx}-${section.h2}`} className="space-y-4">
            <h2 className="font-display text-2xl text-us-ink md:text-3xl">{section.h2}</h2>
            {section.paragraphs.map((p, pIdx) => (
              <p key={pIdx} className="font-body text-base leading-relaxed text-us-ink-muted">
                <LinkifyPaths text={p} />
              </p>
            ))}
          </section>
        ))}

        <section className="space-y-4" aria-labelledby="seo-faq-heading">
          <h2 id="seo-faq-heading" className="font-display text-2xl text-us-ink md:text-3xl">
            {faqHeading}
          </h2>
          <div className="divide-y divide-us-border border-y border-us-border">
            {L.faqs.map((faq, fIdx) => (
              <details key={`${fIdx}-${faq.question}`} className="group py-4">
                <summary className="cursor-pointer list-none font-display text-lg text-us-ink marker:content-none [&::-webkit-details-marker]:hidden">
                  {faq.question}
                </summary>
                <p className="mt-3 font-body text-sm leading-relaxed text-us-ink-muted">
                  <LinkifyPaths text={faq.answer} />
                </p>
              </details>
            ))}
          </div>
        </section>

        {/*
          City pages for this event.

          Rendered only for events that have city pages at all. This is the
          crawl path that makes the city grid reachable — without it those pages
          exist but nothing links to them — and it is genuinely useful to a
          reader looking for their own city.
        */}
        {cityEvent ? (
          <section className="space-y-3">
            <h2 className="font-display text-2xl text-us-ink">{citiesHeading}</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 font-body text-sm">
              {CITIES.map((c) => (
                <li key={c.slug}>
                  <LocaleLink
                    href={`/${cityEvent.event}/${c.slug}`}
                    className="text-us-accent hover:underline"
                  >
                    {(locale === 'kz' ? c.kz : c.ru).name}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-us-ink">{relatedHeading}</h2>
          <ul className="list-disc space-y-2 pl-5 font-body text-sm text-us-ink-muted">
            {L.relatedLinks.map((link) => (
              <li key={link.href}>
                <LocaleLink href={link.href} className="text-us-accent hover:underline">
                  {link.label}
                </LocaleLink>
              </li>
            ))}
            <li>
              <LocaleLink href="/templates" className="text-us-accent hover:underline">
                {allTemplatesLabel}
              </LocaleLink>
            </li>
            <li>
              <LocaleLink href="/faq" className="text-us-accent hover:underline">
                {faqLabel}
              </LocaleLink>
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3 rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-sm">
          <Button asChild>
            <LocaleLink href={L.primaryCta.href}>{L.primaryCta.label}</LocaleLink>
          </Button>
          <Button variant="outline" asChild>
            <LocaleLink href="/create">{createLabel}</LocaleLink>
          </Button>
        </div>
      </article>
    </>
  );
}

export async function SeoLandingPage({ landingKey }: { landingKey: SeoLandingKey }) {
  const session = await getCurrentSession();
  return (
    <PublicShell isLoggedIn={Boolean(session)}>
      <SeoEventLanding landingKey={landingKey} />
    </PublicShell>
  );
}
