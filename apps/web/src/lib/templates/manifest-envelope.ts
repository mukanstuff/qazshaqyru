import type { TemplateManifest } from './manifest-types';

export function manifestHasEnvelopeIntro(manifest: TemplateManifest): boolean {
  return manifest.sections.some((section) => section.type === 'envelope-intro');
}
