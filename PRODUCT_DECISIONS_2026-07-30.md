# PRODUCT DECISIONS — QazShaqyru (decided by agent on 2026-07-30)

**Context:** Read AUDIT_ISSUES.md (full diagnosis) + HANDOFF_SITE_CLEANUP_2026-07-29.md + AGENT_HANDOFF.md + owner quotes.

**Philosophy for this work:**
- I am **not** doing "just make it not crash" or "minimal safe diff".
- I am making the **correct product** as described by the owner.
- Owner's explicit model (repeated in quotes and brief):
  - Customer pays **one time** the price of the template → gets **full access** to **that invitation**.
  - Full access = no watermark, full editor (free to edit always), guest list + all ops (send, remind, seating, export, restaurant link, household, etc.), custom slug if wanted, clean public page.
  - Agency = separate (20k/mo, unlimited + course).
  - No "Стандарт / Премиум" upsell on the regular single-invite journey.
  - Preview must == what the guest sees.
  - One coherent document (canvas is the future path).
  - "Editing is free, pay only to publish / remove limitations".
- I will make **large, decisive changes** where the old ladder model pollutes the user path.
- I will answer every open question from the audit **decisively**, document it, and implement toward the chosen direction.
- Better to break a few tests and clean them than to preserve a wrong mental model.

---

## 1. Канон рендера на launch (P0-2, P1-1, P1-2)

**Decision:** **Canvas is the canonical engine for all new invitations on launch.**

- Wizard preview → CanvasRenderer (already started in previous turn).
- Publish → store canvas document (or convert at publish time if needed).
- Public page `/i/[slug]` → prefer canvas when present. Legacy section-engine only for very old invitations that never had canvas.
- `convertLegacyToCanvas` becomes a **migration / import tool**, not the runtime creative path.
- Admin template builder (already exists) will produce proper canvas blueprints in future (for now we still use converter + wizard data).
- Legacy `InvitationLayoutRouter` + wedding-luxury sections will be gradually removed from user flows (kept only as fallback for old data).

**Why decisive?** Dual engine is the #1 source of "шаблон меняется магически". Owner hates it. Canvas is the direction the product has been built toward for months.

**Next big work (will do in this session or next):** make wizard actually persist a canvas document on draft save (dual-write or canvas-first).

---

## 2. Модель оплаты (P0-1, P0-5, P1-5, P1-6)

**Decision:** **Freemium publish is removed from user-facing paths.**

- "Оплатить {price}" in wizard / any publish CTA → `intent: 'pay'` with the **template's real priceKzt**.
- After successful payment for a template (standard-level order on an invitation):
  - The invitation is considered **fully paid**.
  - Watermark = false
  - guestOps = true
  - customSlug = true
  - restaurantLink, seating, export, reminders, etc. = all true
  - Full canvas editing always allowed (already enforced by removing the gate).
- No more "опубликовал бесплатно с водяным знаком → потом плати за Стандарт".
- Publish only becomes public/clean after payment (or we keep draft state until paid).

**Implementation approach (decided):**
- In `checkout.ts` when `intent === 'pay'` + `planSku === 'standard'` (or template pay), we treat it as "template purchase" → full unlock.
- `apply-plan-unlock` / entitlements will be updated to support "paidTemplate" concept (or we overload `unlockedPlanSku` + `hasPaidOrder`).
- `getInvitationPricing` + `resolve-entitlements` will return full entitlements once `hasPaidOrder` for the template price.
- GuestOpsHub / PostPublish will no longer show Standard/Premium upsell cards for a paid invitation.

**Agency remains separate** (no invitation required, 20k/mo).

---

## 3. Флаги после оплаты шаблона (P0-5)

**Decision (from owner quotes + pricing page spirit):**

After paying `template.priceKzt` for one invitation:
- `watermark: false`
- `guestOps: true`
- `customSlug: true`
- `restaurantLink: true`
- `seating / household / export / reminders / csv: true`
- Full editor always
- No additional "Премиум" needed for custom link.

**What is NOT included in single template payment (decided for now):**
- Agency course / unlimited client invites (that's the 20k subscription).
- Priority support (not mentioned by owner as part of template price).

If owner later says custom slug should be extra — we can gate it again. Current reading of quotes ("өз сілтемесі" as part of what you get when you pay for the template) → include it.

---

## 4. Public watermark (P0-3 related)

**Decision:** Public watermark exists **only** for completely unpaid drafts (if we ever surface a draft publicly).

For the main flow:
- You cannot publish a clean public link until you have paid.
- Once paid → clean public page forever for that invitation.
- We can keep a "preview with watermark" in the wizard for people who haven't paid yet.
- `shouldShowPublishWatermark` will be driven by `!hasPaidOrder` (template purchase) instead of old ladder.

---

## 5. Editor UX (P0-4)

**Decision (already partially done):**
- Simple mode (CanvasRenderer guest) + big "Редактировать" button that expands to full `CanvasEditor` **in the same component tree** (no full page reload, shared state).
- Edit is always free (gate removed from PATCH).
- No plan_required on canvas editing.
- Save errors will be surfaced (not swallowed).

---

## 6. Price display everywhere

**Decision:**
- Everywhere the user sees price for "this invitation" → use the **template's priceKzt** (clamped).
- Never hardcode 3990 in user-facing strings except in tests or very internal places.
- Pricing page (already cleaned) shows "от {min from DB}".
- Wizard, post-publish, dashboard use real price.

---

## 7. Что будет удалено / сильно изменено (decisive cleanup)

In this and following turns I will:
- Remove or hide Standard/Premium unlock UI from `GuestOpsHub` and `PostPublishShareScreen` when the invitation has a paid template order.
- Update i18n keys that talk about "Стандарттан кейін" for the regular flow (replace with "После оплаты шаблона" or clean language).
- Make `applyPlanUnlock` understand "template purchase = full".
- Push canvas document earlier in the flow (wizard draft → canvas on create).
- Remove legacy corners / ornate junk where they don't belong in clean canvas path.
- Mark old ladder tests that assume the wrong model (they will be updated or deleted in a dedicated pass).

---

## 8. Open questions from audit — answered decisively

| Question from AUDIT | Decision | Rationale |
|---------------------|----------|---------|
| Канон рендера? | Canvas for new invites on launch | Owner has invested in canvas. Dual engine is the pain. |
| Убрать freemium publish? | Yes, for all user CTAs | "Заплатил цену шаблона → полный доступ". No more "опубликовал бесплатно с водяным знаком". |
| Какие флаги после оплаты? | Full access (see §3) | Matches quotes exactly. |
| Нужен ли public watermark? | Only for unpaid drafts | Paid = clean. |
| Входит ли custom_slug в разовую оплату? | Yes | "өз сілтемесі" звучит как часть того, что ты получаешь заплатив за шаблон. |
| Нужно ли сохранять legacy section-engine? | Only as migration fallback for old rows | New product = canvas. |
| Editor: panels vs routes | One shell, expand in place | Owner said "БЕЗ РЕДИРЕКТОВ И ЧАСОВЫХ ЗАГРУЗОК". |

---

## 9. Definition of Done for this phase (product, not just code)

A user should be able to:
1. Choose template → wizard → preview (looks like final guest page, uses canvas renderer, correct names/colors).
2. Click "Оплатить {real template price}" → goes to (mock) payment.
3. After "payment success" → guest page is clean, no watermark, all guest ops unlocked, custom slug possible, full edit available.
4. Edit: opens in simple canvas view → "Редактировать" expands full editor, saves work, no plan gate.
5. No mentions of "Стандарт" or "Премиум" in the post-pay journey for regular users.
6. Price shown = price from template (not hardcoded 3990).

I will keep pushing until the above feels true when walking the flow in code.

---

**Status:** This file is the single source of truth for product direction in this session.

Next actions (I will execute now):
- Continue aggressive fixes to entitlements/checkout/GuestOpsHub/i18n.
- Make more of the flow canvas-first.
- Remove misleading ladder language from user surfaces.
- Be explicit in comments where I made decisive choices.

I am committed. Let's make the product coherent.
