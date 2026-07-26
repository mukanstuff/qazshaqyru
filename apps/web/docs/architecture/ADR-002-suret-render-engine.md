# ADR-002: Suret render engine (фото-приглашение)

**Status:** Accepted  
**Date:** 2026-07-17  
**Context:** toi.com.kz ships `?product=suret` (image invitation). Instagram Stories is a primary KZ share channel. We already had a spike (`suret-manifests.ts`). Owner designs backgrounds; engineering wires slots.

## Decision

**Second production render engine: `suret`.**

| Engine | Guest experience | Designer handoff |
|--------|------------------|------------------|
| `react-sections` | Long site: RSVP, map, music… | Sections + assets |
| `suret` | One image + positioned text; download PNG/WebP | `bg.webp` + text slots (id, top%, font, color, defaults KK/RU) |

Same product catalog surface: filter **Сайт / Сүрет**. Suret is **not** guest photo upload — it is a photo-format invitation SKU.

Canonical state for site invitations remains `InvitationDocument`. Suret invitations store slot values in `customText` / `templateData.suretSlots` keyed by slot id; `templateKey` points at a Suret manifest id.

## Non-goals

- No Tyrasoft / GrapesJS canvas
- No AI-generated backgrounds as product quality
- No sales catalog registration without real `bg.webp` from the designer
- No LLM on guest path

## Export

Client-side canvas compose: background + text slots → download `image/png` or `image/webp`. Server export optional later.

## Consequences

- HOW-TO gains a Suret checklist (assets + manifest + catalog when ready)
- Spike pilot `suret/uzatu-pilot-01` stays **demo / wiring only** until designer assets land
- Pricing: Suret unlocks under Standard (same ops ladder); format filter is UX, not a separate entitlement
