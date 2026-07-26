import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getCurrentSession } from '@/lib/shared/api';
import { PublicShell } from '@/components/shared/PublicShell';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/seo/JsonLd';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { COMPARE_PAGES, type ComparePageContent } from '@/lib/seo/compare';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { buildBreadcrumbSchema, buildFaqPageSchema } from '@/lib/seo/json-ld';

export async function buildCompareMetadata(key: keyof typeof COMPARE_PAGES): Promise<Metadata> {
  const page = COMPARE_PAGES[key];
  const headerStore = await headers();
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: page.title,
    description: page.description,
    alternates: buildLanguageAlternates(page.path, urlLocale),
  };
}

function CompareBody({ page }: { page: ComparePageContent }) {
  return (
    <article className="us-container max-w-3xl space-y-10 py-12">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-us-ink-muted">Сравнение</p>
        <h1 className="font-display text-4xl text-us-ink md:text-5xl">{page.h1}</h1>
        <blockquote className="border-l-2 border-us-accent/40 pl-4 text-base leading-relaxed text-us-ink-muted">
          {page.definition}
        </blockquote>
      </header>

      {page.intro.map((p) => (
        <p key={p.slice(0, 40)} className="font-body text-base leading-relaxed text-us-ink-muted">
          {p}
        </p>
      ))}

      <section className="overflow-x-auto">
        <h2 className="mb-4 font-display text-2xl text-us-ink">Таблица</h2>
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-us-border">
              <th className="py-2 pr-3 font-medium text-us-ink">Критерий</th>
              <th className="py-2 pr-3 font-medium text-us-ink">QazShaqyru</th>
              <th className="py-2 font-medium text-us-ink">Альтернатива</th>
            </tr>
          </thead>
          <tbody>
            {page.rows.map((row) => (
              <tr key={row.feature} className="border-b border-us-border/70">
                <td className="py-3 pr-3 text-us-ink">{row.feature}</td>
                <td className="py-3 pr-3 text-us-ink-muted">{row.us}</td>
                <td className="py-3 text-us-ink-muted">{row.them}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-xl text-us-ink">Нам подходит, если</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-us-ink-muted">
            {page.whoWeFit.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-display text-xl text-us-ink">Альтернатива лучше, если</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-us-ink-muted">
            {page.whoTheyFit.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl text-us-ink">FAQ</h2>
        {page.faqs.map((faq) => (
          <details key={faq.question} className="border-b border-us-border py-3">
            <summary className="cursor-pointer font-display text-lg text-us-ink">{faq.question}</summary>
            <p className="mt-2 text-sm leading-relaxed text-us-ink-muted">{faq.answer}</p>
          </details>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <LocaleLink href={page.primaryCta.href}>{page.primaryCta.label}</LocaleLink>
        </Button>
        <Button variant="outline" asChild>
          <LocaleLink href="/templates">Каталог шаблонов</LocaleLink>
        </Button>
      </div>
    </article>
  );
}

export async function CompareLandingPage({ pageKey }: { pageKey: keyof typeof COMPARE_PAGES }) {
  const page = COMPARE_PAGES[pageKey];
  const session = await getCurrentSession();

  return (
    <PublicShell isLoggedIn={Boolean(session)}>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'QazShaqyru', path: '/' },
          { name: 'Сравнение', path: page.path },
        ])}
      />
      <JsonLd data={buildFaqPageSchema(page.faqs)} />
      <CompareBody page={page} />
    </PublicShell>
  );
}
