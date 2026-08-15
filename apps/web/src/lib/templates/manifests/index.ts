/**
 * Template registry — list of HTML-engine templates available in the catalog.
 *
 * Step 1.2: HTML-engine templates (hello-world, test-demo) were removed entirely
 * (lib/templates/html-engine, public/templates-html, components/html-editor).
 * This file now exists only to satisfy the legacy `getTemplateManifest` stub that
 * some consumers (LayoutRouter, EditorLayout, document.ts, etc.) still import.
 *
 * New code must NOT add anything here — there is no html-engine anymore.
 */
import type { TemplateManifest } from '../manifest-types';

/**
 * Stub — was used by LayoutRouter for legacy manifest-template rendering.
 * Manifest files (wedding-luxury.ts etc.) were removed in a prior refactor
 * and the manifest path is deprecated in favour of canvas templates.
 */
export function getTemplateManifest(_slug: string): TemplateManifest | null {
  return null;
}
