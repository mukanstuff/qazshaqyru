# Preview Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken `/preview/[templateKey]` surface with a mobile-first showcase that uses the project's Alatau design tokens, has persistent floating chrome, and stops leaking guest-specific demo data.

**Architecture:** Server route `/preview/[templateKey]` resolves the template, then renders a new client workbench. The workbench composes an atmosphere background, a phone-shaped device frame, and two floating glass buttons (Back, Edit). The existing `InvitationLayoutRouter` is the source of truth for the invitation itself — we pass `previewChrome='framed'` and `suppressGuestChrome` and do not touch it. Demo API loses guest-only fields.

**Tech Stack:** Next.js 14.2 App Router, React 18, Tailwind CSS, existing `us-*` design tokens, `lucide-react` icons, existing `InvitationLayoutRouter`.

**Spec:** `docs/superpowers/specs/2026-08-07-preview-workbench-design.md`

## Global Constraints

- **No changes to `LayoutRouter` internals.** Use `previewChrome='framed'` + `suppressGuestChrome` as the contract.
- **No changes to `wedding-luxury` manifest.** Templates will be replaced by the user through `/admin` later.
- **Brand colors only.** Use `us-atmosphere`, `us-device-frame`, `us-chrome-pill`, `bg-us-cta`. No new tokens.
- **Mobile-first.** The phone fills the viewport on mobile; sits centered with margins on desktop.
- **No i18n in this scope.** Chrome labels are hardcoded Russian.
- **Local dev port:** `http://localhost:3001` (3000 is often taken — confirm before opening).
- **Verify CSS in served bundle** before declaring done (per workspace rule `verify-css-changes.mdc`).

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `apps/web/src/app/preview/[templateKey]/page.tsx` | **Modify** | Server route, resolves template, renders `<PreviewWorkbench>` |
| `apps/web/src/app/preview/[templateKey]/_components/PreviewWorkbench.tsx` | **Create** | Root client layout, owns the composition |
| `apps/web/src/app/preview/[templateKey]/_components/PreviewDeviceFrame.tsx` | **Create** | Aspect-locked phone container |
| `apps/web/src/app/preview/[templateKey]/_components/PreviewFloatingBack.tsx` | **Create** | Top-left glass pill, link to `/templates` |
| `apps/web/src/app/preview/[templateKey]/_components/PreviewFloatingEdit.tsx` | **Create** | Bottom-center primary CTA, links to `/quick-edit` |
| `apps/web/src/app/preview/[templateKey]/PreviewShell.tsx` | **Delete** | Replaced by `PreviewWorkbench` |
| `apps/web/src/app/preview/[templateKey]/__tests__/preview-workbench.test.tsx` | **Create** | Smoke test for workbench composition |
| `apps/web/src/app/api/invitations/public/demo/route.ts` | **Modify** | Remove `seatingTableName: '1'` |
| `apps/web/src/styles/editor-scrollbars.css` | **Modify** | Append on-brand scrollbar for the device frame |

---

## Task 1: Fix demo API — drop seatingTableName

**Files:**
- Modify: `apps/web/src/app/api/invitations/public/demo/route.ts:108`

**Interfaces:**
- Consumes: existing GET handler, no new exports
- Produces: `invitation` object without `seatingTableName` field

- [ ] **Step 1: Locate the offending line**

```bash
grep -n "seatingTableName" apps/web/src/app/api/invitations/public/demo/route.ts
```

Expected: line 108 with `seatingTableName: '1',`

- [ ] **Step 2: Remove the line**

Delete the line `seatingTableName: '1',` from the returned `invitation` object in `apps/web/src/app/api/invitations/public/demo/route.ts`.

After edit, the object's last line should be `openRsvp: true,` followed by `},`.

- [ ] **Step 3: Verify no other test references the demo field**

```bash
grep -rn "seatingTableName" apps/web/src/app/api/invitations/public/demo
grep -rn "demo.*seatingTableName" apps/web/src
```

Expected: no matches inside the demo route. If something else references it, leave it; demo API is the only source we are changing.

- [ ] **Step 4: Smoke-check the route still compiles**

```bash
cd apps/web
npx tsc --noEmit apps/web/src/app/api/invitations/public/demo/route.ts
```

Expected: no errors. (Or run `pnpm exec tsc --noEmit` from `apps/web` if the first command fails — Next.js does not typecheck individual files.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/invitations/public/demo/route.ts
git commit -m "fix(preview): drop seatingTableName from demo API"
```

---

## Task 2: Add visible scrollbar styling for the device frame

**Files:**
- Modify: `apps/web/src/styles/editor-scrollbars.css` (append at the end)

**Interfaces:**
- Consumes: existing CSS file
- Produces: Themable scrollbar for `.us-device-frame__screen`

- [ ] **Step 1: Read the current file**

```bash
wc -l apps/web/src/styles/editor-scrollbars.css
```

Expected: file exists. Read the last 20 lines to find the append point.

- [ ] **Step 2: Append the scrollbar rule**

Append at the end of `apps/web/src/styles/editor-scrollbars.css`:

```css
/*
 * Preview workbench — device frame scrollbar.
 * Visible on desktop, transparent on touch (mobile).
 */
.us-device-frame__screen {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--us-deep) 18%, transparent) transparent;
}

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

.us-device-frame__screen::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--us-deep) 32%, transparent);
}
```

- [ ] **Step 3: Verify the CSS file is imported**

```bash
grep -rn "editor-scrollbars.css" apps/web/src/app apps/web/src/components
```

Expected: at least one import. If missing, add the import to `apps/web/src/app/globals.css` near the bottom (after the existing `@layer` rules).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/styles/editor-scrollbars.css
git commit -m "style(preview): visible on-brand scrollbar for device frame"
```

---

## Task 3: Create `PreviewFloatingBack` component

**Files:**
- Create: `apps/web/src/app/preview/[templateKey]/_components/PreviewFloatingBack.tsx`

**Interfaces:**
- Consumes: `href: string` prop
- Produces: reusable glass pill link (no internal state)

- [ ] **Step 1: Create the component file**

Create `apps/web/src/app/preview/[templateKey]/_components/PreviewFloatingBack.tsx`:

```tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  href: string;
  label?: string;
}

export function PreviewFloatingBack({ href, label = 'Назад' }: Props) {
  return (
    <Link
      href={href}
      className="us-chrome-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-us-ink transition hover:translate-y-[-1px] active:scale-[0.97]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/preview/[templateKey]/_components/PreviewFloatingBack.tsx
git commit -m "feat(preview): floating back button"
```

---

## Task 4: Create `PreviewFloatingEdit` component

**Files:**
- Create: `apps/web/src/app/preview/[templateKey]/_components/PreviewFloatingEdit.tsx`

**Interfaces:**
- Consumes: `href: string`, `title: string` props
- Produces: primary CTA link, no internal state

- [ ] **Step 1: Create the component file**

Create `apps/web/src/app/preview/[templateKey]/_components/PreviewFloatingEdit.tsx`:

```tsx
import Link from 'next/link';
import { PencilLine } from 'lucide-react';

interface Props {
  href: string;
  title: string;
  label?: string;
}

export function PreviewFloatingEdit({ href, title, label = 'Редактировать шаблон' }: Props) {
  return (
    <Link
      href={href}
      aria-label={`${label}: ${title}`}
      className="inline-flex items-center gap-2 rounded-full bg-us-cta px-6 py-3 text-sm font-semibold text-white shadow-us-lg transition hover:bg-us-cta-hover active:scale-[0.97]"
    >
      <PencilLine className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors. Confirm `bg-us-cta`, `bg-us-cta-hover`, `shadow-us-lg` exist in `tailwind.config.ts` (they do — confirmed in spec §6).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/preview/[templateKey]/_components/PreviewFloatingEdit.tsx
git commit -m "feat(preview): floating edit CTA"
```

---

## Task 5: Create `PreviewDeviceFrame` component

**Files:**
- Create: `apps/web/src/app/preview/[templateKey]/_components/PreviewDeviceFrame.tsx`

**Interfaces:**
- Consumes: `children: React.ReactNode`
- Produces: aspect-locked phone container with internal scroll

- [ ] **Step 1: Create the component file**

Create `apps/web/src/app/preview/[templateKey]/_components/PreviewDeviceFrame.tsx`:

```tsx
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function PreviewDeviceFrame({ children }: Props) {
  return (
    <div className="us-device-frame mx-auto w-full max-w-[390px] overflow-hidden">
      <div className="us-device-frame__screen h-full max-h-[calc(100dvh-9rem)] overflow-y-auto sm:max-h-[844px]">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/preview/[templateKey]/_components/PreviewDeviceFrame.tsx
git commit -m "feat(preview): device frame component"
```

---

## Task 6: Create `PreviewWorkbench` root component

**Files:**
- Create: `apps/web/src/app/preview/[templateKey]/_components/PreviewWorkbench.tsx`

**Interfaces:**
- Consumes: `templateSlug: string`, `templateTitle: string`, `backHref: string`, `editHref: string`
- Produces: `layout` JSX composing background + device + floating chrome

- [ ] **Step 1: Create the component file**

Create `apps/web/src/app/preview/[templateKey]/_components/PreviewWorkbench.tsx`:

```tsx
'use client';

import { InvitationLayoutRouter } from '@/components/invitation-layouts/LayoutRouter';
import { PreviewDeviceFrame } from './PreviewDeviceFrame';
import { PreviewFloatingBack } from './PreviewFloatingBack';
import { PreviewFloatingEdit } from './PreviewFloatingEdit';

interface Props {
  templateSlug: string;
  templateTitle: string;
  backHref: string;
  editHref: string;
}

export function PreviewWorkbench({
  templateSlug,
  templateTitle,
  backHref,
  editHref,
}: Props) {
  return (
    <main className="us-atmosphere relative min-h-dvh w-full overflow-hidden">
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

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors. The `InvitationLayoutRouter` accepts `previewChrome='framed'` and `suppressGuestChrome` (confirmed in `LayoutRouter.tsx`).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/preview/[templateKey]/_components/PreviewWorkbench.tsx
git commit -m "feat(preview): workbench root composing chrome and device"
```

---

## Task 7: Wire `page.tsx` to `PreviewWorkbench` and delete `PreviewShell.tsx`

**Files:**
- Modify: `apps/web/src/app/preview/[templateKey]/page.tsx`
- Delete: `apps/web/src/app/preview/[templateKey]/PreviewShell.tsx`

**Interfaces:**
- Consumes: server-side `params` Promise
- Produces: Workbench-aware page

- [ ] **Step 1: Replace the page contents**

Replace `apps/web/src/app/preview/[templateKey]/page.tsx` with:

```tsx
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import { getI18n } from '@/i18n/server';
import { getTemplate } from '@/lib/templates';
import { PreviewWorkbench } from './_components/PreviewWorkbench';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ templateKey: string }>;
}

export default async function PreviewPage({ params }: Props) {
  const { templateKey: slug } = await params;
  const template = await resolveTemplateBySlug(slug);
  const { locale } = await getI18n();
  const backHref = locale === 'kz' ? '/kz/templates' : '/ru/templates';
  const editHref = `/quick-edit?template=${encodeURIComponent(slug)}`;

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-us-ivory text-us-ink">
        <div className="text-center">
          <p className="mb-4">Шаблон «{slug}» не найден.</p>
          <a href={backHref} className="underline">
            Вернуться к каталогу
          </a>
        </div>
      </div>
    );
  }

  const config = getTemplate(template.slug);
  const title = config?.name ?? template.slug;

  return (
    <PreviewWorkbench
      templateSlug={template.slug}
      templateTitle={title}
      backHref={backHref}
      editHref={editHref}
    />
  );
}
```

- [ ] **Step 2: Verify imports exist**

```bash
grep -n "export" apps/web/src/lib/templates/index.ts | head -5
grep -n "getTemplate" apps/web/src/lib/templates/index.ts
```

Expected: `getTemplate` is exported. If exported from a different path, adjust the import.

- [ ] **Step 3: Delete the old shell**

```bash
rm apps/web/src/app/preview/[templateKey]/PreviewShell.tsx
```

- [ ] **Step 4: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors. No leftover references to `PreviewShell`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/preview/[templateKey]/page.tsx
git rm apps/web/src/app/preview/[templateKey]/PreviewShell.tsx
git commit -m "refactor(preview): route through PreviewWorkbench, drop PreviewShell"
```

---

## Task 8: Smoke test for the workbench composition

**Files:**
- Create: `apps/web/src/app/preview/[templateKey]/__tests__/preview-workbench.test.tsx`

**Interfaces:**
- Consumes: React testing-library, vitest or jest (whichever the project uses)
- Produces: a single test that asserts the workbench renders Back and Edit on the page

- [ ] **Step 1: Inspect test runner**

```bash
cat apps/web/package.json | grep -E "(test|vitest|jest)" | head -5
ls apps/web/src/app/preview/[templateKey]
```

Expected: either `vitest` or `jest` configured. If neither, skip this task — the project does not test preview routes.

- [ ] **Step 2: Create the test file**

Create `apps/web/src/app/preview/[templateKey]/__tests__/preview-workbench.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/invitation-layouts/LayoutRouter', () => ({
  InvitationLayoutRouter: () => <div data-testid="invitation-layout" />,
}));

import { PreviewWorkbench } from '../_components/PreviewWorkbench';

describe('PreviewWorkbench', () => {
  it('renders floating back and edit chrome', () => {
    render(
      <PreviewWorkbench
        templateSlug="wedding-luxury"
        templateTitle="Wedding Luxury"
        backHref="/templates"
        editHref="/quick-edit?template=wedding-luxury"
      />,
    );

    expect(screen.getByRole('link', { name: /назад/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /редактировать шаблон: wedding luxury/i }),
    ).toHaveAttribute('href', '/quick-edit?template=wedding-luxury');
  });
});
```

- [ ] **Step 3: Run the test**

```bash
cd apps/web && pnpm test -- preview-workbench
```

Expected: 1 passed.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/preview/[templateKey]/__tests__/preview-workbench.test.tsx
git commit -m "test(preview): workbench renders back and edit chrome"
```

---

## Task 9: Visual verification in the browser

**Files:** none (manual)

- [ ] **Step 1: Confirm dev server is running on port 3001**

```bash
curl -sI http://localhost:3001/ | head -1
```

Expected: `HTTP/1.1 200 OK`. If not, start it: `cd apps/web && pnpm dev` (background).

- [ ] **Step 2: Open the page in the browser**

Navigate to `http://localhost:3001/preview/wedding-luxury` in the embedded browser at side position.

- [ ] **Step 3: Verify back button is visible at top-left**

Take a screenshot. Confirm: top-left pill, dark ink text on glass background, says "Назад".

- [ ] **Step 4: Verify edit CTA is visible at bottom-center**

Take a screenshot. Confirm: bottom-center, dark graphite background, white text "Редактировать шаблон", pencil icon.

- [ ] **Step 5: Scroll inside the device, chrome stays fixed**

Scroll the mouse wheel over the device. Confirmation: the invitation scrolls inside the device; the chrome buttons do not move.

- [ ] **Step 6: Confirm "Сіздің үстеліңіз 1" is gone**

DevTools → Elements → search for `GuestTableNotice` or `үстеліңіз`. Expected: no matches.

- [ ] **Step 7: Confirm us-chrome-pill rule is in the served CSS**

```bash
curl -s http://localhost:3001/_next/static/css/app/layout.css | grep -A 2 "us-chrome-pill" | head -20
```

Expected: rule present in the served bundle. If not, see `verify-css-changes.mdc` in workspace rules.

- [ ] **Step 8: Test on mobile viewport**

In the browser, set the viewport to 390×844. Take a screenshot. Confirm: phone fills the viewport, chrome stays visible, no overflow.

- [ ] **Step 9: Final commit if any visual CSS nudges were needed**

If you had to adjust padding/colors, commit:

```bash
git add -u
git commit -m "style(preview): visual polish after browser check"
```

---

## Self-Review

**1. Spec coverage:**
- §4 Architecture → Task 6 (`PreviewWorkbench`) + Task 7 (`page.tsx` wiring).
- §5 Layout (desktop + mobile) → Task 5 (`PreviewDeviceFrame`) + Task 6 (responsive composition).
- §6 Components → Tasks 3, 4, 5, 6 (one per component).
- §7 Bug fixes → Task 1 (demo API) + Task 2 (scrollbar).
- §8 Test plan → Task 8 (unit) + Task 9 (visual).

**2. Placeholder scan:** No "TBD", "TODO", "implement later", "fill in details". All code blocks contain the actual code.

**3. Type consistency:** `Props` interfaces match across Tasks 3, 4, 5, 6. Workbench passes them to the correct components. `InvitationLayoutRouter` props match the contract in `LayoutRouter.tsx`.

**Plan complete and saved to `docs/superpowers/plans/2026-08-07-preview-workbench.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
