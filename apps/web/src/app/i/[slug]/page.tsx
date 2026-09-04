import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicInvitationClient from './public-invitation-client';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { getI18n } from '@/i18n/server';

interface PageProps {
  params: { slug: string };
  searchParams: Promise<{
    guest?: string;
    locale?: string;
  }>;
}

async function loadInvitationForMetadata(slug: string) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      include: {
        user: { select: { language: true, name: true } },
        template: { select: { nameRu: true, nameKz: true, previewImageUrl: true } },
      },
    });
    return invitation;
  } catch {
    return null;
  }
}

async function loadInvitationForPage(slug: string) {
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

/**
 * Metadata for a guest invitation follows the INVITATION's language, not the
 * server default.
 *
 * The date was formatted with a hardcoded 'ru-RU' and the share line was a
 * Russian literal, so a Kazakh invitation produced a browser tab reading
 * "Айдар және Айсұлу — 15 мая 2027 г." and a WhatsApp link preview that opened
 * with "Приглашаем вас:" — on the single artefact this product exists to hand
 * to guests. The owner's language was already loaded here and simply unused.
 */
type InviteLocale = 'kz' | 'ru';

function formatInvitationDate(date: Date, locale: InviteLocale): string {
  return date.toLocaleDateString(locale === 'kz' ? 'kk-KZ' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function buildShareDescription(
  title: string,
  dateStr: string,
  eventTime: string | null | undefined,
  eventPlace: string | null | undefined,
  locale: InviteLocale,
): string {
  const timePart = eventTime ? `, ${eventTime}` : '';
  const placePart = eventPlace ? ` · ${eventPlace}` : '';
  const lead = locale === 'kz' ? 'Сіздерді шақырамыз' : 'Приглашаем вас';
  return `${lead}: ${title} · ${dateStr}${timePart}${placePart}`;
}

/**
 * Step 1.2: HTML-engine templates (hello-world, test-demo) were removed.
 * Middleware intercepts /i/<legacy-html-slug> with a true HTTP 410 before
 * this page renders. No server-component workaround needed.
 */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const rawSlug = params.slug;
  const { t } = await getI18n();

  const decodedSlug = decodeURIComponent(rawSlug);
  const invitation = await loadInvitationForMetadata(decodedSlug);

  if (!invitation || invitation.status !== 'published') {
    return {
      title: t('site.meta.invitationNotFound'),
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = process.env.APP_URL || '';
  const inviteLocale: InviteLocale = invitation.user?.language === 'kz' ? 'kz' : 'ru';
  const eventDate = new Date(invitation.eventDate);
  const dateStr = formatInvitationDate(eventDate, inviteLocale);
  const pageTitle = `${invitation.title} — ${dateStr}`;
  const shareTitle = invitation.title;
  const description = buildShareDescription(
    invitation.title,
    dateStr,
    invitation.eventTime,
    invitation.eventPlace,
    inviteLocale,
  );

  const ogImageUrl = getOgImageUrl(baseUrl, decodedSlug);
  const pageUrl = resolveAbsoluteUrl(baseUrl, `/i/${decodedSlug}`);
  const locale = inviteLocale === 'kz' ? 'kk_KZ' : 'ru_RU';

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
  const { guest } = await searchParams;
  const rawSlug = params.slug;

  const decodedSlug = decodeURIComponent(rawSlug);
  const invitation = await loadInvitationForPage(decodedSlug);
  if (!invitation) notFound();
  // An unpublished invitation is for its owner's eyes only. The `?preview=`
  // family token that used to open this door was never mintable and no row
  // ever carried a hash for it, so the branch could only ever fall through.
  if (invitation.status !== 'published') {
    const session = await getCurrentSession();
    if (session?.user.id !== invitation.userId) notFound();
  }

  return <PublicInvitationClient slug={rawSlug} guestToken={guest || null} />;
}

export const dynamic = 'force-dynamic';
