/**
 * Resolve Suret (фото-приглашение) keys without collapsing to wedding-luxury.
 */

import { getSuretManifest, listSuretManifests } from '@/lib/templates/suret-manifests';
import type { SuretTemplateManifest } from '@/lib/templates/manifest-types';

export function isSuretTemplateKey(key: string): boolean {
  return getSuretManifest(key) != null;
}

export function resolveSuretManifest(key: string): SuretTemplateManifest | null {
  return getSuretManifest(key);
}

/** Canonical slug used in Invitation.templateKey + DB Template.slug */
export function resolveSuretSlug(key: string): string | null {
  return getSuretManifest(key)?.slug ?? null;
}

export function listSuretWiringSlugs(): string[] {
  return listSuretManifests().map((m) => m.slug);
}

export function readSuretSlots(
  templateData: unknown,
): Record<string, string> {
  if (!templateData || typeof templateData !== 'object') return {};
  const slots = (templateData as { suretSlots?: unknown }).suretSlots;
  if (!slots || typeof slots !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(slots as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

export function withSuretSlots(
  templateData: Record<string, unknown> | null | undefined,
  slots: Record<string, string>,
): Record<string, unknown> {
  return {
    ...(templateData ?? {}),
    suretSlots: { ...slots },
    renderEngine: 'suret',
  };
}
