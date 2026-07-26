# ADR-001: Invitation editor foundation (этаж 1)

**Status:** Accepted  
**Date:** 2026-07-15  
**Context:** KZ/RU digital invitations; owner designs templates; engineering owns connection standard.

## Decision

**Primary render path for production: `react-sections`.**

One shared renderer (`SectionRenderer` + registered section components) for guest view and live editor. Edit mode adds chrome (tap targets / panel bindings), not a second layout tree.

**Template Contract** (TS manifest) is the machine-readable handoff surface:

- identity / category / preview meta
- sections (id, type, defaultVisible, canHide, canReorder)
- editable slots/fields (typed, i18n labels, constraints)
- asset slots + theme tokens
- `renderEngine: 'react-sections'` (only prod value on этаж 1)

**Canonical state:** `InvitationDocument` (`schemaVersion: 1`). Wizard/form may bootstrap fields; form bag is never source of truth.

## Alternatives considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Free-position canvas (shaqyru24 / GrapesJS) | Max layout freedom | Years of studio work; users break design; forbidden by product | Rejected for foundation |
| HTML iframe + postMessage (toi) | Designer delivers HTML; true WYSIWYG | New protocol + sandbox from zero; dual with existing React guest path | Deferred — future `renderEngine` under **same** document + contract |
| React sections (chosen) | Guest path already ships; one renderer; contract maps → components | Unique author layout still needs section wiring or CSS theme | **Accepted for этаж 1** |

## Designer handoff model

Owner delivers visual design (Figma/HTML/CSS assets). Engineering connects without inventing a new architecture:

1. Follow `docs/templates/HOW-TO-ADD-A-TEMPLATE.md`
2. Declare Template Contract
3. Map sections to registered `SectionType` components (or reuse stub sections + theme/assets)
4. Register in catalog when ready for sale
5. Verify guest/editor parity checklist

Agents **must not** generate “pretty flagship” templates as product quality. Temporary catalog slug `wedding-luxury` is a generative placeholder bridge only.

## Non-prod / deprecated

| Surface | Status |
|---------|--------|
| QuickEdit form-as-truth create | Deprecated — create opens Live Editor |
| `EditorLayout` / `DraftEditorLayout` | Legacy, unrouted; do not revive as second product path |
| `HtmlTemplateRenderer` | Spike only; not prod create/guest path |
| GrapesJS / Unlayer / Craft | Forbidden unless future ADR overturns this |

## Persistence

Document persists via existing Invitation columns + reserved `templateData.__documentState` for section visibility/order/theme overrides/`schemaVersion`. Migration path to dedicated `documentJson` column is allowed later without changing canonical TypeScript schema.

## Consequences

- Create → instantiate document from contract → Live Editor → save → guest same render path
- New templates plug in by standard, not one-off hacks
- HTML iframe can be added later as second `renderEngine` without forking document model
