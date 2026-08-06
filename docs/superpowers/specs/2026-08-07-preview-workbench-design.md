# Preview demo workbench — design

> `/preview/[templateKey]` redesign. Catalog → template preview → quick-edit flow.
> Single-page scope: only the public preview surface, not the editor.

## 1. Problem

The current `/preview/[templateKey]` surface has three correctness bugs and a UX that does not represent the brand:

1. **Header disappears after load.** `PreviewShell` wraps `GuestInvitationPage` in `fixed inset-0 z-50 flex flex-col`. The `guest-page` element inside has its own background (`#faf8f5`) and `min-height: 100dvh`. When the envelope intro closes and the body's `guest-page` paints, the visual layering makes the header feel invisible — there is no proper backdrop behind it (the white header has no fused background, the page itself is light, and the contrast collapses).
2. **Demo data leaks into guest UX.** `seatingTableName: '1'` is set in the demo API response. The `GuestTableNotice` section renders **"Сіздің үстеліңіз 1 · Қай үстелде отырғаныңызды көру →"** at the top of the preview. This is a per-guest artifact that has no place in a public catalog demo.
3. **Scrollbar is invisible.** The `guest-page` rule has `background: #faf8f5` but the inner scroll container (`<main>`) has no styled scrollbar on the outer wrapper. On a desktop viewing the preview, the scrollbar hits the system default which collapses on light backgrounds.

The result: a designer visiting `/preview/wedding-luxury` sees a half-broken demo that does not match the polished landing page or the wedding-luxury template itself.

## 2. Goal

Replace the surface with a professional mobile preview that:

- **Matches the brand.** Uses `us-atmosphere`, `us-device-frame`, `us-chrome-pill`, `--us-cta`, on the existing palette.
- **Stays focused.** Mobile-only aspect. No bloat from desktop device toggles, side panels, or settings tabs. The full editor already lives at `/invitations/[id]/canvas` — preview is *preview*, not a second editor.
- **Stays correct.** Persistent chrome buttons visible at all scroll positions. Demo data never bleeds guest-specific fields. Scrollbar is visibly styled.

## 3. Non-goals

- ❌ No changes to `LayoutRouter` internals. We use `previewChrome='framed'` + `suppressGuestChrome` contracts as designed.
- ❌ No changes to `wedding-luxury` manifest. Templates will be replaced by the user later through `/admin`.
- ❌ No changes to `/canvas` editor, `/quick-edit` flow, or `/i/[slug]` guest route.
- ❌ No i18n of the new chrome labels. Hardcoded Russian; locale switch is a separate scope.
- ❌ No 3D, perspective, parallax, shake, or "energetic" motion. Alatau palette is calm.

## 4. Architecture

```
/preview/[templateKey]                          (server, app router page)
  └─ <PreviewWorkbench client>                  ← root layout
       ├─ background: us-atmosphere (full bleed)
       ├─ <PreviewDeviceFrame>                   ← mobile-ratio container
       │    └─ <InvitationLayoutRouter>
       │         slug="demo"
       │         demoLayout={templateKey}
       │         suppressGuestChrome
       │         previewChrome="framed"          ← already in contract
       ├─ <PreviewFloatingBack href="/templates" />
       ├─ <PreviewFloatingEdit href="/quick-edit?template={key}" />
       └─ <noscript> fallback link
```

The `LayoutRouter` is the **single source of truth for what the invitation looks like**. The workbench only provides the outer chrome. This is the cleanest contract: changes to the template renderer never touch the wrapper, and changes to the wrapper never touch the renderer.

## 5. Layout

### Desktop / wide (>640px)

```
┌──────────────────────────────────────────────────────┐
│  [← Назад]                                           │
│                                                       │
│                                                       │
│                    ┌────────────┐                     │
│                    │            │                     │
│                    │            │                     │
│                    │  PHONE     │                     │
│                    │  390 × 844 │                     │
│                    │            │                     │
│                    │            │                     │
│                    │            │                     │
│                    │            │                     │
│                    └────────────┘                     │
│                                                       │
│                                                       │
│           [ ✎  Редактировать шаблон  ]               │
│                                                       │
└──────────────────────────────────────────────────────┘
```

- Background: `us-atmosphere` (ivory + cloud + turquoise radial).
- Phone frame: `us-device-frame`, centered horizontally, vertically biased toward the top so the bottom CTA never collides with the device on short viewports.
- Top-left button: `us-chrome-pill`, 16px from top-left, 12px from left.
- Bottom CTA: `bg-us-cta text-white`, pill, centered, 24px from bottom, max-width 360px.

### Mobile (≤640px)

The phone frame fills the viewport height. The phone-body has its own scroll, the page itself stays static. Back button stays top-left, edit CTA stays bottom-center.

```
┌──────────────────────────┐
│ [← Назад]   ☁  Atmosphere│
│                            │
│ ┌────────────────────────┐ │
│ │                        │ │
│ │       PHONE            │ │
│ │       (fills)          │ │
│ │                        │ │
│ │   scrollable inside    │ │
│ │                        │ │
│ │                        │ │
│ │                        │ │
│ │                        │ │
│ │                        │ │
│ └────────────────────────┘ │
│                            │
│  [ ✎ Редактировать ]       │
└──────────────────────────┘
```

Same components, but the device takes 100% width minus 16px padding, the frame radius shrinks (`lg` instead of `2rem`), and there is no top/bottom margin on the device.

## 6. Components

### `PreviewWorkbench` (root)

| File | Role |
|---|---|
| `apps/web/src/app/preview/[templateKey]/_components/PreviewWorkbench.tsx` | Client component. Owns demoLayout state, renders background + device + floating chrome. |

```ts
interface Props {
  templateSlug: string;
  templateTitle: string;
  backHref: string;
  editHref: string;
}
```

```tsx
export function PreviewWorkbench({ templateSlug, templateTitle, backHref, editHref }: Props) {
  return (
    <main className="relative min-h-dvh w-full us-atmosphere">
      <div className="absolute inset-x-0 top-0 z-30 p-4 sm:p-6">
        <PreviewFloatingBack href={backHref} />
      </div>
      <div className="flex min-h-dvh items-start justify-center px-4 pb-32 pt-20 sm:items-center sm:pb-40 sm:pt-24">
        <PreviewDeviceFrame>
          <InvitationLayoutRouter
            slug="demo"
            guestToken={null}
            familyToken={null}
            demoLayout={templateSlug}
            suppressGuestChrome
            previewChrome="framed"
          />
        </PreviewDeviceFrame>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-4 sm:p-6">
        <div className="pointer-events-auto">
          <PreviewFloatingEdit href={editHref} title={templateTitle} />
        </div>
      </div>
    </main>
  );
}
```

### `PreviewDeviceFrame`

| File | Role |
|---|---|
| `apps/web/src/app/preview/[templateKey]/_components/PreviewDeviceFrame.tsx` | Aspect-locked container. Hides scrollbar visually but keeps wheel/touch scroll. |

- Aspect: `aspect-[9/19.5]` (iPhone 14-ish, 390×844).
- Width: `w-full max-w-[390px]` on mobile, `w-[390px]` on desktop.
- Scroll is handled **inside** the device via `overflow-y-auto` on the `<InvitationLayoutRouter>` wrapper (the layout route already gets `framedPreview` and applies `guest-page--editor-frame` which wires `overflow-y: visible` to the inner `.inv-manifest`).

```tsx
export function PreviewDeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="us-device-frame max-h-[calc(100dvh-7rem)] w-full max-w-[390px] overflow-hidden">
      <div className="us-device-frame__screen h-full overflow-y-auto">{children}</div>
    </div>
  );
}
```

### `PreviewFloatingBack`

| File | Role |
|---|---|
| `apps/web/src/app/preview/[templateKey]/_components/PreviewFloatingBack.tsx` | Glass pill, top-left, links to `/templates`. |

```tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function PreviewFloatingBack({ href }: { href: string }) {
  return (
    <Link href={href} className="us-chrome-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-us-ink">
      <ArrowLeft className="h-4 w-4" />
      Назад
    </Link>
  );
}
```

### `PreviewFloatingEdit`

| File | Role |
|---|---|
| `apps/web/src/app/preview/[templateKey]/_components/PreviewFloatingEdit.tsx` | Primary CTA, bottom-center, links to `/quick-edit?template={key}`. |

```tsx
import Link from 'next/link';
import { PencilLine } from 'lucide-react';

export function PreviewFloatingEdit({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-us-cta px-6 py-3 text-sm font-semibold text-white shadow-us-lg transition hover:bg-us-cta-hover active:scale-[0.98]"
      aria-label={`Редактировать шаблон: ${title}`}
    >
      <PencilLine className="h-4 w-4" />
      Редактировать шаблон
    </Link>
  );
}
```

## 7. Bug fixes (related but in scope)

### Demo API — drop guest-specific fields

**File:** `apps/web/src/app/api/invitations/public/demo/route.ts`

- Remove `seatingTableName: '1'`. This is a per-guest artifact. The preview MUST look like a public, anonymous, catalog demo.
- Keep `openRsvp: true` — that is a sensible "this is a working invitation" demo behavior.

### PreviewScrollbar visibility

**File:** `apps/web/src/styles/editor-scrollbars.css` (or new side-effect file).

The outer device scroll container uses `us-device-frame__screen` which already has `overflow: hidden`. The actual scroll happens inside `.guest-page--editor-frame .inv-manifest` via the editor-frame CSS. We add a thin on-brand scrollbar for desktop:

```css
.us-device-frame__screen::-webkit-scrollbar {
  width: 6px;
}
.us-device-frame__screen::-webkit-scrollbar-track {
  background: transparent;
}
.us-device-frame__screen::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--us-deep) 18%, transparent);
  border-radius: 999px;
}
.us-device-frame__screen {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--us-deep) 18%, transparent) transparent;
}
```

## 8. Test plan

Visual verification only. This is a showcase surface, not critical business logic.

| Check | Where |
|---|---|
| Page renders, "Назад" visible top-left, "Редактировать" visible bottom-center | `http://localhost:3001/preview/wedding-luxury` on mobile and desktop |
| Scrolling inside the phone does not hide the chrome buttons | Same. Click outside device, scroll wheel: should not scroll the page. Wheel inside device: should scroll the invitation. |
| "Сіздің үстеліңіз 1" does NOT appear | DevTools → search for `GuestTableNotice`. |
| Tailwind classes resolve in served CSS | `/_next/static/css/app/layout.css` contains the rule for `us-chrome-pill` and `bg-us-cta`. |
| Reduced motion: no entrance animation burden | `prefers-reduced-motion: reduce` → no flash, no slide. |

Manual checks; no unit tests. The contract is "looks right on phones."

## 9. Migration / rollout

- `PreviewShell.tsx` is **deleted** in the same commit. The new `PreviewWorkbench` replaces it.
- The route file `page.tsx` is updated to render `PreviewWorkbench` instead of `PreviewShell`.
- The demo API change is a one-line fix in the same commit.
- No DB migration, no env changes, no feature flag needed.

## 10. Risks

| Risk | Mitigation |
|---|---|
| `us-device-frame` already exists but may not be tall enough on desktop | Add `min-h-[640px]` to the screen on desktop. Test on 1366×768. |
| `us-chrome-pill` may not provide enough contrast on `us-atmosphere` | Fallback: override with `bg-white/80 text-us-ink border border-us-border-strong` if visual check fails. |
| `LayoutRouter` envelope intro fights chrome on rapid reopen | `framedPreview` already sets `hideGuestChrome = true`. Verified. |
| `seatingTableName` removal breaks an integration test | Search for tests referencing `seatingTableName` in `/api/invitations/public/demo`. If found, update. |
| User later adds a manifest section that overrides `bg-us-cta` somehow | Out of scope. Manifest changes go through the manifest system, not the workbench. |

## 11. Open questions

None. All clarifications received in the brainstorming session. Spec self-review:

- ✅ No placeholders (no TBD, no TODO).
- ✅ Consistent (architecture matches component layout, no contradictions).
- ✅ Scoped (single surface, no editor changes).
- ✅ Unambiguous (every UI element has exactly one placement and one behavior).
