import type { LayoutProps } from '../types';
import type { TemplateManifest } from '@/lib/templates/manifest-types';

export interface SectionContext extends LayoutProps {
  manifest: TemplateManifest;
  fields: Record<string, string>;
  assetUrl: (key: string) => string | null;
}

export interface SectionProps {
  ctx: SectionContext;
  sectionProps?: Record<string, unknown>;
  bindings?: Record<string, string>;
}

export function boundField(
  bindings: Record<string, string> | undefined,
  propKey: string,
  fields: Record<string, string>,
): string {
  const fieldKey = bindings?.[propKey] ?? propKey;
  return fields[fieldKey] ?? '';
}
