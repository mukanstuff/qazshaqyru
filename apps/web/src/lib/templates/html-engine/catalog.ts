/**
 * Template catalog bootstrap — re-exports from the canonical registry.
 *
 * The actual registration lives in `lib/templates/manifests/index.ts`.
 * This file ensures the html-engine barrel (`@/lib/templates/html-engine`)
 * re-exports the canonical functions without duplicating REGISTRY.
 *
 * Add new HTML templates to `lib/templates/manifests/index.ts` — not here.
 */
export { getHtmlTemplateDescriptor, listHtmlTemplateSlugs } from '../manifests/index';
