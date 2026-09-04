/**
 * /editor/new — "start from scratch" for an ordinary signed-in user.
 *
 * The catalog's «Соберите приглашение с нуля» card used to link straight to
 * `/admin/templates/builder?new=1`. That is the admin tool for authoring
 * catalog *templates*: it is gated on `session.user.isAdmin` (so a normal
 * customer was bounced to /admin and got nothing), and for an admin it minted
 * a throwaway `custom-*` row in the Template table on every visit. Either way
 * it never produced an invitation for the person who clicked it.
 *
 * This route creates a real draft Invitation owned by the caller, seeded with
 * the neutral starter canvas, and hands it to the normal user editor.
 */
import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import type { Prisma } from '@prisma/client';

import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { getI18n } from '@/i18n/server';
import { buildDefaultInvitationCanvas } from '@/lib/canvas/default-document';
import { ensureCanvasDocument } from '@/lib/invitations/ensure-canvas';

export const dynamic = 'force-dynamic';

/** URL label for drafts that came from no catalog template. */
const SCRATCH_TEMPLATE_KEY = 'scratch';

export default async function NewBlankInvitationPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent('/editor/new')}`);
  }

  const { locale } = await getI18n();
  const eventDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const document = buildDefaultInvitationCanvas({ locale, eventDate });

  let invitationId: string | null = null;
  for (let attempt = 0; attempt < 3 && !invitationId; attempt += 1) {
    const slug = `draft-${nanoid(10)}`;
    try {
      const inv = await prisma.invitation.create({
        data: {
          userId: session.user.id,
          title: locale === 'kz' ? 'Жаңа шақыру' : 'Новое приглашение',
          slug,
          eventType: 'wedding',
          eventDate,
          eventTimezone: 'Asia/Almaty',
          // No catalog template behind this draft — templateKey is a label the
          // editor URL carries, templateId stays null.
          templateKey: SCRATCH_TEMPLATE_KEY,
          templateId: null,
          status: 'draft',
          canvas: document as unknown as object,
        },
        select: { id: true },
      });
      invitationId = inv.id;
    } catch (err) {
      // P2002 = slug collision; anything else is a real failure.
      if ((err as { code?: string } | null)?.code !== 'P2002') throw err;
    }
  }

  if (!invitationId) {
    redirect('/templates');
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await ensureCanvasDocument(tx, invitationId!);
  });

  redirect(`/editor/${SCRATCH_TEMPLATE_KEY}?id=${invitationId}`);
}
