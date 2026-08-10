import type { Prisma } from '@prisma/client';
import { convertLegacyToCanvas } from '@/lib/canvas/legacy-converter';
import { applyWizardToCanvasDocument } from '@/lib/canvas/apply-wizard-placeholders';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

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
  invitationId: string,
  overrides?: {
    customText?: Record<string, unknown>;
    templateData?: Record<string, unknown>;
  }
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
      template: { select: { canvas: true } },
    },
  });

  if (!inv || inv.canvas) return;

  const templateCanvas = inv.template?.canvas;
  // Wizard data takes precedence over DB record (needed when ensure is called
  // inside the same tx that created the invitation — DB row not yet committed).
  const customText = overrides?.customText
    ?? ((inv.customText as Record<string, unknown> | null) ?? {});
  const templateData = overrides?.templateData
    ?? ((inv.templateData as Record<string, unknown>) ?? {});
  const wizardForm = {
    names: [customText.groomName, customText.brideName].filter(Boolean).join(' & '),
    eventDate: inv.eventDate?.toISOString(),
    eventPlace: inv.eventPlace ?? undefined,
    address: inv.address ?? undefined,
    coverPhoto: typeof templateData.coverPhoto === 'string'
      ? templateData.coverPhoto
      : undefined,
  };
  const doc = templateCanvas
    ? applyWizardToCanvasDocument(
        JSON.parse(JSON.stringify(templateCanvas)) as InvitationCanvasDocument,
        wizardForm
      )
    : convertLegacyToCanvas({
        title: inv.title,
        eventType: inv.eventType,
        eventDate: inv.eventDate,
        eventTime: inv.eventTime,
        eventPlace: inv.eventPlace,
        address: inv.address,
        eventTimezone: inv.eventTimezone || 'Asia/Almaty',
        templateData,
        musicUrl: inv.musicUrl,
        mapUrl: inv.mapUrl,
        customText,
      });

  await tx.invitation.update({
    where: { id: invitationId },
    data: { canvas: doc as any },
  });
}
