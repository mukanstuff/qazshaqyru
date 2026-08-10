/**
 * HTML-template binder — replaces `data-bind` placeholders with values from data.
 *
 * SSR-safe: pure string transform, no DOM, no React.
 * XSS-safe: every interpolated value passes through escapeHtml().
 *
 * Supported bindings:
 *   - `data-bind="<key>"` — textContent of the element (placeholder inner text replaced).
 *   - `data-bind-attr-href="<key>"` / `data-bind-attr-src="<key>"` / `data-bind-attr-alt="<key>"`
 *   - `data-bind-component="<name>"` — known component slot, gets server-rendered stub.
 *   - `data-i18n-kk="..."` / `data-i18n-ru="..."` — locale-specific textContent.
 *
 * Approach: all replacements operate at the attribute level, avoiding complex nested-tag
 * regex that breaks on self-closing tags, comments, or CDATA sections.
 */

import type { HtmlTemplateData, HtmlTemplateDescriptor } from './types';

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch] ?? ch);
}

/**
 * Resolve final field values: user-provided wins; otherwise descriptor default.
 * Optional fields with empty user value stay empty (intentional placeholder).
 * Computed fields are evaluated last from previously-resolved fields.
 */
export function resolveFieldValues(
  data: HtmlTemplateData,
  descriptor: HtmlTemplateDescriptor,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of descriptor.fields) {
    const userValue = data.fields[field.key] ?? '';
    if (userValue !== '') {
      result[field.key] = userValue;
      continue;
    }
    if (field.optional && userValue === '') {
      result[field.key] = '';
      continue;
    }
    const localeDefault = field.defaults?.[data.locale];
    result[field.key] = localeDefault ?? field.default ?? '';
  }
  for (const computed of descriptor.computed ?? []) {
    result[computed.key] = interpolate(computed.expr, result);
  }
  return result;
}

function interpolate(expr: string, scope: Record<string, string>): string {
  return expr.replace(/\$\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_full, key: string) => {
    return scope[key] ?? '';
  });
}

/**
 * Replace data-i18n-kk / data-i18n-ru attribute pairs with locale-specific text.
 *
 * Replaces the FULL element (open tag + inner content + close tag) to avoid
 * orphaning the original closing tag.
 *
 * Handles self-closing tags (<br/>) via the optional selfClose path.
 */
function replaceDataI18n(html: string, locale: 'kz' | 'ru'): string {
  return html.replace(
    /<([a-zA-Z][a-zA-Z0-9]*)\s+((?:[^>]*?\s+)?)data-i18n-kk="([^"]*)"\s+data-i18n-ru="([^"]*)"((?:\s+[^>]*)?)(\/?)>([\s\S]*?)<\/\1>/g,
    (_full: string, tag: string, before: string, kkVal: string, ruVal: string, after: string, selfClose: string, _inner: string) => {
      const text = locale === 'kz' ? kkVal : ruVal;
      const escaped = escapeHtml(text ?? '');
      const cleanBefore = (before ?? '').trimEnd();
      const cleanAfter = (after ?? '').trimStart();
      const attrs = [cleanBefore, cleanAfter].filter(Boolean).join(' ');
      if (selfClose === '/') {
        // Self-closing: strip data-i18n, return void element
        return attrs ? `<${tag} ${attrs}/>` : `<${tag}/>`;
      }
      // Regular element: reconstruct clean open tag + text + close tag
      const openTag = attrs ? `<${tag} ${attrs}>` : `<${tag}>`;
      return `${openTag}${escaped}</${tag}>`;
    },
  );
}

/**
 * Replace data-bind="<key>" attributes — placeholder inner text replacement.
 * Matches the FULL element (open tag → inner content → close tag) and
 * reconstructs it with data-bind removed and inner content = resolved value.
 *
 * Handles self-closing tags (<br/>) via the optional close-path.
 */
function replaceDataBind(html: string, resolved: Record<string, string>): string {
  // G1=tag, G2=all attrs, G3=data-bind key, G4=inner, G5=close (/> or >)
  return html.replace(
    /<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*?)data-bind="([^"]*)"([^>]*)(\/?)>[\s\S]*?<\/\1>/g,
    (_full, tag: string, attrsBefore: string, key: string, attrsAfter: string, selfClose: string) => {
      const value = resolved[key] ?? '';
      const escaped = escapeHtml(value);
      const cleanAttrs = `${attrsBefore}${attrsAfter}`.replace(
        /data-bind="[^"]*"/g, '').trim();
      if (selfClose === '/') return `<${tag}${cleanAttrs ? ' ' + cleanAttrs : ''}/>`;
      return `<${tag}${cleanAttrs ? ' ' + cleanAttrs : ''}>${escaped}</${tag}>`;
    },
  );
}

/**
 * Replace data-bind-attr-href/src/alt="<key>" with the actual attribute.
 * Preserves all other attributes and inner content.
 */
function replaceDataBindAttr(html: string, resolved: Record<string, string>): string {
  // G1=tag, G2=attrs before, G3=attr name, G4=value key, G5=attrs after, G6=self-close, G7=inner, G8=close tag
  return html.replace(
    /<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*?)data-bind-attr-(href|src|alt)="([^"]*)"([^>]*)(\/?)>[\s\S]*?<\/\1>/g,
    (_full, tag: string, attrsBefore: string, attrName: string, key: string, attrsAfter: string, selfClose: string) => {
      const value = resolved[key] ?? '';
      const escaped = escapeHtml(value);
      const cleanAttrs = `${attrsBefore}${attrsAfter}`.replace(
        new RegExp(`data-bind-attr-${attrName}="[^"]*"`, 'g'), '').trim();
      const finalAttrs = `${cleanAttrs} ${attrName}="${escaped}"`.trim();
      if (selfClose === '/') return `<${tag} ${finalAttrs}/>`;
      // Preserve inner content (e.g. link text)
      return `<${tag} ${finalAttrs}>`;
    },
  );
}

/**
 * Replace data-bind-component="<name>" with a server-rendered stub.
 * Matches full element; countdown component replaces inner with resolved date.
 */
function replaceDataBindComponent(
  html: string,
  resolved: Record<string, string>,
): string {
  return html.replace(
    /<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*?)data-bind-component="([^"]*)"([^>]*)(\/?)>[\s\S]*?<\/\1>/g,
    (_full, tag: string, attrsBefore: string, compName: string, attrsAfter: string, selfClose: string) => {
      const attrs = `${attrsBefore}${attrsAfter}`.replace(
        /data-bind-component="[^"]*"/g, '').trim();
      if (compName === 'countdown') {
        const date = resolved.eventDate ?? '';
        const escaped = escapeHtml(date);
        const time = resolved.eventTime ?? '17:00';
        const timeEscaped = escapeHtml(time);
        const finalAttrs = `${attrs} data-component="countdown" data-event-date="${escaped}" data-event-time="${timeEscaped}"`.trim();
        if (selfClose === '/') return `<${tag} ${finalAttrs}/>`;
        return `<${tag} ${finalAttrs}>${escaped}</${tag}>`;
      }
      const finalAttrs = `${attrs} data-component="${escapeHtml(compName)}"`.trim();
      if (selfClose === '/') return `<${tag} ${finalAttrs}/>`;
      return `<${tag} ${finalAttrs}>`;
    },
  );
}

export function bindDataAttributes(
  html: string,
  data: HtmlTemplateData,
  descriptor?: HtmlTemplateDescriptor,
): string {
  const resolved = descriptor
    ? resolveFieldValues(data, descriptor)
    : { ...data.defaults, ...data.fields };

  let result = html;
  // Order matters: i18n first (creates text nodes and removes attrs),
  // then bind-component/attr (replace stubs), then bind (replace placeholders).
  result = replaceDataI18n(result, data.locale);
  result = replaceDataBindComponent(result, resolved);
  result = replaceDataBindAttr(result, resolved);
  result = replaceDataBind(result, resolved);
  return result;
}
