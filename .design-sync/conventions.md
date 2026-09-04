## Setup

No provider wraps the whole app — colors/fonts are plain CSS custom properties on `:root` (no ThemeProvider, no context). The **one** exception is `Tooltip`: wrap it in `<TooltipProvider>` (import it from this DS) or it throws. `Toast` needs `<ToastProvider>` around it too, plus a `<ToastViewport>` sibling.

## Styling idiom: Tailwind utility classes, brand tokens under `us-*`

This DS layers a brand color/shadow/radius scale on top of Tailwind, exposed as utility classes — never write raw hex or inline styles for these values, use the class:

| Purpose | Classes |
|---|---|
| Surface / text | `bg-us-surface`, `text-us-ink`, `text-us-ink-muted`, `border-us-border`, `bg-us-border-strong` |
| Accent (brand green) | `bg-us-accent`, `text-us-accent`, `border-us-accent`, `ring-us-accent` — **bare only, no `/NN` opacity modifier** (see callout below) |
| Status colors | `text-us-success`, `bg-us-danger` (Toast's destructive variant) — same bare-only rule; Badge's `draft`/`archived` variants use plain Tailwind `amber-50/700` and `slate-100/600` instead of brand tokens — follow that precedent for new non-brand status colors, don't invent new `us-*` ones for them |
| Radius scale | `rounded-md` / `rounded-lg` / `rounded-xl` / `rounded-full` (mapped from `--radius`, not Tailwind's defaults) |
| Shadow scale | `shadow-us-sm` / `shadow-us-md` / `shadow-us-lg` / `shadow-us-xl` (brand-specific, replaces Tailwind's default shadow scale) |
| Fonts | `font-body` (default UI text), `font-display` (headings — see `CardTitle`) |
| Motion | `animate-fade-in`, `animate-overlay-in`/`-out`, `animate-sheet-in-bottom`/`-right` (custom keyframes, not Tailwind's `animate-*` defaults) |
| Frosted/glass panel | `.us-glass` — a hand-authored class (not Tailwind-generated), used on `Card`. Don't try to compose it from utilities; apply the class directly. |

**`/NN` opacity modifiers only work on `us-ink`.** `text-us-ink/60`, `bg-us-ink/40` etc. work because that one color is defined with Tailwind's alpha-value placeholder (`rgb(var(--us-ink-rgb) / <alpha-value>)`). Every other `us-*` color (`accent`, `danger`, `success`, `cta`, `border`, …) is a plain `var(--us-accent)` reference with no alpha placeholder — Tailwind silently drops the whole utility for e.g. `bg-us-accent/10`, so it renders with **no background at all**. (This app's own `Badge` and `Select` source actually hit this: `bg-us-accent/10`/`bg-us-success/10` compile to nothing.) Don't use `/NN` on any `us-*` color except `us-ink`; for a tinted accent background use the bare `bg-us-accent` or a plain Tailwind gray/amber/slate shade instead.

**One inconsistency to know about, not to fix**: `Button`'s variants (`default`, `destructive`, `turquoise`, `peach`, …) use raw hex arbitrary values (`bg-[#1F3A2E]`) instead of the `us-*` token classes — and unlike the `us-*` tokens, arbitrary hex values DO support `/NN` opacity (`bg-[#16A34A]/10` works fine, since Tailwind can always inject alpha into a literal color). If you add a new `Button` variant, match Button's own existing pattern (raw hex) rather than switching it to `us-*` mid-component — every other component in this set (`Badge`, `Card`, `Input`, `Popover`, `Select`, `Sheet`, `Tabs`, `Toast`, `Tooltip`) does use the `us-*` classes, so default to those for anything that isn't Button.

## Where the truth lives

Read `styles.css` (imports the full compiled stylesheet, `_ds_bundle.css`) before styling anything — it has the complete real class list and the `:root` custom-property values (`--us-accent`, `--us-ink`, `--radius`, etc). Each component's own `<Name>.prompt.md` has a real composed usage example ported from this repo — prefer copying that composition pattern over inventing a new one, especially for the compound components (`Select`, `Sheet`, `Popover`, `Toast` all need their sub-parts assembled a specific way; see each one's own `.prompt.md`).

## Example

```jsx
<Card>
  <CardHeader>
    <CardTitle>Aida &amp; Yerlan</CardTitle>
    <CardDescription>Wedding invitation · Aug 30, 2026</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-us-ink-muted">128 guests invited · 96 confirmed</p>
  </CardContent>
  <CardFooter>
    <Button size="sm">Open editor</Button>
  </CardFooter>
</Card>
```
