/**
 * HTML-template loader — reads raw template HTML from the public folder.
 *
 * Path safety:
 *   - All template HTML lives under `<repo>/public/templates-html/<slug>/`.
 *   - `resolveTemplatePath` rejects paths outside the public tree.
 *   - We never execute template JS — only read raw text.
 */

import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

export type LoadResult =
  | { ok: true; html: string }
  | { ok: false; error: string };

export interface LoadOptions {
  /**
   * Absolute path to the project root. The loader reads from `<root>/public/...`.
   * Defaults to `process.cwd()`. Tests pass a tmp directory.
   */
  root?: string;
}

function publicRoot(root: string): string {
  return path.resolve(root, 'public');
}

/**
 * Resolve a public URL path like `/templates-html/luxe-gold/index.html`
 * to an absolute filesystem path under the configured root.
 */
export function resolveTemplatePath(
  publicPath: string,
  options: LoadOptions = {},
): string {
  const root = options.root ?? process.cwd();
  const relative = publicPath.replace(/^\/+/, '');
  return path.resolve(publicRoot(root), relative);
}

/**
 * Load template HTML from disk. Returns a discriminated result — never throws.
 * Caller is responsible for translating the error to a 404 if needed.
 */
export function loadHtmlTemplate(
  filePath: string,
  options: LoadOptions = {},
): LoadResult {
  const root = options.root ?? process.cwd();
  const resolved = path.resolve(filePath);
  const pubRoot = publicRoot(root);
  // Defense in depth: refuse paths outside the public tree.
  if (!resolved.startsWith(pubRoot)) {
    return { ok: false, error: 'Path outside templates root' };
  }
  try {
    if (!fsSync.existsSync(resolved)) {
      return { ok: false, error: 'Template not found' };
    }
    const html = fsSync.readFileSync(resolved, 'utf8');
    return { ok: true, html };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Read failed';
    if (message.includes('ENOENT')) {
      return { ok: false, error: 'Template not found' };
    }
    return { ok: false, error: message };
  }
}

/**
 * Async variant for promise-flow callers.
 */
export async function loadHtmlTemplateAsync(
  filePath: string,
  options: LoadOptions = {},
): Promise<LoadResult> {
  const root = options.root ?? process.cwd();
  const resolved = path.resolve(filePath);
  const pubRoot = publicRoot(root);
  if (!resolved.startsWith(pubRoot)) {
    return { ok: false, error: 'Path outside templates root' };
  }
  try {
    const html = await fs.readFile(resolved, 'utf8');
    return { ok: true, html };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Read failed';
    if (message.includes('ENOENT')) {
      return { ok: false, error: 'Template not found' };
    }
    return { ok: false, error: message };
  }
}
