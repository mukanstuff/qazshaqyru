import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ArrowRight } from 'lucide-react';

import { PublicShell } from '@/components/shared/PublicShell';
import { JsonLd } from '@/components/seo/JsonLd';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { getI18n } from '@/i18n/server';
import { getBlogPost, listAllBlogSlugs } from '@/lib/blog/posts';
import { getCurrentSession } from '@/lib/shared/api';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { buildBlogPostingSchema, buildBreadcrumbSchema } from '@/lib/seo/json-ld';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return listAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [{ locale }, headerStore] = await Promise.all([getI18n(), headers()]);
  const post = getBlogPost(locale, slug);
  if (!post) return { title: 'Блог — QazShaqyru' };
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: `${post.title} — QazShaqyru`,
    description: post.description,
    alternates: buildLanguageAlternates(`/blog/${slug}`, urlLocale),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [{ locale, t }, session] = await Promise.all([getI18n(), getCurrentSession()]);
  const post = getBlogPost(locale, slug);
  if (!post) notFound();

  const dateLocale = locale === 'kz' ? 'kk-KZ' : 'ru-RU';
  const dateStr = post.date
    ? new Date(post.date).toLocaleDateString(dateLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
  const updatedStr =
    post.updated && post.updated !== post.date
      ? new Date(post.updated).toLocaleDateString(dateLocale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '';

  return (
    <PublicShell isLoggedIn={Boolean(session)}>
      <JsonLd
        data={buildBlogPostingSchema({
          title: post.title,
          description: post.description,
          path: `/blog/${slug}`,
          datePublished: post.date,
          dateModified: post.updated || post.date,
          locale: locale === 'kz' ? 'kk' : 'ru',
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'QazShaqyru', path: '/' },
          { name: 'Блог', path: '/blog' },
          { name: post.title, path: `/blog/${slug}` },
        ])}
      />
      <article className="mx-auto max-w-3xl px-6 py-14 md:py-20">
        <LocaleLink
          href="/blog"
          className="text-sm text-us-ink-muted transition-colors hover:text-us-accent"
        >
          ← {t('blog.backToList')}
        </LocaleLink>
        {dateStr ? (
          <time className="mt-8 block text-xs uppercase tracking-[0.14em] text-us-ink-muted">
            {dateStr}
            {updatedStr ? ` · обновлено ${updatedStr}` : ''}
          </time>
        ) : null}
        <h1 className="mt-3 font-display text-4xl text-us-ink md:text-5xl">{post.title}</h1>
        {post.description ? (
          <p className="mt-4 text-base leading-relaxed text-us-ink-muted">{post.description}</p>
        ) : null}
        <div
          className="mt-10 rounded-[1.75rem] border border-black/[0.06] bg-white p-6 text-sm leading-relaxed text-us-ink-muted shadow-[0_12px_36px_-24px_rgba(44,24,16,0.3)] md:p-8 [&_a]:text-us-accent [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-us-ink [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />
      </article>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-[1.75rem] border border-black/[0.06] bg-white px-6 py-8 text-center shadow-[0_12px_36px_-24px_rgba(44,24,16,0.3)] md:px-8">
          <p className="font-display text-2xl text-us-ink">{t('blog.ctaTitle')}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <LocaleLink
              href="/create"
              className="inline-flex items-center gap-2 rounded-full bg-us-accent px-6 py-3 text-sm font-medium text-us-cream transition-colors hover:bg-us-accent-strong"
            >
              {t('landing.v2.nav.create')}
              <ArrowRight className="h-4 w-4" />
            </LocaleLink>
            <LocaleLink
              href="/blog"
              className="inline-flex items-center rounded-full border border-us-accent/25 px-6 py-3 text-sm font-medium text-us-ink transition-colors hover:border-us-accent/45"
            >
              {t('blog.backToList')}
            </LocaleLink>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
