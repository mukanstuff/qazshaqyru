# UX redesign partial — 2026-07-21

## Scope
Partial UX redesign (outside editor) + pricing presentation rework.

## Before (reference)
`../2026-07-21-ui-polish/pricing-*-before.png`, `landing-*-before.png`

## After
- `landing-mobile-ru-after.png`, `landing-desktop-ru-after.png`
- `pricing-mobile-ru-after.png`, `pricing-desktop-ru-after.png`
- `templates-mobile-ru-after.png`, `templates-desktop-ru-after.png`
- `login-mobile-ru-after.png`, `login-desktop-ru-after.png`

## Pricing concept
- **Landing:** freemium teaser (hero price + 3-step timeline + link to `/pricing`) — not 4 tier cards.
- **`/pricing`:** timeline → 2 family plans (Standard/Premium) → separate Agency block → value compare (print vs us vs designer) → feature FAQ accordion (replaces matrix table).
- Prices from `PLAN_CATALOG`, not hardcoded.

## Consciously not changed
- Template catalog filters/search/coming-soon
- `PLAN_CATALOG` prices (3990/4990/9990)
- Editor / guest invitation pages
- Single live template presentation (showroom + roadmap)

## Capture
`node scripts/capture-ux-redesign.mjs` (BASE_URL=http://localhost:3001)
