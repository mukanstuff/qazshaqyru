# QazShaqyru — Product Model & Non-Negotiable Rules (2026-07-30)

**THIS FILE IS SACRED. READ IT BEFORE YOU TOUCH ANYTHING RELATED TO PRICING, ENTITLEMENTS, CHECKOUT, WIZARD, GUEST OPS, OR PUBLIC PAGE.**

**Future agents who ignore this will be creating the exact kind of infantile, half-assed work the owner has repeatedly condemned.**

**This file exists so that future agents cannot plead ignorance.**

**If you are an agent and you are thinking "I'll just do a small fix and leave the old ladder logic", "I'll keep the old error messages because it's easier", or "I'll hardcode 3990 because it's faster" — STOP. You are about to do the exact thing the owner hates.**

**Infantilism, laziness, and "just make it work" are explicitly not allowed in this project.**

## The Owner's Explicit Model (repeated in quotes, brief, and audit)

> «Клиенты заплатят цену шаблона и должны к нему иметь полный доступ, без вотермарков, без премиумов и сразу возможностью редачить всё.»

> «Заплатил цену шаблона — полный доступ.»

**Core rule for every single invitation (not agency):**

1. Customer pays **one time** the `Template.priceKzt` (the price of the chosen template).
2. That payment = **full access** to **that specific invitation**.
3. Full access means:
   - No watermark on public page
   - Full CanvasEditor (always free to edit)
   - All guest operations: list, send, remind, seating, export CSV, household, restaurant link, custom slug
   - Clean public page
4. Agency (20 000 ₸/мес) is a completely separate product for unlimited client work + course.

**There is no "freemium publish then pay for Standard".**  
**There is no "pay for template then still upsell Standard/Premium for basic features".**

---

## What This Means in Code (Rules Future Agents Must Follow)

### 1. Payment Intent
- User-facing "Оплатить {price}" buttons **must** use `intent: 'pay'` (never default `publish`).
- Price shown to user = `resolvePublicationPriceKzt(template.priceKzt)` from DB, never hardcoded 3990.

### 2. After Successful Template Payment
- `fullAccess === true` (or `hasPaidOrder && !watermark` for that invitation).
- All features are available. No further plan gates for guest ops, export, seating, custom slug, etc.
- Watermark is removed.
- Canvas document must exist and be the source of truth.

### 3. Editor
- Editing (CanvasEditor + PATCH `/canvas`) is **always free**.
- Never put `plan_required` on canvas editing.

### 4. Public Page & Preview
- Wizard preview must render with the **same engine** as the published guest page (CanvasRenderer is the target).
- `convertLegacyToCanvas` is a bridge/migration tool, not creative design.

### 5. Language & UI
- Never show "Стандарт", "Премиум", "после Стандарта", "Стандарттан кейін" in the regular single-invite user journey.
- Use language like: "оплата цены шаблона", "полный доступ", "после оплаты шаблона".
- Old ladder language is only acceptable in admin, agency, or very internal code.

### 6. Entitlements
- The primary signal for a regular user is **"did they pay the template price for this invitation?"**
- `fullAccess` (or equivalent) should override old ladder checks for single-invite flows.
- `resolveEntitlements` + `getInvitationPricing` must reflect the above.

### 7. Tests & Legacy
- Tests that assume the old freemium + ladder model are **wrong** and must be updated or deleted.
- `canPublishWithoutPayment()` returning `true` is considered legacy/deprecated for user paths.

---

## Anti-Infantilism Rules (for agents)

1. **Do not do "minimal safe change" when the root model is broken.**
2. **Do not add new upsells, new tariffs, new marketing text** unless explicitly asked.
3. **When you see two engines, two prices, or two stories for the same thing — fix the duplication toward one coherent path.**
4. **If something feels like a hack to keep old tests green or old code working — call it out and plan the migration.**
5. **Write comments that explain the *product decision*, not just the code.**
6. **Better to break 50 tests and document why than to preserve a wrong mental model.**

The owner has said multiple times:
- "Вы не отличаете просто не ломающееся плохое дерьмо от качественно сделанных вещей."
- "Вам лишь бы главное сделано и работает (хоть через жопу)."
- "Лучше часы анализа, чем ещё одно „сделано через жопу“."

This project now has **PRODUCT_DECISIONS_2026-07-30.md** and this file as the single source of truth.

---

## Quick Checklist Before Any Change

- [ ] Does this reinforce "pay template price once = full access"?
- [ ] Am I using the real template price instead of 3990?
- [ ] Am I removing (not adding) mentions of "Стандарт/Премиум" in user-facing single-invite flows?
- [ ] Is preview using the same document/engine as publish?
- [ ] Did I update or mark the relevant tests?
- [ ] Did I add a comment referencing this file or PRODUCT_DECISIONS?

If the answer to any is "no" and it's not a tiny internal admin thing — stop and rethink.

---

**Last updated:** 2026-07-30 by agent acting with full conviction on owner's stated model.

Future agents: read this before touching pricing, entitlements, checkout, wizard, public page, or GuestOpsHub.