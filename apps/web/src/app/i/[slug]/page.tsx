import { Metadata } from 'next';
import PublicInvitationClient from './public-invitation-client';
import prisma from '@/lib/db';
import { headers } from 'next/headers';

interface PageProps {
  params: { slug: string };
  searchParams: { guest?: string };
}

async function loadInvitationForMetadata(slug: string) {
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;
  const invitation = await loadInvitationForMetadata(slug);

  if (!invitation || invitation.status !== 'published') {
    return {
      title: 'Приглашение не найдено',
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = process.env.APP_URL || '';
  const eventDate = new Date(invitation.eventDate);
  const dateStr = eventDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const title = `${invitation.title} — ${dateStr}`;
  const description = invitation.eventPlace
    ? `${invitation.title} • ${dateStr}${invitation.eventTime ? `, ${invitation.eventTime}` : ''} • ${invitation.eventPlace}`
    : `${invitation.title} • ${dateStr}`;

  const previewImage =
    (invitation.templateData as { backgroundImage?: string })?.backgroundImage ||
    invitation.template?.previewImageUrl ||
    `${baseUrl}/api/og?slug=${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/i/${slug}`,
      images: [{ url: previewImage, width: 1200, height: 630, alt: title }],
      siteName: 'Invito',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [previewImage],
    },
  };
}

export default async function PublicInvitationPage({ params, searchParams }: PageProps) {
  const headersList = await headers();
  const guestToken = searchParams.guest;

  return (
    <PublicInvitationClient
      slug={params.slug}
      guestToken={guestToken || null}
      initialUserAgent={headersList.get('user-agent') || ''}
    />
  );
}
