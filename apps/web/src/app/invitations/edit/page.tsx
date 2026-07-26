import { redirect } from 'next/navigation';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { LiveEditorPage } from '@/components/live-editor/LiveEditorPage';
import { SuretEditorPage } from '@/components/suret/SuretEditorPage';
import { DEFAULT_TEMPLATE_SLUG } from '@/lib/templates/catalog';
import { ALL_TEMPLATE_SLUGS } from '@/lib/templates';
import { getTemplateManifest } from '@/lib/templates/manifests';
import { resolveSuretManifest } from '@/lib/templates/suret-resolve';
import { isEventPast } from '@/lib/shared/event-datetime';
import type { InvitationData } from '@/components/invitation-layouts/types';
import { getI18n } from '@/i18n/server';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ template?: string; invitationId?: string }>;
}

function toInvitationData(
  invitation: {
    id: string;
    slug: string;
    title: string;
    eventType: string;
    eventDate: Date;
    eventTime: string | null;
    eventPlace: string | null;
    eventTimezone: string;
    templateKey: string;
    templateData: unknown;
    musicUrl: string | null;
    mapUrl: string | null;
    address: string | null;
    customText: unknown;
  },
  hostName: string | null,
  language: string,
): InvitationData {
  return {
    id: invitation.id,
    slug: invitation.slug,
    title: invitation.title,
    eventType: invitation.eventType,
    eventDate: invitation.eventDate.toISOString(),
    eventTime: invitation.eventTime,
    eventPlace: invitation.eventPlace,
    eventTimezone: invitation.eventTimezone,
    templateKey: invitation.templateKey,
    templateData: invitation.templateData as InvitationData['templateData'],
    musicUrl: invitation.musicUrl,
    mapUrl: invitation.mapUrl,
    address: invitation.address,
    customText: invitation.customText as Record<string, unknown>,
    language: language === 'kz' ? 'kz' : 'ru',
    hostName,
    isPast: isEventPast(invitation.eventDate, invitation.eventTime, invitation.eventTimezone),
  };
}

export default async function EditInvitationPage({ searchParams }: Props) {
  const { template: templateKey, invitationId } = await searchParams;

  if (!templateKey) {
    redirect('/templates');
  }

  const suretManifest = resolveSuretManifest(templateKey);
  if (suretManifest) {
    const template = await prisma.template.findFirst({
      where: { slug: suretManifest.slug, isActive: true },
      select: { id: true, slug: true, nameRu: true },
    });
    if (!template) {
      redirect('/templates');
    }

    const ctx = await getCurrentSession();
    if (!ctx) {
      redirect(
        `/login?next=${encodeURIComponent(`/invitations/edit?template=${suretManifest.slug}${invitationId ? `&invitationId=${invitationId}` : ''}`)}`,
      );
    }

    if (invitationId) {
      const invitation = await prisma.invitation.findFirst({
        where: { id: invitationId, userId: ctx.user.id },
      });
      if (!invitation || invitation.status === 'archived') {
        redirect('/dashboard');
      }
      if (invitation.templateKey !== suretManifest.slug) {
        redirect(
          `/invitations/edit?template=${encodeURIComponent(invitation.templateKey)}&invitationId=${invitationId}`,
        );
      }
      return (
        <SuretEditorPage
          manifest={suretManifest}
          templateId={template.id}
          editInvitation={toInvitationData(invitation, ctx.user.name, ctx.user.language)}
          isPublished={invitation.status === 'published'}
        />
      );
    }

    return <SuretEditorPage manifest={suretManifest} templateId={template.id} />;
  }

  const validKey = ALL_TEMPLATE_SLUGS.includes(templateKey) ? templateKey : DEFAULT_TEMPLATE_SLUG;

  if (!getTemplateManifest(validKey)) {
    redirect('/templates');
  }

  const template = await prisma.template.findFirst({
    where: { slug: validKey, isActive: true },
    select: { id: true, slug: true, nameRu: true, nameKz: true },
  });

  if (!template) {
    redirect('/templates');
  }

  const { locale } = await getI18n();
  const props = {
    templateKey: validKey,
    templateId: template.id,
    templateName: locale === 'kz' ? template.nameKz || template.nameRu : template.nameRu,
  };

  if (invitationId) {
    const ctx = await getCurrentSession();
    if (!ctx) redirect('/login');

    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, userId: ctx.user.id },
    });

    if (!invitation || invitation.status === 'archived') {
      redirect('/dashboard');
    }

    if (invitation.templateKey !== validKey) {
      redirect(
        `/invitations/edit?template=${encodeURIComponent(invitation.templateKey)}&invitationId=${invitationId}`,
      );
    }

    return (
      <LiveEditorPage
        {...props}
        editInvitation={toInvitationData(invitation, ctx.user.name, ctx.user.language)}
        isPublished={invitation.status === 'published'}
      />
    );
  }

  return <LiveEditorPage {...props} />;
}
