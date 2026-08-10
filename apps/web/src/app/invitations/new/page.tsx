/**
 * HTML-template editor — entry point for creating a new invitation.
 *
 * /invitations/new?template=<slug>
 *
 * Creates a draft invitation and redirects to the editor.
 * Works for both logged-in users and guests (creates draft, then requires login on save).
 */

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/shared/api';
import { getHtmlTemplateDescriptor } from '@/lib/templates/manifests';
import prisma from '@/lib/shared/db';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ template?: string; locale?: string }>;
}

export default async function NewInvitationPage({ searchParams }: Props) {
  const { template: templateKey = 'hello-world', locale = 'ru' } = await searchParams;

  const descriptor = getHtmlTemplateDescriptor(templateKey);
  if (!descriptor) {
    redirect('/templates');
  }

  const session = await getCurrentSession();
  const title = `Приглашение — ${descriptor.name}`;

  if (session) {
    // Generate unique slug for draft
    const id = crypto.randomUUID().split('-')[0];
    const slug = `draft-${id}`;

    // Create draft invitation and redirect to editor
    const invitation = await prisma.invitation.create({
      data: {
        userId: session.user.id,
        title,
        templateKey,
        slug,
        eventType: 'wedding',
        eventDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        eventTimezone: 'Asia/Almaty',
        status: 'draft',
      },
    });
    redirect(`/invitations/${invitation.id}/html-editor`);
  } else {
    // Not logged in — redirect to login with returnTo
    redirect(`/login?next=${encodeURIComponent(`/invitations/new?template=${encodeURIComponent(templateKey)}`)}`);
  }
}
