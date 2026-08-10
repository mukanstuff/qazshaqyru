/**
 * Server component — renders an HTML-engine template for the guest/public page.
 *
 * Phase 1: `/i/[slug]` route checks `getHtmlTemplateDescriptor(templateKey)`.
 * If it returns a descriptor → this component renders the template.
 * If not → falls back to PublicInvitationClient (React-sections).
 *
 * This component is a Server Component — no 'use client', async, direct Prisma/FS access.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/shared/db';
import { getHtmlTemplateDescriptor } from '@/lib/templates/manifests/index';
import { renderHtmlTemplate } from '@/lib/templates/html-engine';
import { headers } from 'next/headers';
import type { HtmlTemplateData, Locale } from '@/lib/templates/html-engine/types';
import HtmlTemplateFrame from './HtmlTemplateFrame';

interface HtmlGuestPageProps {
  slug: string;
  templateKey: string;
  demoLayout?: string;
  /** Overrides user language from DB (e.g. from ?locale= query param). */
  locale?: Locale;
  /** Whether this is a demo preview (no DB invitation row). */
  isDemo: boolean;
  /** User-set invitation locale, e.g. from customText.invitationLocale. */
  invitationLanguage?: Locale;
  /** Hide brand logo mark when embedded in preview modal. */
  embed?: boolean;
}

/** Shared data-fetching logic for both the page and metadata generation. */
export async function resolveHtmlTemplateData(
  slug: string,
  templateKey: string,
  isDemo: boolean,
  locale: Locale,
): Promise<{
  html: string;
  templateKey: string;
  locale: Locale;
  invitationLanguage: Locale;
  meta: {
    title: string;
    description: string;
    ogImageUrl: string;
    pageUrl: string;
  };
} | null> {
  const descriptor = getHtmlTemplateDescriptor(templateKey);
  if (!descriptor) return null;

  // Build template fields from DB or demo API.
  let templateFields: Record<string, string>;
  let title = 'Приглашение';

  if (isDemo) {
    // Demo uses the public/demo API — same as PublicInvitationClient for legacy demos.
    const headersList = await headers();
    const origin = headersList.get('origin') ?? 'http://localhost:3000';
    const apiUrl = `${origin}/api/invitations/public/demo?layout=${encodeURIComponent(templateKey)}&locale=${locale}`;
    let res: Response;
    try {
      res = await fetch(apiUrl, { cache: 'no-store' });
    } catch {
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    const inv = data.invitation as {
      title?: string;
      customText?: Record<string, string | undefined>;
      templateData?: Record<string, string | undefined>;
    };
    templateFields = mapDescriptorFields(descriptor, inv?.customText ?? {}, inv?.templateData ?? {}, locale);
    title = inv?.title ?? 'Демо-приглашение';
  } else {
    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      select: {
        title: true,
        templateKey: true,
        templateData: true,
        customText: true,
        musicUrl: true,
      },
    });
    if (!invitation) return null;
    templateFields = mapDescriptorFields(
      descriptor,
      invitation.customText as Record<string, string | undefined> ?? {},
      invitation.templateData as Record<string, string | undefined> ?? {},
      locale,
    );
    title = invitation.title;
  }

  const baseUrl = process.env.APP_URL ?? '';
  const eventDate = templateFields.eventDate ?? '';
  const eventTime = templateFields.eventTime ?? '';
  const eventPlace = templateFields.eventPlace ?? '';

  // Format date for display.
  let dateStr = eventDate;
  if (eventDate) {
    try {
      const d = new Date(eventDate);
      dateStr = d.toLocaleDateString(locale === 'kz' ? 'kk-KZ' : 'ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      dateStr = eventDate;
    }
  }

  const timePart = eventTime ? `, ${eventTime}` : '';
  const placePart = eventPlace ? ` · ${eventPlace}` : '';
  const description = `${title} · ${dateStr}${timePart}${placePart}`.trim();
  const ogImageUrl = `${baseUrl.replace(/\/$/, '')}/api/og?slug=${encodeURIComponent(slug)}`;
  const pageUrl = `${baseUrl.replace(/\/$/, '')}/i/${slug}`;

  const htmlTemplateData: HtmlTemplateData = {
    locale,
    fields: templateFields,
    musicUrl: null,
    assets: {},
    defaults: {},
  };

  const rendered = renderHtmlTemplate(descriptor, htmlTemplateData);
  if (!rendered.ok) return null;

  return {
    html: rendered.html,
    templateKey,
    locale,
    invitationLanguage: locale,
    meta: {
      title: `${title} — ${dateStr}`,
      description,
      ogImageUrl,
      pageUrl,
    },
  };
}

/** Extract descriptor field values from invitation customText + templateData. */
function mapDescriptorFields(
  descriptor: ReturnType<typeof getHtmlTemplateDescriptor> & { fields: Array<{ key: string }> },
  customText: Record<string, string | undefined>,
  templateData: Record<string, string | undefined>,
  locale: Locale,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of descriptor.fields) {
    const value = customText[field.key] ?? templateData[field.key] ?? '';
    if (value !== '') {
      result[field.key] = value;
    }
  }
  return result;
}

/** Async metadata generator for HTML-template guest pages. */
export async function generateHtmlTemplateMetadata(props: HtmlGuestPageProps): Promise<Metadata> {
  const { slug, templateKey, isDemo, locale = 'ru', embed } = props;

  if (embed) {
    // Embedded preview doesn't need full metadata.
    return { title: 'Превью шаблона' };
  }

  const resolved = await resolveHtmlTemplateData(slug, templateKey, isDemo, locale);
  if (!resolved) return { title: 'Приглашение не найдено' };

  const { meta } = resolved;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      url: meta.pageUrl,
      locale: locale === 'kz' ? 'kk_KZ' : 'ru_RU',
      images: [
        {
          url: meta.ogImageUrl,
          width: 1200,
          height: 630,
          alt: meta.title,
          type: 'image/png',
        },
      ],
      siteName: 'QazShaqyru',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [meta.ogImageUrl],
    },
  };
}

export default async function HtmlGuestPage(props: HtmlGuestPageProps) {
  const { slug, templateKey, isDemo, locale = 'ru', invitationLanguage, embed } = props;

  const resolved = await resolveHtmlTemplateData(slug, templateKey, isDemo, locale);
  if (!resolved) {
    notFound();
  }

  return (
    <div className="relative h-screen overflow-hidden" style={{ background: '#1c1c1e' }}>
      {/* Top-left: back to catalog */}
      <Link
        href="/"
        className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        В каталог
      </Link>

      {/* Phone frame — centered */}
      <div className="flex h-full items-center justify-center overflow-hidden">
        <HtmlTemplateFrame html={resolved.html} />
      </div>

      {/* Bottom-center: Edit / create button */}
      <Link
        href="/create"
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-7 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Редактировать
      </Link>
    </div>
  );
}
