import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { CanvasEditorClient } from './CanvasEditorClient';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';
import { parseCanvasOrEmpty } from '@/lib/canvas/validation';
import { getI18n } from '@/i18n/server';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CanvasEditorPage({ params }: Props) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) redirect('/login?next=/invitations/' + encodeURIComponent(id) + '/canvas');

  const raw = (await prisma.$queryRawUnsafe(
    `SELECT id, slug, "userId", title, "eventType", "eventDate", "eventTime", "eventPlace", address, "eventTimezone", "templateData", "musicUrl", "mapUrl", "customText", canvas
     FROM "Invitation" WHERE id = $1`,
    id
  ).catch(() => null)) as unknown as Array<Record<string, unknown>> | null;

  if (!raw || raw.length === 0) return notFound();
  const inv = raw[0] as Record<string, unknown>;
  if (inv.userId !== session.user.id && !session.user.isAdmin) return notFound();

  let document;
  if (inv.canvas) {
    document = parseCanvasOrEmpty(inv.canvas);
  } else {
    document = convertLegacyToCanvas({
      title: inv.title as string,
      eventType: inv.eventType as string,
      eventDate: inv.eventDate as Date | string | undefined,
      eventTime: inv.eventTime as string | null | undefined,
      eventPlace: inv.eventPlace as string | null | undefined,
      address: inv.address as string | null | undefined,
      eventTimezone: (inv.eventTimezone as string) || 'Asia/Almaty',
      templateData: inv.templateData as Record<string, unknown> | null,
      musicUrl: inv.musicUrl as string | null | undefined,
      mapUrl: inv.mapUrl as string | null | undefined,
      customText: inv.customText as Record<string, unknown> | null,
    });
  }

  const { locale } = await getI18n();
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
