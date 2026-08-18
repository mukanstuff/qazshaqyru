import { nanoid } from 'nanoid';
import type { Prisma } from '@prisma/client';

import prisma from '@/lib/shared/db';
import { ApiError } from '@/lib/shared/api';
import { findOwnedInvitationId } from '@/lib/invitations/repositories/invitation-repository';
import { parseCanvasOrEmpty, validateCanvasDocument } from '@/lib/canvas/validation';
import { syncInvitationPaymentState } from '@/lib/payments/invitation-payment-sync';
import type {
  CanvasElement,
  CoupleNamesElement,
  InvitationCanvasDocument,
} from '@/lib/canvas/types';
import { customTextSchema } from '@/lib/shared/custom-text-schema';

/**
 * 2026-08-18 (Phase 2, hub-screen): switch the template of an existing
 * invitation while preserving the user's content. Per product-owner spec
 * (final, not open for re-discussion):
 *
 *  Carried over (the user's "content"):
 *   - customText (greeting / intro / details / closing / dressCode / names / …)
 *   - couple-names elements (their `first` / `second` / `connector`)
 *   - eventDate / eventTime / eventPlace / address
 *   - musicUrl
 *
 *  NOT carried over (template-driven, replaced wholesale):
 *   - colors, fonts, decorative elements, additional blocks
 *   - layout positions of everything except couple-names (couple-names get
 *     re-inserted near the top of the new doc; the new template owns layout)
 *
 * The new canvas is taken from `Template.canvas` (and `Template.mobileCanvas`
 * if present). If the target template has no canvas (legacy html-engine),
 * we fall back to `convertLegacyToCanvas` semantics by simply leaving the
 * canvas column as null and letting ensureCanvasDocument do the work later.
 */

type SourceCanvas = InvitationCanvasDocument;
type TargetCanvas = InvitationCanvasDocument;

function mergeCoupleNamesInto(
  target: TargetCanvas,
  incoming: CoupleNamesElement[],
): TargetCanvas {  if (incoming.length === 0) return target;

  const placed = [...target.elements];
  let insertAt = placed.findIndex((el) => el.type !== 'image' && el.type !== 'divider');
  if (insertAt === -1) insertAt = placed.length;

  // Drop any couple-names the target template already had so user data wins.
  const cleaned = placed.filter((el) => el.type !== 'couple-names');
  // ... and reinsert at a sensible top position (after the first divider or
  // image block, if any).
  let idx = cleaned.findIndex(
    (el) => el.type === 'image' || el.type === 'divider' || el.type === 'heading',
  );
  if (idx === -1) idx = 0;
  else idx = Math.min(idx + 1, cleaned.length);

  const newElements: CanvasElement[] = [...cleaned];
  newElements.splice(idx, 0, ...incoming);

  // Re-number zIndex.
  newElements.forEach((el, i) => {
    el.zIndex = i + 1;
  });

  return { ...target, elements: newElements };
}

function extractCoupleNames(src: SourceCanvas): CoupleNamesElement[] {
  return src.elements
    .filter((el): el is CoupleNamesElement => el.type === 'couple-names')
    .map((el) => ({
      ...el,
      id: nanoid(10),
    }));
}

export interface SwitchTemplateInput {
  invitationId: string;
  userId: string;
  templateId: string;
}

export async function switchInvitationTemplate(input: SwitchTemplateInput) {
  const owned = await findOwnedInvitationId({
    id: input.invitationId,
    userId: input.userId,
  });
  if (!owned) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }

  const template = await prisma.template.findFirst({
    where: { id: input.templateId, isActive: true },
    select: {
      id: true,
      slug: true,
      nameRu: true,
      canvas: true,
      mobileCanvas: true,
    },
  });
  if (!template) {
    throw new ApiError('validation_error', 'Шаблон не найден или отключён', 400);
  }
  if (template.id === owned.id) {
    // not relevant (invitationId != templateId) — keep the guard for symmetry.
  }

  const current = await prisma.invitation.findUnique({
    where: { id: input.invitationId },
    select: {
      id: true,
      canvas: true,
      customText: true,
      musicUrl: true,
    },
  });
  if (!current) {
    throw new ApiError('not_found', 'Приглашение не найдено', 404);
  }

  // 1. Parse the NEW template's canvas (or empty if it has none).
  const newCanvasRaw =
    template.canvas && typeof template.canvas === 'object'
      ? (template.canvas as unknown)
      : null;
  const newMobileRaw =
    template.mobileCanvas && typeof template.mobileCanvas === 'object'
      ? (template.mobileCanvas as unknown)
      : null;

  let newDoc: TargetCanvas | null = null;
  if (newCanvasRaw) {
    const validation = validateCanvasDocument(newCanvasRaw);
    newDoc = validation.ok && validation.document ? validation.document : parseCanvasOrEmpty(newCanvasRaw);
  }

  let newMobile: TargetCanvas | null = null;
  if (newMobileRaw) {
    const validation = validateCanvasDocument(newMobileRaw);
    newMobile = validation.ok && validation.document ? validation.document : parseCanvasOrEmpty(newMobileRaw);
  }

  // 2. Pull user's couple-names out of the OLD canvas (if any).
  const oldCanvas = parseCanvasOrEmpty(current.canvas);
  const carriedCoupleNames = extractCoupleNames(oldCanvas);

  // 3. Merge into the new doc.
  let mergedCanvas: InvitationCanvasDocument;
  if (newDoc) {
    mergedCanvas = mergeCoupleNamesInto(newDoc, carriedCoupleNames);
  } else if (carriedCoupleNames.length > 0) {
    // No template canvas: keep the user's couple-names-only doc as fallback.
    mergedCanvas = {
      version: 1,
      width: 390,
      background: { type: 'solid', color: '#fff8f1' },
      elements: carriedCoupleNames,
    };
  } else {
    mergedCanvas = parseCanvasOrEmpty(null);
  }

  let mergedMobile: InvitationCanvasDocument | null = null;
  if (newMobile) {
    mergedMobile = mergeCoupleNamesInto(newMobile, carriedCoupleNames);
  } else if (newDoc) {
    mergedMobile = null;
  } else {
    mergedMobile = null;
  }

  // 4. customText — keep what the user already wrote. Don't drop legacy
  //    family-preview tokens that the family-preview route writes here.
  const carriedCustomText = customTextSchema.safeParse(current.customText);
  const finalCustomText = carriedCustomText.success ? carriedCustomText.data : {};

  // 5. Update everything in one transaction.
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.invitation.update({
      where: { id: input.invitationId },
      data: {
        templateId: template.id,
        templateKey: template.slug,
        canvas: mergedCanvas as unknown as Prisma.InputJsonValue,
        mobileCanvas: mergedMobile
          ? (mergedMobile as unknown as Prisma.InputJsonValue)
          : null,
        customText: finalCustomText as Prisma.InputJsonValue,
        musicUrl: current.musicUrl,
      },
    });
  });

  // Template price may differ — re-sync payment state (unlockedPlanSku etc.).
  await syncInvitationPaymentState(input.invitationId, input.userId);

  return {
    templateKey: template.slug,
    templateId: template.id,
    templateNameRu: template.nameRu,
  };
}

// Test-only export surface. The merge helper is pure data manipulation and
// worth covering with unit tests; the public `switchInvitationTemplate`
// requires a live DB and is covered by the manual switch-template smoke test.
export const __test__ = {
  mergeCoupleNamesInto,
  extractCoupleNames,
};