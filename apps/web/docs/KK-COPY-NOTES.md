# KK public copy — native pass

**Date:** 2026-07-19  
**Status:** P0 public marketing / SEO / blog kk rewritten for living Kazakh (not RU calque).

## Rule for agents

**Do not** treat Kazakh copy as a side-task while doing SEO, LocaleLink, sitemap, schema, or layout CSS.  
If you change public kk strings, they must pass the native-kk bar (family WhatsApp tone, natural word order, no SEO jargon in user-facing text).

## What this pass covered

| Surface | Files |
|--------|--------|
| Landing hero / CTA / pricing | `src/i18n/messages/landing-v2.kz.ts` |
| Public marketing keys | `src/i18n/messages/kz.ts` (landing / category meta / demo — not full dashboard) |
| Event / city LP kk | `src/lib/seo/event-landings-kk.ts` (all 8 keys) |
| Category intro/FAQ kk | `CATEGORY_SEO_COPY_KK` in `src/lib/seo/category-copy.ts` |
| Blog kz | `content/blog/kz/**` |

## Anti-patterns (banned in public kk)

- Calque word order (e.g. «Онлайн-шақыру 5 минутта тойыңызға»)
- SEO junk: `thin`, `AEO`, `entry-бәсекелестер`, doorway spam
- Ops calques: `есепке алу`, `жіберілім`, `банкетке дейінгі қонақ операциясы`, Guest Ops in every sentence
- RU roots with kk endings: `формулировка`, `локаль` as marketing jargon

## P1 leftover

Dashboard / editor / admin strings in `kz.ts` — not required for this pass. Handoff: native-kk polish of remaining UI dictionary only (no new SEO pages).

## How to spot-check

1. `/kk` — hero: «Тойыңызға / 5 минутта / онлайн шақыру жасаңыз»
2. `/kk/uzatu` — H1 and body without Guest Ops / thin / есепке алу spam
3. `/kk/blog/honest-comparison` — human comparison, no AEO jargon
