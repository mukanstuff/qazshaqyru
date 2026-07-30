import type { Prisma } from '@prisma/client';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 2026-07-30 SACRED — CANVAS IS THE PRIMARY DOCUMENT PATH FROM CREATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PRODUCT RULE (PRODUCT_MODEL_AND_RULES.md + PRODUCT_DECISIONS_2026-07-30.md):
 *   Pay template.priceKzt once = fullAccess.
 *   Canvas is the canonical renderer + storage for ALL new invitations.
 *   Legacy section-engine (InvitationLayoutRouter + wedding-luxury) is ONLY
 *   a migration fallback for ancient rows that never received canvas.
 * 
 * This helper is called from:
 *   - InvitationService.create (MUST seed at birth)
 *   - order-completion (post-pay guarantee)
 *   - draft-sync (early write from wizard)
 *   - public canvas API (for paid published)
 * 
 * NO path may create/publish a new invitation without a canvas document.
 * fullAccess invitations are always rendered via CanvasGuestPage / CanvasRenderer.
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

  // 2026-07-30: always attempt to seed from wizard data + templateData.
  // Converter is temporary bridge until admin templates emit real canvas blueprints.
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
}
