# design-sync notes — Shaqyru UI

## Scope

This repo (`shaqyru`, a Next.js invitation-platform app — not a dedicated
design-system package) has no Storybook, no `dist/` build, and no standalone
component-library package. The synced surface is intentionally narrow: the
~15 shadcn/ui-style primitives under
[apps/web/src/components/ui/](../apps/web/src/components/ui/). Everything
else in the app (pages, the canvas/invitation editor, dashboard, etc.) is out
of scope.

## Synth-entry setup (no real `dist/`, no publishable package)

- `cfg.entry` points at a hand-written barrel, `apps/web/.ds-entry.ts`
  (gitignored, regenerated — not part of the app). It re-exports the 15
  components with their exact named exports. Recreate it if it's missing —
  see its content pattern in git history of this notes file, or just re-list
  each `ui/*.tsx` file's `export { ... }` line.
- `cfg.componentSrcMap` pins all 15 components explicitly (non-null), because
  there's no `.d.ts` tree to discover exports from — pinning is the only way
  the converter gets a component list at all in synth-entry mode.
- `cfg.pkg` = `"shaqyru-ui"` is a **virtual** package name — it doesn't exist
  in `node_modules`. Preview `.tsx` files import from it
  (`import { Button } from 'shaqyru-ui'`) and the converter's story-import
  plugin redirects that to `window.ShaqyruUI` (the compiled bundle). Don't
  try to `npm install shaqyru-ui` — it's not real.
- `--node-modules` must point at `apps/web/node_modules` (not the repo
  root) — pnpm keeps `react`/`@radix-ui/*` there, not hoisted to root.

## CSS: real Tailwind build, not raw globals.css

`cfg.cssEntry` = `apps/web/.ds-compiled.css` (gitignored, regenerated) — this
is **compiled** CSS, produced by running the app's own Tailwind CLI, not the
raw `globals.css` (which only has `@tailwind base/components/utilities;`
directives — copying it verbatim would ship a bundle with none of the actual
utility classes these components use). Regenerate before every rebuild:

```bash
cd apps/web && ./node_modules/.bin/tailwindcss -i src/app/globals.css -o .ds-compiled.css --config tailwind.config.ts --postcss postcss.config.js
```

The app's `tailwind.config.ts` `content` glob already covers all of `src/`,
so this compiled file is a superset (safe) — it includes utility classes used
anywhere in the app, not just in `ui/`. Custom hand-authored classes like
`.us-glass` (glassmorphism card style, defined directly in `globals.css`
`@layer utilities`) pass through untouched since they're not Tailwind-JIT
generated.

## Fonts

`Onest` is referenced by the compiled CSS but never shipped as a local
`@font-face` — the app serves it from Google Fonts CDN URLs
(`apps/web/public/fonts/_onest.css`). Wired via `cfg.extraFonts`. The bundle
therefore depends on a live network fetch to Google Fonts for that family;
if that's ever undesired, self-host the woff2s instead.

## Known render limitation: Toaster ignores its `children` prop

`apps/web/src/components/ui/toaster.tsx`'s `Toaster` component destructures a
`children` prop but never renders it — only its internal `toasts` state
(seeded exclusively via `useToast().toast(...)` called from a descendant, but
nothing is ever rendered *as* a descendant). This looks like dead code /
a latent bug upstream, not something this sync should paper over. Its
authored preview (`.design-sync/previews/Toaster.tsx`) mounts `<Toaster />`
standalone, which is honestly just an empty (invisible) notification
viewport — there's no way to seed a visible toast from outside the app's own
`useToast()` call sites. The `Toast` primitive's own preview shows what a
toast actually looks like. If the app team fixes `Toaster` to render
`children`, this preview should be revisited to demonstrate a live toast.

## Known render warns

None outstanding — all 15 components were manually verified (see below).

## App finding (not a sync issue): `us-*` opacity modifiers silently no-op

While validating the compiled CSS for the conventions header, found that `bg-us-accent/10` (used in `badge.tsx`'s `default` variant and `select.tsx`'s `SelectItem` focus state) and `bg-us-success/10` (Badge's `published` variant) compile to **nothing** — Tailwind drops the utility entirely rather than erroring. Root cause: `us.accent`/`us.success`/`us.danger`/etc. in `tailwind.config.ts` are defined as plain `var(--us-accent)` strings, which don't support Tailwind's `/NN` opacity-modifier syntax (that requires the `rgb(var(--x) / <alpha-value>)` placeholder pattern — only `us.ink` uses it). So today, in the real app, `<Badge variant="default">` and `<Badge variant="published">` render with **no background color at all** (just the border-transparent + text color), and `SelectItem`'s hover/focus tint never appears. This sync worked around it by only citing bare (non-opacity) `us-*` classes in `.design-sync/conventions.md`, but the underlying app bug is real and worth a look — either switch these two colors to the `rgb(var(--x-rgb) / <alpha-value>)` pattern (matching `us.ink`), or stop using `/NN` on them.

## Render verification

No local Chromium/Playwright was installed for this sync (user declined the
~200MB install), so `package-validate.mjs` ran with `--no-render-check`.
Verification was instead done manually: every one of the 15 components was
served locally and inspected via a real browser tool (Claude Code's Browser
pane) — checked for real rendered content matching the authored preview and
zero console errors. All 15 passed. A future re-sync with Playwright
installed will get proper automated screenshots + grading; this is not a
gap so much as a different (manual, but still real) verification path for
this run.

## Re-sync risks

- `apps/web/.ds-entry.ts` and `apps/web/.ds-compiled.css` are **not
  committed** (gitignored) — a fresh clone must regenerate both before
  rebuilding (see above). If a re-sync build fails with `[NO_DIST]` or a
  missing-CSS-classes look in the DS pane, this is almost certainly why.
- If any `ui/*.tsx` file's exports change (new component, renamed export),
  update `apps/web/.ds-entry.ts` AND `.design-sync/config.json`'s
  `componentSrcMap` together — neither auto-discovers the other in
  synth-entry mode.
- The compiled CSS is a snapshot of the whole app's Tailwind output at sync
  time — if the app's class usage drifts a lot between syncs, just
  regenerate it fresh (cheap, deterministic) rather than trying to diff it.
- No grading harness has run (no Playwright) — `.design-sync/.cache/review/`
  grade files don't exist. The next sync's `carried forward` check therefore
  has nothing to carry forward from; the first Playwright-enabled sync will
  effectively grade everything fresh, which is expected, not a regression.
