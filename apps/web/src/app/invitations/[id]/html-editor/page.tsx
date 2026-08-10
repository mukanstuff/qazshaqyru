/**
 * HTML-template editor page — auth-gated.
 *
 * /invitations/[id]/html-editor
 *
 * Requires user to own the invitation.
 * Loads invitation data and passes it to the editor shell.
 */

import { notFound, redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/shared/api';
import { getHtmlTemplateDescriptor } from '@/lib/templates/manifests';
import prisma from '@/lib/shared/db';
import { HtmlEditorShell } from '@/components/html-editor/HtmlEditorShell';
import type { HtmlEditorFields } from '@/lib/templates/html-engine/editor/types';
import type { Locale } from '@/lib/templates/html-engine/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HtmlEditorPage({ params }: Props) {
  const { id } = await params;
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/login?next=/invitations/${id}/html-editor`);
  }

  const inv = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      eventDate: true,
      eventTime: true,
      eventPlace: true,
      address: true,
      mapUrl: true,
      musicUrl: true,
      templateKey: true,
      customText: true,
      templateData: true,
    },
  });

  if (!inv) return notFound();

  // Only HTML-engine templates have this editor
  const descriptor = getHtmlTemplateDescriptor(inv.templateKey);
  if (!descriptor) {
    // Fall back to canvas editor
    redirect(`/invitations/${id}/canvas`);
  }

  // Build fields from DB
  const customText = (inv.customText ?? {}) as Record<string, unknown>;
  const templateData = (inv.templateData ?? {}) as Record<string, unknown>;

  const fields: HtmlEditorFields = {
    groomName: (customText.groomName as string) ?? '',
    brideName: (customText.brideName as string) ?? '',
    eventDate: inv.eventDate ? inv.eventDate.toISOString().slice(0, 10) : '',
    eventTime: inv.eventTime ?? '',
    eventPlace: inv.eventPlace ?? '',
    address: inv.address ?? '',
    greeting: (customText.greeting as string) ?? '',
    mapUrl: inv.mapUrl ?? '',
    whatsappPhone: (customText.whatsappPhone as string) ?? '',
    backgroundColor: (templateData.backgroundColor as string) ?? '',
    accentColorMode: (templateData.accentColorMode as 'default' | 'custom') ?? 'default',
    accentColor: (templateData.accentColor as string) ?? '#c8a96a',
    animationType: (templateData.animationType as string) as HtmlEditorFields['animationType'] ?? 'fade-in',
    animationDuration: (templateData.animationDuration as number) ?? 3.0,
    autoScroll: (templateData.autoScroll as boolean) ?? true,
    showEnvelope: (templateData.showEnvelope as boolean) ?? true,
    fontMode: (templateData.fontMode as 'template' | 'custom') ?? 'template',
    fontFamily: (templateData.fontFamily as string) ?? '',
    newTextFontMode: (templateData.newTextFontMode as 'environment' | 'custom') ?? 'environment',
    newTextFontFamily: (templateData.newTextFontFamily as string) ?? '',
    musicUrl: inv.musicUrl ?? '',
    musicStartSec: (templateData.musicStartSec as number) ?? 0,
    musicEndSec: (templateData.musicEndSec as number) ?? 180,
    galleryPhotos: (templateData.galleryPhotos as string[]) ?? [],
    cardTitle: (templateData.cardTitle as string) ?? '',
    cardDescription: (templateData.cardDescription as string) ?? '',
    cardImageUrl: (templateData.cardImageUrl as string) ?? '',
    slug: inv.slug,
    locale: ((customText.invitationLocale as string) ?? 'ru') as Locale,
  };

  return (
    <HtmlEditorShell
      mode="edit"
      invitationId={inv.id}
      slug={inv.slug}
      templateSlug={inv.templateKey}
      templateName={descriptor.name}
      fields={fields}
      isPublished={inv.status === 'published'}
      backHref={`/invitations/${inv.id}`}
    />
  );
}
