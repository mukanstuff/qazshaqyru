import { LocaleLink } from '@/components/seo/LocaleLink';
import { ArrowRight } from 'lucide-react';

import { PublicShell } from '@/components/shared/PublicShell';
import { getI18n } from '@/i18n/server';
import { listBlogPosts } from '@/lib/blog/posts';
import { getCurrentSession } from '@/lib/shared/api';

export const metadata = {
  title: 'Блог — QazShaqyru',
  description: 'Советы по организации торжеств и идеи для цифровых приглашений.',
};

export default async function BlogPage() {
  const [{ locale, t }, session] = await Promise.all([getI18n(), getCurrentSession()]);
  const posts = listBlogPosts(locale);
  const dateLocale = locale === 'kz' ? 'kk-KZ' : 'ru-RU';

  return (
    <PublicShell isLoggedIn={Boolean(session)}>
      <section className="mx-auto max-w-3xl px-6 py-14 md:py-20">
        <p className="us-overline">{t('site.footer.blog')}</p>
        <h1 className="mt-3 font-display text-4xl text-us-ink md:text-5xl">{t('blog.title')}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-us-ink-muted">
          {t('blog.subtitle')}
        </p>

        <div className="mt-10">
          {posts.length === 0 ? (
            <p className="text-us-ink-muted">{t('blog.empty')}</p>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => {
                const dateStr = post.date
                  ? new Date(post.date).toLocaleDateString(dateLocale, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '';
                return (
                  <li key={post.slug}>
                    <LocaleLink
                      href={`/blog/${post.slug}`}
                      className="block rounded-[1.5rem] border border-black/[0.06] bg-white p-5 shadow-[0_12px_36px_-24px_rgba(44,24,16,0.3)] transition hover:-translate-y-0.5 hover:border-us-accent/20 md:p-6"
                    >
                      {dateStr ? (
                        <time className="text-xs uppercase tracking-[0.14em] text-us-ink-muted">
                          {dateStr}
                        </time>
                      ) : null}
                      <h2 className="mt-2 font-display text-xl text-us-ink md:text-2xl">
                        {post.title}
                      </h2>
                      {post.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-us-ink-muted">
                          {post.description}
                        </p>
                      ) : null}
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-us-accent">
                        {t('blog.readMore')}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </LocaleLink>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-12 rounded-[1.75rem] border border-black/[0.06] bg-white px-6 py-8 text-center shadow-[0_12px_36px_-24px_rgba(44,24,16,0.3)] md:px-8">
          <p className="font-display text-2xl text-us-ink">{t('blog.ctaTitle')}</p>
          <p className="mt-2 text-sm text-us-ink-muted">{t('blog.ctaSubtitle')}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <LocaleLink
              href="/invitations/edit"
              className="inline-flex items-center gap-2 rounded-full bg-us-accent px-6 py-3 text-sm font-medium text-us-cream transition-colors hover:bg-us-accent-strong"
            >
              {t('landing.v2.nav.create')}
              <ArrowRight className="h-4 w-4" />
            </LocaleLink>
            <LocaleLink
              href="/templates"
              className="inline-flex items-center rounded-full border border-us-accent/25 px-6 py-3 text-sm font-medium text-us-ink transition-colors hover:border-us-accent/45"
            >
              {t('landing.v2.nav.templates')}
            </LocaleLink>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
