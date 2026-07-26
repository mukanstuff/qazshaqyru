import { Metadata } from 'next';
import PublicInvitationClient from './public-invitation-client';
import prisma from '@/lib/shared/db';
import { notFound } from 'next/navigation';
import { verifyPreviewToken } from '@/lib/invitations/preview-token';

interface PageProps {
  params: { slug: string };
  searchParams: Promise<{ guest?: string; layout?: string; family?: string; preview?: string; embed?: string }>;
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

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = params;
  const { preview, family } = await searchParams;
  const familyToken = family || preview || null;

  if (slug === 'demo') {
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

  const invitation = await loadInvitationForMetadata(slug);

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
  const dateStr = eventDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const pageTitle = `${invitation.title} — ${dateStr}`;
  const shareTitle = invitation.title;
  const description = buildShareDescription(
    invitation.title,
    dateStr,
    invitation.eventTime,
    invitation.eventPlace,
  );

  const ogImageUrl = getOgImageUrl(baseUrl, slug);
  const pageUrl = resolveAbsoluteUrl(baseUrl, `/i/${slug}`);
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

export default async function PublicInvitationPage({ params, searchParams }: PageProps) {
  const { guest, layout, family, preview, embed } = await searchParams;
  const familyToken = family || preview || null;

  if (params.slug !== 'demo') {
    const invitation = await loadInvitationForMetadata(params.slug);
    if (!invitation) {
      notFound();
    }
    if (invitation.status !== 'published') {
      if (!familyToken || !verifyPreviewToken(familyToken, invitation.previewTokenHash)) {
        notFound();
      }
    }
  }

  return (
    <PublicInvitationClient
      slug={params.slug}
      guestToken={guest || null}
      familyToken={familyToken}
      demoLayout={layout}
      embedPreview={embed === '1'}
    />
  );
}
