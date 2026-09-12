import 'server-only';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { PLACEHOLDER_PREVIEW } from '@/lib/templates/placeholder-preview';

/**
 * A preview path that is safe to hand to `next/image`.
 *
 * A template row can point at a file that was never produced: preview
 * generation runs only for active canvas templates, so every inactive row
 * keeps a `/assets/previews/<slug>.webp` pointer with nothing behind it. In
 * the catalogue that never shows, but the admin lists every template, and the
 * owner saw a column of broken thumbnails in the one screen he manages
 * templates from — and `next/image` answers 400 for a missing local file,
 * which also lands in the console as an error.
 *
 * Only local `/assets/...` paths are checked; uploads and remote URLs are
 * passed through, since they are not on this disk.
 */
export function resolvePreviewSrc(src: string | null | undefined): string {
  const value = src?.trim();
  if (!value) return PLACEHOLDER_PREVIEW;
  if (!value.startsWith('/assets/')) return value;
  return existsSync(path.join(process.cwd(), 'public', value)) ? value : PLACEHOLDER_PREVIEW;
}
