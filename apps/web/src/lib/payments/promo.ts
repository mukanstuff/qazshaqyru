import prisma from '@/lib/shared/db';
/*
 * Mirrors of `enum PromoKind` / `enum PromoScope` in prisma/schema.prisma.
 *
 * Written out rather than imported because this project cannot import enum
 * types from '@prisma/client' at all — the generated client's top-level enum
 * re-exports do not resolve for TypeScript here, which is why enum values are
 * cast at every call site across the codebase. Model types (prisma.promoCode,
 * its fields) do resolve, so those are still checked; only these two names are
 * restated. Keep them in step with the schema.
 */
type PromoKind = 'percent' | 'fixed';
type PromoScope = 'template' | 'agency' | 'all';

/**
 * Discount codes.
 *
 * Two rules shape everything here:
 *
 *  1. The customer types the code on a phone. "toi10", " Toi10 " and "ТОI10"
 *     with a Cyrillic Т are all the same intent, so normalization happens once,
 *     here, and both the admin's create form and the checkout lookup use it.
 *  2. The seat is taken when the order is created, not when it is paid. A code
 *     limited to 50 uses must not be handed to 50 people who then all discover
 *     at the payment screen that someone else got there first. Cancelling an
 *     unpaid order gives the seat back.
 */

/** Result of checking a code — either a usable discount or a reason it is not. */
export type PromoCheck =
  | {
      ok: true;
      promoId: string;
      code: string;
      kind: PromoKind;
      value: number;
      discountKzt: number;
      finalKzt: number;
    }
  | { ok: false; reason: PromoFailure };

export type PromoFailure =
  | 'not_found'
  | 'inactive'
  | 'expired'
  | 'exhausted'
  | 'wrong_scope'
  | 'nothing_to_discount';

export const PROMO_FAILURE_MESSAGES: Record<PromoFailure, { ru: string; kz: string }> = {
  not_found: { ru: 'Такого промокода нет', kz: 'Мұндай промокод жоқ' },
  inactive: { ru: 'Промокод больше не действует', kz: 'Промокод енді жарамсыз' },
  expired: { ru: 'Срок действия промокода истёк', kz: 'Промокодтың мерзімі өткен' },
  exhausted: { ru: 'Промокод уже использован', kz: 'Промокод пайдаланылып қойған' },
  wrong_scope: { ru: 'Промокод не действует для этой покупки', kz: 'Бұл сатып алуға промокод жарамайды' },
  nothing_to_discount: { ru: 'Здесь нечего оплачивать', kz: 'Мұнда төлейтін ештеңе жоқ' },
};

/**
 * Cyrillic letters that look identical to Latin ones on a keyboard. A customer
 * copying "TOI10" out of an Instagram story on a Russian layout produces
 * "ТОI10", which would otherwise be a different string and a wrong code.
 */
const LOOKALIKES: Record<string, string> = {
  А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T',
  У: 'Y', Х: 'X', а: 'A', в: 'B', е: 'E', к: 'K', м: 'M', н: 'H', о: 'O', р: 'P',
  с: 'C', т: 'T', у: 'Y', х: 'X',
};

export function normalizePromoCode(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
    .split('')
    .map((ch) => LOOKALIKES[ch] ?? ch)
    .join('')
    .slice(0, 40);
}

export function isPromoCodeValidFormat(code: string): boolean {
  return /^[A-Z0-9_-]{3,40}$/.test(code);
}

/** Percent codes round down, so a 10% code on 4990₸ discounts 499₸, never 500₸. */
export function computeDiscountKzt(kind: PromoKind, value: number, amountKzt: number): number {
  const raw = kind === 'percent' ? Math.floor((amountKzt * value) / 100) : value;
  return Math.max(0, Math.min(raw, amountKzt));
}

function scopeAllows(scope: PromoScope, wanted: 'template' | 'agency'): boolean {
  return scope === 'all' || scope === wanted;
}

/**
 * Look a code up and price it, without consuming anything. Used both by the
 * "apply code" field (so the customer sees the new total before committing) and
 * by checkout itself.
 */
export async function checkPromoCode(
  rawCode: string,
  amountKzt: number,
  wanted: 'template' | 'agency',
  now: Date = new Date()
): Promise<PromoCheck> {
  const code = normalizePromoCode(rawCode);
  if (!isPromoCodeValidFormat(code)) return { ok: false, reason: 'not_found' };
  if (amountKzt <= 0) return { ok: false, reason: 'nothing_to_discount' };

  const promo = await prisma.promoCode.findUnique({ where: { code } });
  if (!promo) return { ok: false, reason: 'not_found' };
  if (!promo.isActive) return { ok: false, reason: 'inactive' };
  if (promo.expiresAt && promo.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: 'expired' };
  }
  if (promo.maxRedemptions !== null && promo.redemptions >= promo.maxRedemptions) {
    return { ok: false, reason: 'exhausted' };
  }
  if (!scopeAllows(promo.scope, wanted)) return { ok: false, reason: 'wrong_scope' };

  const discountKzt = computeDiscountKzt(promo.kind, promo.value, amountKzt);
  return {
    ok: true,
    promoId: promo.id,
    code: promo.code,
    kind: promo.kind,
    value: promo.value,
    discountKzt,
    finalKzt: amountKzt - discountKzt,
  };
}

/**
 * Take one redemption, atomically.
 *
 * The conditional `updateMany` is the whole point: two customers submitting the
 * last seat of a code at the same moment both pass `checkPromoCode`, and only
 * one of them matches `redemptions < maxRedemptions` here. Returns false for
 * the loser, who is then charged full price rather than silently over-redeeming
 * the code.
 *
 * `tx` is the caller's transaction when there is one, so the redemption and the
 * order it belongs to commit or roll back together.
 */
type RawExecutor = {
  $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<number>;
};

export async function consumePromoRedemption(
  promoId: string,
  tx: RawExecutor = prisma as unknown as RawExecutor
): Promise<boolean> {
  /*
   * One statement, because the check and the increment have to be the same
   * statement. Written as raw SQL because the limit is a comparison between two
   * columns ("redemptions" < "maxRedemptions") and Prisma's query API has no
   * way to express that — reading the limit first and comparing in JS reopens
   * exactly the race this exists to close.
   */
  const updated = await tx.$executeRaw`
    UPDATE "PromoCode"
       SET "redemptions" = "redemptions" + 1,
           "updatedAt" = NOW()
     WHERE "id" = ${promoId}
       AND "isActive" = TRUE
       AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
       AND ("maxRedemptions" IS NULL OR "redemptions" < "maxRedemptions")
  `;
  return updated === 1;
}

/** Give a seat back when an unpaid order carrying this code is cancelled. */
export async function releasePromoRedemption(
  promoId: string,
  tx: RawExecutor = prisma as unknown as RawExecutor
): Promise<void> {
  await tx.$executeRaw`
    UPDATE "PromoCode"
       SET "redemptions" = "redemptions" - 1,
           "updatedAt" = NOW()
     WHERE "id" = ${promoId}
       AND "redemptions" > 0
  `;
}
