/**
 * Public API barrel for the HTML-template engine.
 *
 * Catalog consumers import from here:
 *   import { renderHtmlTemplate, getHtmlTemplateDescriptor } from '@/lib/templates/html-engine';
 */
export type {
  HtmlTemplateData,
  HtmlTemplateDescriptor,
  HtmlTemplateField,
  HtmlTemplateResolution,
  Locale,
} from './types';
export { renderHtmlTemplate, renderHtmlTemplateFragment } from './renderer';
export { escapeHtml, resolveFieldValues, bindDataAttributes } from './binder';
export { loadHtmlTemplate, loadHtmlTemplateAsync, resolveTemplatePath } from './loader';
export { getHtmlTemplateDescriptor, listHtmlTemplateSlugs, registerHtmlTemplate } from './registry';
export { resolveGuestRenderPath } from './selector';
export type { GuestRenderPath } from './selector';
import './catalog';
