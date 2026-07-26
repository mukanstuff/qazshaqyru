# ADR-003: Path-based locales for SEO (`/kk` + `/ru`)

**Status:** Accepted (scaffold + marketing LocaleLink + unique kk money HTML)  
**Date:** 2026-07-19  
**Context:** Cookie-only locale (`locale=kz|ru`) serves kk and ru on the same URL. Google indexes one document; Kazakh content is invisible as a separate alternate. Competitors (toi.com.kz) use `/kk/…` and `/ru/…` with hreflang.

## Decision

**Target architecture (Variant A from SEO canvas):** path prefixes `/kk/…` and `/ru/…` as indexable language versions.

**Shipped (foundation + this pass):**

1. **Middleware rewrite (not redirect):** `/kk/uzatu` → internal `/uzatu` with headers `x-pathname-locale=kz`, `x-url-locale=kk`, cookie `locale=kz`. Same for `/ru` → `ru`. Logic extracted to `decideLocaleMiddleware()` for tests.
2. **Legacy `/kz/…`:** 308 redirect to `/kk/…` (SEO-canonical ISO 639-1 code is `kk`, internal app locale stays `kz`).
3. **Unprefixed URLs remain:** `/uzatu` still works (x-default / cookie). Hreflang points to `/kk…`, `/ru…`, and unprefixed x-default.
4. **`getI18n` / root `lang`:** path header wins over cookie when present.
5. **Sitemap:** marketing URLs listed unprefixed + `/kk` + `/ru` mirrors.
6. **Metadata helper:** `buildLanguageAlternates(logicalPath, currentSeoLocale?)` — full mesh + **self-canonical** when request is on `/kk` or `/ru`.
7. **Locale-aware links:** `LocaleLink` + `withSeoLocalePrefix` across marketing surfaces (PublicShell, LandingHeader/Footer, LandingPage + hero/sections, TemplatesClient, CategoryTemplatesClient, blog list/post, FAQ, compare, category blocks, footers). Guest `/i/*`, auth (`/login`), dashboard, invitations, settings, admin — **not** prefixed.
8. **Language switcher:** on marketing pages navigates to `/kk/…` ↔ `/ru/…` (including LandingPage home).
9. **Unique kk money HTML:** all 8 event/city keys in `event-landings-kk.ts` (uzatu, sundet, wedding, betashar, tusaukeser, mereytoi, almaty, astana) — not UI-dictionary mirrors.
10. **Category kk copy:** money categories (`wedding`, `kyz-uzatu`, `sundet-toy`, `betashar`, `tusau-keser`, `anniversary`) have distinct kk intro/FAQ via `getCategorySeoCopy(route, locale)`.
11. **Soft Accept-Language:** `SoftLocaleBanner` on unprefixed marketing (PublicShell + LandingPage) — one-time dismissible; buttons → `/kk`|`/ru` of current path; **no hard redirect**, bots not forced. Helper `preferSeoLocaleFromAcceptLanguage()`.

## Non-goals (deferred)

| Item | Why deferred |
|------|----------------|
| Move entire tree under `app/[locale]/…` | Large routing refactor; risk to auth + guest `/i/*` |
| Force-redirect all users to `/kk` or `/ru` | Soft banner shipped instead; hard lock rejected |
| Index individual `/templates/{template.slug}` | **Decision: no.** Categories only; preview is modal/editor. No public slug route → keep out of sitemap |
| Hard Accept-Language lock | Soft suggest only (shipped) |
| Шымкент / Караганда / Актобе city pages | Brief only until local value; no thin doorway |

## Accept-Language (soft suggest) — shipped

**Not shipping hard redirect** based on `Accept-Language` (breaks shared links, bookmarking, and cookie UX).

**Shipped:** one-time non-blocking banner on unprefixed marketing URLs: «Қазақша / Русский» → navigate to `/kk` or `/ru` of current path. Preferred button highlighted from `navigator.languages` / Accept-Language parse. Never auto-redirect crawlers or force locale. Dismiss stored in `localStorage`.

## Template slug pages — decision

**Do not create indexable `/templates/{template.slug}`.** Reasons: no unique long-form value beyond category grid + editor preview; risk of thin duplicate URLs; sitemap already correctly lists categories only. If later needed: unique meta + body per slug + add to sitemap — product decision, not SEO filler.

## Alternatives considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Cookie-only (status quo) | Simple UX | Breaks kk SEO | Rejected for SEO |
| Separate kk/ru path slugs without prefix | No middleware rewrite | Harder IA, duplicate trees | Deferred |
| Full `[locale]` segment now | Cleanest long-term | Too large for one SEO PR | Phase 2 |
| Subdomain `kk.` / `ru.` | Clear | Ops/DNS/certs overhead | Rejected |

## Consequences

- Crawlers can fetch `/kk/pricing` and `/ru/pricing` as distinct URLs with correct `lang` + cookie.
- Internal marketing links now stay on `/kk` or `/ru` when user/crawler is on a prefixed URL (or follow cookie locale on unprefixed).
- After domain purchase: submit sitemap in GSC; validate hreflang with URL Inspection on `/kk` and `/ru` pairs (self-ref + return tags + x-default).
- Do not strip locale prefixes via redirect (old middleware behavior was SEO-hostile).

## What landed in this pass (2026-07-19, pass 3)

- [x] LocaleLink on remaining marketing CTAs (Landing*, Templates*, blog index, FAQ)
- [x] Self-referencing canonical when `x-url-locale` present (prior)
- [x] Unique kk copy for all 8 event/city LP
- [x] Soft Accept-Language banner (no hard lock)
- [x] Category kk intro/FAQ for money cats
- [x] Tests: middleware, hreflang, locale link helper, all kk≠ru landings, Accept-Language helper, category kk
- [x] **kk public copy native pass** — see `docs/KK-COPY-NOTES.md` (agents: no side-task kk during SEO)
- [ ] Full `app/[locale]` migration (phase 2 — intentional)

## Rollout checklist (remaining — human / basket B)

1. Domain go-live: see `SEO-LAUNCH-CHECKLIST.md`
2. Optional: remove reliance on unprefixed as primary once GSC shows stable `/kk`+`/ru` coverage
3. Шымкент page only after case/local value (`SHYMKENT-CONTENT-BRIEF.md`)
