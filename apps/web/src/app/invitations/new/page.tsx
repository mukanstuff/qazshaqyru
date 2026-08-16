/**
 * New invitation entry point.
 *
 * /invitations/new?template=<slug>
 *
 * Canvas-backed templates only: a Template row with isActive=true in the DB
 * resolves to /canvas.
 *
 * Behaviour is unchanged until a canvas template is marked isActive in the DB —
 * at that point it automatically picks up the canvas editor without any further
 * code changes.
 */

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/shared/api';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import prisma from '@/lib/shared/db';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ template?: string; locale?: string }>;
}

export default async function NewInvitationPage({ searchParams }: Props) {
  const { template: templateKey = 'hello-world', locale = 'ru' } = await searchParams;

  const template = await resolveTemplateBySlug(templateKey);
  if (!template) {
    redirect('/templates');
  }

  // For the title, fall back to the slug if nameRu is missing in the DB row
  const displayName = template.nameRu || templateKey;

  const session = await getCurrentSession();
  const title = `Приглашение — ${displayName}`;

  if (session) {
    const id = crypto.randomUUID().split('-')[0];
    const slug = `draft-${id}`;

    const invitation = await prisma.invitation.create({
      data: {
        userId: session.user.id,
        title,
        templateId: template.id,
        templateKey: template.slug,
        slug,
        eventType: 'wedding',
        eventDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        eventTimezone: 'Asia/Almaty',
        status: 'draft',
      },
    });

    const editorHref = `/invitations/${invitation.id}/canvas`;
    redirect(editorHref);
  } else {
    // Not logged in — redirect to login with returnTo
    redirect(`/login?next=${encodeURIComponent(`/invitations/new?template=${encodeURIComponent(templateKey)}`)}`);
  }
}
