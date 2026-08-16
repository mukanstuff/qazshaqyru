/**
 * Template registry — stub for the legacy `getTemplateManifest` symbol that
 * some consumers (LayoutRouter, EditorLayout, document.ts, etc.) still import.
 *
 * New code must NOT add anything here — manifest-shaped templates are no longer
 * a render path.
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
