# How to add a template

Checklist for connecting a new invitation template via the **Template Contract**. See [ADR-001](../architecture/ADR-001-invitation-editor-foundation.md).

**Product note:** design assets are owned by humans. Agents only wire manifests + catalog registration. Goal: 8–15 live templates across toi types (wedding / қыз ұзату / сүндет / тұсаукесер / мерейтой / …), not one luxury flagship.

## 1. Files (site / react-sections)

| Step | Location |
|------|----------|
| Contract / manifest | `src/lib/templates/manifests/<slug>.ts` |
| Register | `src/lib/templates/manifests/index.ts` |
| Config (slug resolve) | `src/lib/templates/configs.ts` → `TEMPLATE_CONFIGS` |
| Assets (optional) | `public/assets/templates/<slug>/…` |
| Sales catalog (only when ready) | DB `Template` row + `catalog.ts` allowlist |
| Category route | `Template.category` + `/templates/<category>` (see `template-categories.ts`) |
| Remove placeholder | Drop slug from `coming-soon.ts` |

Dev/test-only fixtures (e.g. `wiring-stub`) register in manifests + `TEMPLATE_CONFIGS` but **stay out of** the sales catalog.

## 2. Contract requirements (site)

- `renderEngine: 'react-sections'`
- `sections[]` with stable `id`, `type`, `defaultVisible`, `canHide`, `canReorder`
- `fields[]` typed slots with `labelRu` / `labelKz`
- `theme` tokens + `assets` map as needed
- Reuse registered `SectionType` components — do not invent one-off layout trees

## 3. Parity (guest = editor)

1. `instantiateInvitationDocument(contract)` → valid `InvitationDocument` (`schemaVersion: 1`)
2. Guest `/i/[slug]` and Live Editor `/invitations/edit` both render via `SectionRenderer`
3. Hide/reorder sections via `__documentState` — guest must respect the same visibility/order
4. Editable slots: at least text (hero names) + cover photo in edit mode

## 4. Forbidden

- No generative “flagship / эталон” product copy for agent-authored templates
- No one-off hacks in `SectionRenderer` / editor core for a single slug
- No GrapesJS / free-position canvas
- Do not revive QuickEdit / `EditorLayout` as a second create path

## 5. Smoke check

```text
create → Live Editor → edit text/cover → AI one-tap text → hide section → save draft → open guest preview
```

Unit: wiring-stub registration + instantiate → document → render section list.
