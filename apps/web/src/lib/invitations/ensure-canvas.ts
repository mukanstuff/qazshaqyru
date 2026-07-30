import type { Prisma } from '@prisma/client';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';

/**
 * 2026-07-30 — CENTRAL CANVAS SEED HELPER
 * 
 * Ensures that an invitation has a canvas document.
 * Called from:
 *  - InvitationService.create (primary path)
 *  - order-completion (payment success)
 *  - draft-sync (early write)
 * 
 * This makes canvas the single source of truth for all new flows.
 */
export async function ensureCanvasDocument(
  tx: Prisma.TransactionClient,
  invitationId: string
): Promise<void> {
  const inv = await tx.invitation.findUnique({
    where: { id: invitationId },
    select: {
      canvas: true,
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
    },
  });

  if (!inv || inv.canvas) return;

  try {
    const doc = convertLegacyToCanvas({
      title: inv.title,
      eventType: inv.eventType,
      eventDate: inv.eventDate,
      eventTime: inv.eventTime,
      eventPlace: inv.eventPlace,
      address: inv.address,
      eventTimezone: inv.eventTimezone || 'Asia/Almaty',
      templateData: inv.templateData as any,
      musicUrl: inv.musicUrl,
      mapUrl: inv.mapUrl,
      customText: inv.customText as any,
    });

    await tx.invitation.update({
      where: { id: invitationId },
      data: { canvas: doc as any },
    });
  } catch (e) {
    // non-fatal — will be created on first real edit
    console.warn('[ensure-canvas] failed to seed canvas for', invitationId);
  }
}
