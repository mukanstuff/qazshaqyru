import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { CanvasEditorClient } from './CanvasEditorClient';
import { ManifestCanvasClient } from './ManifestCanvasClient';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';
import { parseCanvasOrEmpty } from '@/lib/canvas/validation';
import { getI18n } from '@/i18n/server';
import { ensureCanvasDocument } from '@/lib/invitations/ensure-canvas';
import { getTemplateManifest } from '@/lib/templates/manifests';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import { instantiateInvitationDocument } from '@/lib/templates/instantiate-document';
import { documentToInvitationData } from '@/lib/invitations/document';
import type { InvitationData } from '@/components/invitation-layouts/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CanvasEditorPage({ params }: Props) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) redirect('/login?next=/invitations/' + encodeURIComponent(id) + '/canvas');

  // Pull a minimal set first to decide which editor branch to use.
  const inv = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      slug: true,
      title: true,
      eventType: true,
      eventDate: true,
      eventTime: true,
      eventPlace: true,
      address: true,
      eventTimezone: true,
      templateData: true,
      musicUrl: true,
      mapUrl: true,
      customText: true,
      canvas: true,
      templateId: true,
      templateKey: true,
      status: true,
    },
  });
  if (!inv) return notFound();

  const { locale } = await getI18n();

  // ─── Branch A: manifest-based template ─────────────────────────────────
  // The template has a manifest (e.g. wedding-luxury). Render through the
  // same InvitationLayoutRouter that powers /preview and /i/[slug], so the
  // owner sees exactly what guests will see. Canvas-document is NOT the
  // source of truth here — it was an experimental side-channel that didn't
  // get seeded with manifest content.
  const manifestTemplate = inv.templateKey
    ? await resolveTemplateBySlug(inv.templateKey)
    : inv.templateId
      ? await prisma.template.findUnique({
          where: { id: inv.templateId },
          select: { id: true, slug: true, nameRu: true, canvas: true },
        })
      : null;
  const manifest = manifestTemplate ? getTemplateManifest(manifestTemplate.slug) : null;
  if (manifest && manifestTemplate) {
    // Seed InvitationData from the manifest's instantiated document so that
    // placeholders/coupledNames default correctly; merge persisted fields
    // on top.
    const seeded = documentToInvitationData(
      instantiateInvitationDocument(manifest, {
        templateId: manifestTemplate.id,
        locale,
      }),
    );
    const customText = (inv.customText as Record<string, unknown> | null) ?? {};
    const templateData = (inv.templateData as Record<string, unknown> | null) ?? {};
    const invitationData: InvitationData = {
      ...seeded,
      id: inv.id,
      slug: inv.slug,
      title: inv.title,
      eventType: inv.eventType,
      eventDate: (inv.eventDate instanceof Date
        ? inv.eventDate
        : new Date(inv.eventDate)
      ).toISOString(),
      eventTime: inv.eventTime ?? null,
      eventPlace: inv.eventPlace ?? null,
      address: inv.address ?? null,
      eventTimezone: inv.eventTimezone,
      templateKey: manifestTemplate.slug,
      templateData: {
        ...(seeded.templateData ?? {}),
        ...templateData,
      },
      musicUrl: inv.musicUrl ?? null,
      mapUrl: inv.mapUrl ?? null,
      customText: {
        ...(seeded.customText ?? {}),
        ...customText,
      },
      language: (customText.invitationLocale as 'ru' | 'kz') || locale,
      isPast: (inv.eventDate instanceof Date
        ? inv.eventDate
        : new Date(inv.eventDate)
      ).getTime() < Date.now(),
      showWatermark: inv.status !== 'published',
    };

    const shareUrl = `/i/${inv.slug}`;
    return (
      <ManifestCanvasClient
        invitationId={id}
        initialInvitation={JSON.parse(JSON.stringify(invitationData))}
        shareUrl={shareUrl}
        locale={locale}
      />
    );
  }

  // ─── Branch B: canvas-document based (custom templates without manifest) ──
  // Ensure canvas exists, then parse it for the editor.
  if (!inv.canvas) {
    await prisma.$transaction(async (tx) => {
      await ensureCanvasDocument(tx, id);
    });
    const refreshed = await prisma.invitation.findUnique({
      where: { id },
      select: { canvas: true },
    });
    if (refreshed?.canvas) {
      (inv as { canvas: unknown }).canvas = refreshed.canvas;
    }
  }

  let document;
  if (inv.canvas) {
    document = parseCanvasOrEmpty(inv.canvas);
  } else {
    document = convertLegacyToCanvas({
      title: inv.title,
      eventType: inv.eventType,
      eventDate: inv.eventDate,
      eventTime: inv.eventTime,
      eventPlace: inv.eventPlace,
      address: inv.address,
      eventTimezone: inv.eventTimezone || 'Asia/Almaty',
      templateData: (inv.templateData as Record<string, unknown> | null) ?? {},
      musicUrl: inv.musicUrl,
      mapUrl: inv.mapUrl,
      customText: (inv.customText as Record<string, unknown> | null) ?? {},
    });
  }

  const shareUrl = `/i/${inv.slug}`;
  return (
    <div className="h-[calc(100dvh-56px)] w-full">
      <CanvasEditorClient
        invitationId={id}
        initialDocument={JSON.parse(JSON.stringify(document))}
        shareUrl={shareUrl}
        locale={locale}
      />
    </div>
  );
}