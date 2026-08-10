/**
 * Template configs — minimal metadata for legacy TemplateConfig type compatibility.
 *
 * Phase 1: HTML templates are catalogued by HtmlTemplateDescriptor (see html-engine/types.ts).
 * This file remains because some shared types still import TemplateConfig (heading font,
 * default music URL). For HTML templates we resolve config dynamically via descriptor.
 */
import type { TemplateConfig } from './types';

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {};
