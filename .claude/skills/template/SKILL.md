---
name: template
description: Build or rework an invitation template for QazShaqyru (той, ұзату, мерейтой and the rest of the catalogue). Use whenever the task is to create a new template, restyle an existing one, generate template assets or ornaments, or judge whether a template is good enough to ship. Also use when asked to compare against toi.com.kz or shaqyru24.kz.
---

# Building a template

The catalogue is judged against two competitors. Their grammar has been measured
and written down; do not re-derive it and do not design from taste.

`WORKING-STANDARD.md` in the repo root carries the method that applies to every
task here — how to verify, what counts as a finding, how to report. Read it if
you have not already.

Read before anything else — all paths from `apps/web/`:

1. `docs/template-playbook.md` — the order of work and the list of traps. Start here.
2. `docs/design-vocabulary.md` — geometry, measured off 53 toi templates and 26 shaqyru24 canvas documents.
3. `docs/visual-register.md` — light, tone, subjects, animation, measured off live screenshots.
4. `docs/template-self-check.md` — the numeric gate every template must pass.

## The order is not optional

The owner has asked for it explicitly, and each step is shown to him before the
next one starts:

1. **Plan in words** — palette, composition per section, 5–7 devices from the
   vocabulary with parameters. No prompts, no asset dimensions.
2. **Asset list** — count and photo-to-graphics ratio derived from the measured
   medians, not chosen. Justify every subject by its role in the composition.
3. **Prompts** — only for the approved list.
4. **Build** — sections in `src/lib/canvas/template-kit/<slug>-builders.ts`,
   recipe in `scripts/seed-templates.ts`.
5. **Verify** — screenshot, then the self-check, then report.

```bash
cd apps/web
npx tsx scripts/prepare-template-assets.ts <slug>
npx tsx scripts/seed-templates.ts
npx tsx scripts/preview-invitation.ts <slug>
node scripts/shot-gate.mjs http://localhost:3000/i/preview-<slug> out.png
npx tsx scripts/self-check-template.ts <slug>
```

Start the dev server with the preview tool, never with Bash.

## Non-negotiables

- **Never copy a competitor's exact measurement.** Ranges, medians and
  percentiles are the target; a number the vocabulary presents as one specific
  file's dimension is off limits. The forbidden list is check C14.
- **Never draw an asset in code.** Generated raster files are cropped, tiled,
  recoloured and composited freely. SVG or CSS pretending to be an ornament is
  not.
- **No faces in template photography**, even though competitors use them.
- **Steppe, horses and yurts only in the "VIP" register.** This was a subject
  ban until the owner corrected it on 2026-09-13: «я не запрещал коней, степи,
  юрты… должна быть и "вип казашность" (как у других сервисов)». What he rejects
  is the poor ethnographic rendering earlier agents produced — bare steppe, a
  kelin in a plain robe, a boxy building alone on nothing. What is fine is what
  toi ships in сүндет той: a white horse in gold-embroidered tack, snow-capped
  mountains, a pristine ornamented yurt, light polished watercolour. Customers
  are in Almaty and Astana and buy ceremony, not ethnography.
- **No dark templates.** The dark jewel register is measured in the docs as a
  competitor fact, not offered as an option.
- **No fabricated content on a guest page** — no invented reviews, wishes or
  metrics.
- **A screenshot is the only proof.** Typecheck and tests pass on visibly broken
  pages in this repository; that is the normal case, not the exception.

## Reporting

Show the self-check line by line with the numbers and a verdict per item. Name
failures plainly. The owner reads a rendered page, not code, and asks for
assessment without decoration.
