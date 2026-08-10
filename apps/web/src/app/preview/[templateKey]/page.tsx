/**
 * Preview + inline editor page.
 *
 * /preview/[templateKey]?invitationId=<uuid>
 *
 * Unified workbench: renders the HTML template preview and lets the user
 * edit it inline without ever navigating away. No redirect to /invitations/new.
 *
 * - When authenticated and invitationId is given, the editor loads/saves to DB.
 * - When NOT authenticated or no invitationId, the editor works in local-only
 *   mode (draft state is kept in memory and lost on reload — typical for guest
 *   browsing the catalog).
 *
 * Behaviour matches toi.com.kz UX (preview + edit on the same page).
 */

import { getI18n } from '@/i18n/server';
import { getCurrentSession } from '@/lib/shared/api';
import { getHtmlTemplateDescriptor } from '@/lib/templates/manifests';
import { renderHtmlTemplate } from '@/lib/templates/html-engine/renderer';
import { notFound } from 'next/navigation';
import { PreviewWithInlineEditor } from './_components/PreviewWithInlineEditor';
import type { Locale } from '@/lib/templates/html-engine/types';
import type { HtmlEditorFields } from '@/lib/templates/html-engine/editor/types';
import prisma from '@/lib/shared/db';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ templateKey: string }>;
  searchParams: Promise<{ invitationId?: string }>;
}

/** Build demo data with sensible defaults for the chosen template + locale. */
function getDemoTemplateData(slug: string, locale: 'kz' | 'ru') {
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return {
    locale,
    fields: {
      eventDate: futureDate.toISOString(),
      eventTime: '17:00',
      eventPlace: locale === 'kz' ? 'Мейрамхана «Жарық»' : 'Ресторан «Жарық»',
      address: locale === 'kz' ? 'г. Алматы, мейрамхана «Жарық»' : 'г. Алматы, ресторан «Жарық»',
      groomName: locale === 'kz' ? 'Нұрлан' : 'Нурлан',
      brideName: locale === 'kz' ? 'Айгерім' : 'Айгерим',
      greeting: locale === 'kz'
        ? 'Құрметті аға-апа, бауырлар!\nСіздерді біздің өміріміздің ең бақытты күнін бірге өткізуге шақырамыз!'
        : 'Дорогие наши родные и друзья!\nПриглашаем вас разделить с нами самый счастливый день нашей жизни!',
    },
    musicUrl: null,
    assets: {},
    defaults: {},
  };
}

export default async function PreviewPage({ params, searchParams }: Props) {
  const { templateKey: slug } = await params;
  const { invitationId } = await searchParams;
  const { locale } = await getI18n();
  const effectiveLocale = (locale === 'kz' ? 'kz' : 'ru') as Locale;
  const backHref = locale === 'kz' ? '/kz/templates' : '/ru/templates';

  const descriptor = getHtmlTemplateDescriptor(slug);
  if (!descriptor) {
    return notFound();
  }

  // Render template (server-side) for initial preview
  const templateData = getDemoTemplateData(slug, effectiveLocale);
  const rendered = renderHtmlTemplate(descriptor, templateData);
  if (!rendered.ok) {
    console.error('Template render failed:', rendered.error);
    return notFound();
  }

  // Try to load existing draft if invitationId is provided
  let initialFields: Partial<HtmlEditorFields> | undefined;
  let initialRsvp: { showPhone?: boolean; showGuestCount?: boolean; showWishes?: boolean } | undefined;
  let resolvedInvitationId: string | undefined;
  let isPublished = false;

  if (invitationId) {
    const session = await getCurrentSession();
    if (session) {
      const inv = await prisma.invitation.findFirst({
        where: { id: invitationId, userId: session.user.id },
        select: {
          id: true,
          status: true,
          eventDate: true,
          eventTime: true,
          eventPlace: true,
          address: true,
          mapUrl: true,
          musicUrl: true,
          customText: true,
          templateData: true,
        },
      });
      if (inv) {
        resolvedInvitationId = inv.id;
        isPublished = inv.status === 'published';
        const customText = (inv.customText ?? {}) as Record<string, unknown>;
        const tdata = (inv.templateData ?? {}) as Record<string, unknown>;
        initialFields = {
          groomName: (customText.groomName as string) ?? '',
          brideName: (customText.brideName as string) ?? '',
          eventDate: inv.eventDate ? inv.eventDate.toISOString().slice(0, 10) : '',
          eventTime: inv.eventTime ?? '',
          eventPlace: inv.eventPlace ?? '',
          address: inv.address ?? '',
          greeting: (customText.greeting as string) ?? '',
          mapUrl: inv.mapUrl ?? '',
          whatsappPhone: (customText.whatsappPhone as string) ?? '',
          backgroundColor: (tdata.backgroundColor as string) ?? '',
          accentColorMode: (tdata.accentColorMode as 'default' | 'custom') ?? 'default',
          accentColor: (tdata.accentColor as string) ?? '#c8a96a',
          animationType: ((tdata.animationType as string) ?? 'fade-in') as HtmlEditorFields['animationType'],
          animationDuration: (tdata.animationDuration as number) ?? 3.0,
          autoScroll: (tdata.autoScroll as boolean) ?? true,
          showEnvelope: (tdata.showEnvelope as boolean) ?? true,
          fontMode: (tdata.fontMode as 'template' | 'custom') ?? 'template',
          fontFamily: (tdata.fontFamily as string) ?? '',
          newTextFontMode: (tdata.newTextFontMode as 'environment' | 'custom') ?? 'environment',
          newTextFontFamily: (tdata.newTextFontFamily as string) ?? '',
          musicUrl: inv.musicUrl ?? '',
          musicStartSec: (tdata.musicStartSec as number) ?? 0,
          musicEndSec: (tdata.musicEndSec as number) ?? 180,
          galleryPhotos: (tdata.galleryPhotos as string[]) ?? [],
          cardTitle: (tdata.cardTitle as string) ?? '',
          cardDescription: (tdata.cardDescription as string) ?? '',
          cardImageUrl: (tdata.cardImageUrl as string) ?? '',
          locale: ((customText.invitationLocale as string) ?? effectiveLocale) as Locale,
        };
        initialRsvp = (tdata.rsvp as typeof initialRsvp) ?? undefined;
      }
    }
  }

  return (
    <PreviewWithInlineEditor
      templateSlug={slug}
      templateName={descriptor.name}
      backHref={backHref}
      locale={effectiveLocale}
      initialHtml={rendered.html}
      initialFields={initialFields}
      initialRsvp={initialRsvp}
      invitationId={resolvedInvitationId}
      isPublished={isPublished}
    />
  );
}