/**
 * HTML-template engine — render layer.
 *
 * Public API:
 *   - renderHtmlTemplate(descriptor, data, options) — returns full HTML document.
 *   - renderHtmlTemplateFragment(descriptor, data, options) — returns body fragment only.
 *
 * Output contract:
 *   - Single string (Next.js can stream or render to Response).
 *   - All interpolated values are HTML-escaped (see binder.ts).
 *   - The template ships its own CSS/JS — we don't inject framework CSS.
 *   - Locale defaults are resolved at the descriptor layer (data.locale).
 */

import { bindDataAttributes, resolveFieldValues } from './binder';
import { loadHtmlTemplate, resolveTemplatePath } from './loader';
import type {
  HtmlTemplateData,
  HtmlTemplateDescriptor,
  Locale,
} from './types';

export interface RenderOptions {
  /** Override language metadata (e.g. for SEO hreflang). */
  htmlLang?: string;
  /** Inject custom <meta> tags in <head>. */
  meta?: string;
  /** Override <title>. */
  title?: string;
  /** Project root for resolving template paths. Defaults to process.cwd(). */
  root?: string;
}

/**
 * Resolve the final descriptor-data binding target.
 * Returns the raw template HTML with bindings substituted.
 */
export function renderHtmlTemplateFragment(
  descriptor: HtmlTemplateDescriptor,
  data: HtmlTemplateData,
  options: RenderOptions = {},
): { ok: true; html: string } | { ok: false; error: string } {
  const filePath = resolveTemplatePath(descriptor.htmlPath, {
    root: options.root,
  });
  const loaded = loadHtmlTemplate(filePath, { root: options.root });
  if (!loaded.ok) {
    return { ok: false, error: loaded.error };
  }
  const resolved = resolveFieldValues(data, descriptor);
  const html = bindDataAttributes(loaded.html, data, descriptor);
  return { ok: true, html, resolved };
}

/**
 * Resolve bindings + minimal HTML wrapper.
 * The template's <head> and <body> are preserved; we only inject data + meta.
 */
export function renderHtmlTemplate(
  descriptor: HtmlTemplateDescriptor,
  data: HtmlTemplateData,
  options: RenderOptions = {},
): { ok: true; html: string } | { ok: false; error: string } {
  const filePath = resolveTemplatePath(descriptor.htmlPath, {
    root: options.root,
  });
  const loaded = loadHtmlTemplate(filePath, { root: options.root });
  if (!loaded.ok) {
    return { ok: false, error: loaded.error };
  }
  const resolved = resolveFieldValues(data, descriptor);
  const bound = bindDataAttributes(loaded.html, data, descriptor);

  const lang = (options.htmlLang ?? data.locale) as Locale;
  const title = options.title ?? `${resolved.groomName ?? ''} & ${resolved.brideName ?? ''}`;
  const accent = descriptor.accent;
  const inlineMeta = options.meta ?? '';

  // Inject:
  //   - <title>: SEO-friendly per invitation.
  //   - <meta name="theme-color">: matches accent.
  //   - data-invitation-* hooks for editor live preview.
  // We do NOT inject Next.js framework runtime — guest pages stay framework-free.
  const metaInject = `<title>${escapeHtmlString(title)}</title>
<meta name="theme-color" content="${escapeHtmlString(accent)}" />
<meta property="og:title" content="${escapeHtmlString(title)}" />
<meta property="og:locale" content="${lang === 'kz' ? 'kk_KZ' : 'ru_RU'}" />
<meta name="template" content="${escapeHtmlString(descriptor.slug)}" />
${inlineMeta}`;

  const headInjected = bound.replace(
    /<head>([\s\S]*?)<\/head>/i,
    (_full, inner: string) => `<head>${metaInject}${inner}</head>`,
  );

  return { ok: true, html: headInjected };
}

function escapeHtmlString(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[ch] ?? ch;
  });
}
