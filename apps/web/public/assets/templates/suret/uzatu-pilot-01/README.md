# Suret assets handoff

Drop designer files here. Agents do **not** invent backgrounds.

## Contract

| File | Spec |
|------|------|
| `bg.webp` | 1080×1920 (Stories 9:16), WebP, no text baked in |
| Optional `preview.webp` | Same aspect, for catalog cards |

## This folder

`uzatu-pilot-01/` — wiring pilot (`suret/uzatu-pilot-01` / slug `suret-uzatu-pilot-01`).

Until `bg.webp` exists, UI shows gradient fallback; slot export still works.

## After assets land

1. Put `bg.webp` in this folder
2. Confirm `/suret/demo` and export look right
3. Add DB catalog row + `CATALOG_TEMPLATE_SLUGS` if selling
4. Remove matching slug from `coming-soon.ts`
