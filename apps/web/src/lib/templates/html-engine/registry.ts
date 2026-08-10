/**
 * HTML-template registry — single source of truth for available templates.
 *
 * Phase 1: hand-registered `luxe-gold`. Phase 2+: programmatic discovery or DB-driven.
 */

import type { HtmlTemplateDescriptor } from './types';

const REGISTRY: Record<string, HtmlTemplateDescriptor> = {};

export function getHtmlTemplateDescriptor(slug: string): HtmlTemplateDescriptor | null {
  return REGISTRY[slug] ?? null;
}

export function listHtmlTemplateSlugs(): string[] {
  return Object.keys(REGISTRY);
}

export function registerHtmlTemplate(descriptor: HtmlTemplateDescriptor): void {
  REGISTRY[descriptor.slug] = descriptor;
}

/**
 * Test/seed helper — clears the registry. Do not call from runtime.
 */
export function clearHtmlTemplateRegistry(): void {
  for (const key of Object.keys(REGISTRY)) {
    delete REGISTRY[key];
  }
}
