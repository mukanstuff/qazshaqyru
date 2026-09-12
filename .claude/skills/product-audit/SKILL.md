---
name: product-audit
description: Audit a part of the QazShaqyru product for defects — the catalogue, the cabinet and hub, the editor, the guest page, payments, auth, marketing copy, SEO and localisation, the admin, or technical health. Use whenever the task is to review, inspect or fix a screen or flow rather than to build a template, and whenever the owner asks what is wrong with an area of the product.
---

# Auditing the product

The owner runs this as a strict three-step process. Do not collapse the steps.

1. **Recon produces a map, not findings.** List the screens, routes and files in
   the category. Do not report a single defect at this stage — reporting "a
   couple of problems per category" is exactly what he corrected once already,
   because narrow attention is the whole point.
2. **One category at a time, completely.** Then fix, then verify live.
3. **Capture the knowledge immediately** in `docs/product-audit-playbook.md`
   and here, before moving on. Nothing that stays in the conversation survives it.

`WORKING-STANDARD.md` in the repo root carries the method that applies to every
task here — how to verify, what counts as a finding, how to report. Read it if
you have not already.

Read `apps/web/docs/product-audit-playbook.md` first. It carries the category
map with its statuses, the method, what is explicitly not a defect, and the
mistakes already made.

## Non-negotiables

- **Look at the page.** Every defect found in categories 1–2 passed `tsc` and
  the test suite. Green means nothing here.
- **390×844, logged in, both locales.** The default locale is Kazakh, the
  product is a phone product, and half of what is broken is visible only there.
- **Measure.** A finding carries a number: pixels, percent, counts, a 404 line.
- **Missing templates are not a defect.** The service is still in development.
- **Product decisions go to the owner as a written plan**, before the code.
  What is locked before payment and how often to ask for money is his call.
- **Retractions are part of the report.** Three of my claims in categories 1–2
  turned out to be wrong, one of them caused by my own edit to the dev database.

## Tools

```bash
cd apps/web
node scripts/audit-routes.mjs --locale=kz --login=+77015550142 /dashboard
node scripts/audit-routes.mjs --shots=out/ --json=audit.json /templates /templates/wedding
pnpm typecheck && pnpm test
```

`audit-routes.mjs` flags the five failures this codebase actually produces:
a page with no `h1`, an image that resolved to nothing, a 4xx response, a
console error, and a Russian string in a Kazakh session. It waits for images to
decode and for the compile skeleton to go away — measuring too early is how a
working catalogue gets reported as entirely broken.

Start the dev server with the preview tool, never with Bash. Postgres listens on
**55432**.
