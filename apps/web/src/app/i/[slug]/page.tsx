import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicInvitationClient from './public-invitation-client';
import prisma from '@/lib/shared/db';
import { verifyPreviewToken } from '@/lib/invitations/preview-token';
import { getCurrentSession } from '@/lib/shared/api';

interface PageProps {
  params: { slug: string };
  searchParams: Promise<{
    guest?: string;
    layout?: string;
    family?: string;
    preview?: string;
    embed?: string;
    locale?: string;
  }>;
}

async function loadInvitationForMetadata(slug: string) {
  if (slug === 'demo') return null;
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      include: {
        user: { select: { language: true, name: true } },
        template: { select: { nameRu: true, nameKz: true, previewImageUrl: true, config: true } },
      },
    });
    return invitation;
  } catch {
    return null;
  }
}

async function loadInvitationForPage(slug: string) {
  if (slug === 'demo') return null;
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      include: {
        user: { select: { language: true } },
        template: { select: { slug: true } },
      },
    });
    return invitation;
  } catch {
    return null;
  }
}

function getOgImageUrl(baseUrl: string, slug: string): string {
  const path = `/api/og?slug=${encodeURIComponent(slug)}`;
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

function resolveAbsoluteUrl(baseUrl: string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildShareDescription(
  title: string,
  dateStr: string,
  eventTime: string | null | undefined,
  eventPlace: string | null | undefined,
): string {
  const timePart = eventTime ? `, ${eventTime}` : '';
  const placePart = eventPlace ? ` · ${eventPlace}` : '';
  return `Приглашаем вас: ${title} · ${dateStr}${timePart}${placePart}`;
}

/**
 * Step 1.2: HTML-engine templates (hello-world, test-demo) were removed.
 * Middleware intercepts /i/<legacy-html-slug> with a true HTTP 410 before
 * this page renders. No server-component workaround needed.
 */
const LEGACY_HTML_TEMPLATE_SLUGS = new Set<string>(); // reserved — middleware is the source of truth.

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { family, preview } = await searchParams;
  const rawSlug = params.slug;

  if (rawSlug === 'demo') {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const dateStr = futureDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const baseUrl = process.env.APP_URL || '';
    const title = `Асет & Айым — ${dateStr}`;
    const description = buildShareDescription('Асет & Айым', dateStr, '15:00', 'Ресторан «Жарық»');
    const ogImageUrl = getOgImageUrl(baseUrl, 'demo');
    const pageUrl = resolveAbsoluteUrl(baseUrl, '/i/demo');

    return {
      title,
      description,
      openGraph: {
        title: 'Асет & Айым',
        description,
        type: 'website',
        url: pageUrl,
        locale: 'ru_RU',
        images: [
          {
            url: ogImageUrl,
            secureUrl: ogImageUrl.startsWith('https') ? ogImageUrl : undefined,
            width: 1200,
            height: 630,
            alt: 'Демо-приглашение QazShaqyru',
            type: 'image/png',
          },
        ],
        siteName: 'QazShaqyru',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Асет & Айым',
        description,
        images: [ogImageUrl],
      },
    };
  }

  if (LEGACY_HTML_TEMPLATE_SLUGS.has(rawSlug)) {
    return { title: 'Шаблон удалён', robots: { index: false, follow: false } };
  }

  const decodedSlug = decodeURIComponent(rawSlug);
  const invitation = await loadInvitationForMetadata(decodedSlug);
  const familyToken = family || preview || null;

  if (familyToken && invitation && verifyPreviewToken(familyToken, invitation.previewTokenHash)) {
    return {
      title: `${invitation.title} — семейный просмотр`,
      robots: { index: false, follow: false },
    };
  }

  if (!invitation || invitation.status !== 'published') {
    return {
      title: 'Приглашение не найдено',
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = process.env.APP_URL || '';
  const eventDate = new Date(invitation.eventDate);
  const dateStr = eventDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const pageTitle = `${invitation.title} — ${dateStr}`;
  const shareTitle = invitation.title;
  const description = buildShareDescription(
    invitation.title,
    dateStr,
    invitation.eventTime,
    invitation.eventPlace,
  );

  const ogImageUrl = getOgImageUrl(baseUrl, decodedSlug);
  const pageUrl = resolveAbsoluteUrl(baseUrl, `/i/${decodedSlug}`);
  const locale = invitation.user?.language === 'kz' ? 'kk_KZ' : 'ru_RU';

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: shareTitle,
      description,
      type: 'website',
      url: pageUrl,
      locale,
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl.startsWith('https') ? ogImageUrl : undefined,
          width: 1200,
          height: 630,
          alt: shareTitle,
          type: 'image/png',
        },
      ],
      siteName: 'QazShaqyru',
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

/** Step 1.2: page-level dispatcher. Legacy html-engine slugs are intercepted by middleware (410). */
export default async function PublicInvitationPage({ params, searchParams }: PageProps) {
  const { guest, layout, family, preview, embed } = await searchParams;
  const familyToken = family || preview || null;
  const rawSlug = params.slug;

  // demo branch keeps working without html-engine
  if (rawSlug === 'demo') {
    return (
      <PublicInvitationClient
        slug={rawSlug}
        guestToken={guest || null}
        familyToken={familyToken}
        demoLayout={layout}
        embedPreview={embed === '1'}
      />
    );
  }

  const decodedSlug = decodeURIComponent(rawSlug);
  const invitation = await loadInvitationForPage(decodedSlug);
  if (!invitation) notFound();
  if (invitation.status !== 'published') {
    const session = await getCurrentSession();
    const isOwner = session?.user.id === invitation.userId;
    if (!isOwner && (!familyToken || !verifyPreviewToken(familyToken, invitation.previewTokenHash))) {
      notFound();
    }
  }

  return (
    <PublicInvitationClient
      slug={rawSlug}
      guestToken={guest || null}
      familyToken={familyToken}
      demoLayout={layout}
      embedPreview={embed === '1'}
    />
  );
}

export const dynamic = 'force-dynamic';
