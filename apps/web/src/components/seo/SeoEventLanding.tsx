import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getCurrentSession } from '@/lib/shared/api';
import { PublicShell } from '@/components/shared/PublicShell';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/seo/JsonLd';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { getSeoLanding, type SeoLandingKey } from '@/lib/seo/event-landings';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildServiceSchema,
} from '@/lib/seo/json-ld';
import { getI18n } from '@/i18n/server';

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

export async function SeoEventLanding({ landingKey }: { landingKey: SeoLandingKey }) {
  const { locale } = await getI18n();
  const L = getSeoLanding(landingKey, locale);
  const faqHeading = locale === 'kz' ? 'Жиі қойылатын сұрақтар' : 'Частые вопросы';
  const relatedHeading = locale === 'kz' ? 'Сондай-ақ қараңыз' : 'Смотрите также';
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

        {L.sections.map((section) => (
          <section key={section.h2} className="space-y-4">
            <h2 className="font-display text-2xl text-us-ink md:text-3xl">{section.h2}</h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 48)} className="font-body text-base leading-relaxed text-us-ink-muted">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section className="space-y-4" aria-labelledby="seo-faq-heading">
          <h2 id="seo-faq-heading" className="font-display text-2xl text-us-ink md:text-3xl">
            {faqHeading}
          </h2>
          <div className="divide-y divide-us-border border-y border-us-border">
            {L.faqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="cursor-pointer list-none font-display text-lg text-us-ink marker:content-none [&::-webkit-details-marker]:hidden">
                  {faq.question}
                </summary>
                <p className="mt-3 font-body text-sm leading-relaxed text-us-ink-muted">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

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
            <LocaleLink href="/invitations/edit">{createLabel}</LocaleLink>
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
