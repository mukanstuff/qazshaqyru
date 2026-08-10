/**
 * Template registry — list of HTML-engine templates available in the catalog.
 *
 * This is the CANONICAL registry. All consumers (server routes, preview, catalog)
 * must use `getHtmlTemplateDescriptor` / `listHtmlTemplateSlugs` from here.
 *
 * Resolution order:
 *   1. /i/[slug] server checks this registry → if hit, render via HtmlTemplateEngine.
 *   2. Otherwise 404 (no react-sections fallback — Phase 1 ships HTML-only).
 */
import type { HtmlTemplateDescriptor } from './html-engine/types';
import type { Locale } from './html-engine/types';
import type { TemplateManifest } from '../manifest-types';

const REGISTRY: Record<string, HtmlTemplateDescriptor> = {
  // Phase 1 — pipeline validation template (do not remove).
  'hello-world': {
    slug: 'hello-world',
    name: 'Hello World (pipeline-test)',
    htmlPath: '/templates-html/hello-world/index.html',
    assetsDir: '/templates-html/hello-world',
    accent: '#c8a96a',
    eventTypes: ['wedding', 'generic'],
    fields: [
      { key: 'groomName', defaults: { kz: 'Асет', ru: 'Асет' } as Partial<Record<Locale, string>> },
      { key: 'brideName', defaults: { kz: 'Айым', ru: 'Айым' } as Partial<Record<Locale, string>> },
      { key: 'eventDate', default: '2026-09-12' },
      { key: 'eventTime', default: '17:00' },
      { key: 'eventPlace', defaults: { kz: '«Жарық» мейрамханасы', ru: 'Ресторан «Жарық»' } as Partial<Record<Locale, string>> },
    ],
    computed: [{ key: 'couple', expr: '${groomName} & ${brideName}' }],
  },

  // Test template.
  'test-demo': {
    slug: 'test-demo',
    name: 'Тест-демо',
    htmlPath: '/templates-html/test-demo/index.html',
    assetsDir: '/templates-html/test-demo',
    accent: '#c8a96a',
    eventTypes: ['generic'],
    fields: [
      { key: 'groomName', defaults: { kz: 'Тест', ru: 'Тест' } as Partial<Record<Locale, string>> },
      { key: 'brideName', defaults: { kz: 'Шаблон', ru: 'Шаблон' } as Partial<Record<Locale, string>> },
      { key: 'eventDate', default: '2026-09-12' },
      { key: 'eventTime', default: '17:00' },
      { key: 'eventPlace', defaults: { kz: 'Тест', ru: 'Тест' } as Partial<Record<Locale, string>> },
    ],
    computed: [{ key: 'couple', expr: '${groomName} & ${brideName}' }],
  },
};

export function getHtmlTemplateDescriptor(slug: string): HtmlTemplateDescriptor | null {
  return REGISTRY[slug] ?? null;
}

export function listHtmlTemplateSlugs(): string[] {
  return Object.keys(REGISTRY);
}

/** @deprecated Use registerHtmlTemplate only for tests. Prefer adding to REGISTRY above. */
export function registerHtmlTemplate(descriptor: HtmlTemplateDescriptor): void {
  REGISTRY[descriptor.slug] = descriptor;
}

/**
 * Stub — getTemplateManifest was used by LayoutRouter for manifest-template rendering.
 * The manifest files (wedding-luxury.ts etc.) were removed in a prior refactor.
 * Only affects the React sections path; HTML-engine does not use this.
 */
export function getTemplateManifest(_slug: string): TemplateManifest | null {
  return null;
}
