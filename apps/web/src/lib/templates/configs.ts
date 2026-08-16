/**
 * Template configs — minimal metadata for legacy TemplateConfig type compatibility.
 *
 * This file remains because some shared types still import TemplateConfig (heading font,
 * default music URL). Canvas templates resolve config via the Template table row.
 */
import type { TemplateConfig } from './types';

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {};
