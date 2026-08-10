/**
 * Public selector — choose rendering path for `/i/[slug]`.
 *
 * Pure data layer. Returns a discriminated union describing which engine to use.
 * Server component imports this and decides between:
 *   - `kind: 'html'` → invoke HTML-engine renderer directly (SSR HTML stream).
 *   - `kind: 'react'` → fallback to PublicInvitationClient (legacy React-sections).
 *   - `kind: 'missing'` → 404.
 */

import type { HtmlTemplateDescriptor } from './types';

export type GuestRenderPath =
  | { kind: 'html'; descriptor: HtmlTemplateDescriptor; slug: string }
  | { kind: 'react'; slug: string; reason: 'no-html-descriptor' | 'no-template-binding' }
  | { kind: 'missing'; slug: string };

/**
 * Map a slug to a rendering path.
 *
 * Phase 1 rule: an explicit list of HTML-engine slugs is the source of truth.
 * Phase 2: derive from invitation.templateKey lookup against `listHtmlTemplateSlugs()`.
 */
export function resolveGuestRenderPath(
  slug: string,
  options: {
    htmlSlugs?: Iterable<string>;
    descriptors?: Iterable<HtmlTemplateDescriptor>;
  } = {},
): GuestRenderPath {
  const htmlSlugs = new Set(options.htmlSlugs ?? []);
  if (htmlSlugs.has(slug)) {
    for (const descriptor of options.descriptors ?? []) {
      if (descriptor.slug === slug) {
        return { kind: 'html', descriptor, slug };
      }
    }
  }
  return { kind: 'react', slug, reason: 'no-html-descriptor' };
}