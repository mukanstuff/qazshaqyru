import { nanoid } from 'nanoid';
import type { Prisma } from '@prisma/client';

import prisma from '@/lib/shared/db';
import { ApiError } from '@/lib/shared/api';
import { findOwnedInvitationId } from '@/lib/invitations/repositories/invitation-repository';
import { parseCanvasOrEmpty, validateCanvasDocument } from '@/lib/canvas/validation';
import { syncInvitationPaymentState } from '@/lib/payments/invitation-payment-sync';
import { getInvitationPricing, resolvePublicationPriceKzt, resolvePaidTemplateOrder } from '@/lib/invitations/invitation-pricing';
import type {
  CanvasElement,
  CoupleNamesElement,
  InvitationCanvasDocument,
} from '@/lib/canvas/types';
import { applyWizardToCanvasDocument } from '@/lib/canvas/apply-wizard-placeholders';
import { deriveInvitationFieldsFromCanvas } from '@/lib/canvas/derive-invitation-fields';
import { customTextSchema } from '@/lib/shared/custom-text-schema';
import { formatKzt } from '@/lib/shared/format-price';

interface InviteeSourceData {
  /** Custom text joined with the explicit couple-names we carry (joined by ' & '). */
  names?: string;
  eventDate?: string;
  eventPlace?: string;
  address?: string;
  coverPhoto?: string;
}

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
 * The new canvas is taken from `Template.canvas`. If the target template has
 * no canvas (legacy html-engine), we fall back to `convertLegacyToCanvas`
 * semantics by simply leaving the canvas column as null and letting
 * ensureCanvasDocument do the work later.
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

/**
 * 2026-08-18 (Phase 2, hub screen): the new template's `text`/`heading`
 * elements with `placeholderKey: eventDate | eventTime | venueName | …
 * carry whatever date/place string the designer baked in. Without this
 * step, switch-template would leave the user staring at the designer's
 * sample ("14 сентября 2026 г."). Re-running the wizard binding replaces
 * placeholders with the user's actual data — same mechanism creation
 * already uses in `ensureCanvasDocument`.
 *
 * Returns the doc unchanged-shape but with placeholder-tagged elements
 * rewritten where the source had a value. Also exposes an "unfilled" list
 * via `__test__` so a future template that drops placeholderKey entirely
 * is visible in tests, not in user-visible wrong dates.
 */
function bindInviteeDataIntoCanvas(
  target: TargetCanvas,
  source: InviteeSourceData,
): { doc: TargetCanvas; unfilledPlaceholderKeys: string[] } {
  type PlaceholderSnapshot = { key: string; text: unknown };
  const placeholdersBefore: PlaceholderSnapshot[] = [];
  for (const el of target.elements) {
    if (typeof el.placeholderKey === 'string') {
      placeholdersBefore.push({
        key: el.placeholderKey,
        text: (el as { text?: unknown }).text,
      });
    }
  }

  const doc = applyWizardToCanvasDocument(target, source, 'ru') as TargetCanvas;

  const unfilledPlaceholderKeys: string[] = [];
  for (const before of placeholdersBefore) {
    const after = doc.elements.find((el) => el.placeholderKey === before.key);
    if (!after) continue;
    const afterText = (after as { text?: unknown }).text;
    if (
      typeof afterText === 'string' &&
      typeof before.text === 'string' &&
      afterText === before.text
    ) {
      // 2026-08-18 (Phase 2, hub screen): the value did not change. Either the
      // source had no matching field (e.g. eventPlace empty) or the template
      // stopped using placeholderKey. Both are loud in logs but not blockers.
      unfilledPlaceholderKeys.push(before.key);
    }
  }

  return { doc, unfilledPlaceholderKeys };
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
      priceKzt: true,
      canvas: true,
    },
  });
  if (!template) {
    throw new ApiError('validation_error', 'Шаблон не найден или отключён', 400);
  }
  if (template.id === owned.id) {
    // not relevant (invitationId != templateId) — keep the guard for symmetry.
  }

  // Before any payment at all, template choice is free browsing — no gate.
  // Once the invitation has paid for *something*, switching to a template
  // priced at or below what's already been paid stays free; switching to a
  // pricier one requires topping up the difference first (via the normal
  // checkout flow) — otherwise template price would be meaningless, since
  // paying once for the cheapest template would silently unlock every
  // pricier one too.
  const pricingBeforeSwitch = await getInvitationPricing(input.invitationId, input.userId);
  if (pricingBeforeSwitch && pricingBeforeSwitch.totalPaidKzt > 0) {
    const newPriceKzt = resolvePublicationPriceKzt(template.priceKzt);
    const affordable = resolvePaidTemplateOrder(pricingBeforeSwitch.totalPaidKzt, newPriceKzt);
    if (!affordable) {
      const amountDueKzt = Math.max(newPriceKzt - pricingBeforeSwitch.totalPaidKzt, 0);
      throw new ApiError(
        'payment_required',
        `Этот шаблон дороже уже оплаченного — доплатите ${formatKzt(amountDueKzt)} ₸, чтобы переключиться.`,
        402,
        { amountDueKzt, priceKzt: newPriceKzt, totalPaidKzt: pricingBeforeSwitch.totalPaidKzt }
      );
    }
  }

  const current = await prisma.invitation.findUnique({
    where: { id: input.invitationId },
    select: {
      id: true,
      canvas: true,
      customText: true,
      musicUrl: true,
      eventDate: true,
      eventPlace: true,
      address: true,
      templateData: true,
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

  let newDoc: TargetCanvas | null = null;
  if (newCanvasRaw) {
    const validation = validateCanvasDocument(newCanvasRaw);
    newDoc = validation.ok && validation.document ? validation.document : parseCanvasOrEmpty(newCanvasRaw);
  }

  // 2. Pull user's couple-names out of the OLD canvas (if any).
  const oldCanvas = parseCanvasOrEmpty(current.canvas);
  const carriedCoupleNames = extractCoupleNames(oldCanvas);

  // 3. customText — keep what the user already wrote. Don't drop legacy
  //    family-preview tokens that the family-preview route writes here.
  const carriedCustomText = customTextSchema.safeParse(current.customText);
  const finalCustomText = carriedCustomText.success ? carriedCustomText.data : {};
  const ctRecord = (finalCustomText ?? {}) as Record<string, unknown>;

  // 4. Build wizard source from the user's actual data, same shape as
  //    ensureCanvasDocument feeds to applyWizardToCanvasDocument at creation.
  const templateData = (current.templateData ?? {}) as Record<string, unknown>;
  const wizardSource: InviteeSourceData = {
    names: [ctRecord.groomName, ctRecord.brideName].filter(Boolean).join(' & ') || undefined,
    eventDate: current.eventDate ? current.eventDate.toISOString() : undefined,
    eventPlace: current.eventPlace ?? undefined,
    address: current.address ?? undefined,
    coverPhoto: typeof templateData.coverPhoto === 'string' ? templateData.coverPhoto : undefined,
  };

  // 5. Merge into the new doc, then bind the user's data into placeholder-keyed
  //    elements so the date/place from the new template's sample is replaced
  //    with the user's real values.
  let mergedCanvas: InvitationCanvasDocument;
  let unfilledKeys: string[] = [];
  if (newDoc) {
    const merged = mergeCoupleNamesInto(newDoc, carriedCoupleNames);
    const bound = bindInviteeDataIntoCanvas(merged, wizardSource);
    mergedCanvas = bound.doc;
    unfilledKeys = bound.unfilledPlaceholderKeys;
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

  // 2026-08-18 (Phase 2, hub screen): belt-and-braces — if placeholder-tagged
  // elements still carry the designer's sample text after binding, log so
  // we notice if a future template drops placeholderKey entirely. Do not
  // block the switch: a designer may legitimately have baked marketing copy
  // that we don't want to overwrite.
  if (unfilledKeys.length > 0) {
    console.warn(
      `[switch-template] placeholder keys unchanged after bind for invitation ${input.invitationId}:`,
      unfilledKeys,
    );
  }

  // 6. Update everything in one transaction.
  const derived = deriveInvitationFieldsFromCanvas(mergedCanvas);
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.invitation.update({
      where: { id: input.invitationId },
      data: {
        templateId: template.id,
        templateKey: template.slug,
        canvas: mergedCanvas as unknown as Prisma.InputJsonValue,
        customText: finalCustomText as Prisma.InputJsonValue,
        musicUrl: current.musicUrl,
        ...(derived.title !== undefined ? { title: derived.title } : {}),
        ...(derived.eventDate !== undefined ? { eventDate: derived.eventDate } : {}),
        ...(derived.eventTime !== undefined ? { eventTime: derived.eventTime } : {}),
        ...(derived.eventPlace !== undefined ? { eventPlace: derived.eventPlace } : {}),
        ...(derived.address !== undefined ? { address: derived.address } : {}),
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

// Test-only export surface. The merge helpers are pure data manipulation
// and worth covering with unit tests; the public `switchInvitationTemplate`
// requires a live DB and is covered by the manual switch-template smoke test.
export const __test__ = {
  mergeCoupleNamesInto,
  extractCoupleNames,
  bindInviteeDataIntoCanvas,
};