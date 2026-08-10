/**
 * HTML-template engine — types.
 *
 * Phase 1 single render path for guest/public pages. A template is:
 *   1. A static HTML file under `/public/templates-html/<slug>/index.html` with:
 *        - `data-bind="<key>"` placeholders → replaced inline with values.
 *        - `data-i18n-kk="..."` / `data-i18n-ru="..."` → locale-specific text.
 *        - `data-bind-attr-href|src|alt="<key>"` → attribute replacement.
 *        - `data-bind-component="countdown"` → bundled vanilla JS widget hook.
 *   2. Optional `template.json` with field metadata, locale defaults, asset paths.
 *   3. Optional `assets/` folder for hero photos, ornaments.
 *
 * The engine does NOT execute template JS — it ships as static markup only.
 * `data-bind-component="countdown"` is replaced server-side with a tiny inline script
 * that animates values in place.
 */

export type Locale = 'kz' | 'ru';

export interface HtmlTemplateField {
  /** Manifest key (e.g. "groomName"). */
  key: string;
  /** Default value when invitation data is missing. */
  default?: string;
  /** Locale-aware defaults — preferred over `default` when present. */
  defaults?: Partial<Record<Locale, string>>;
  /** When true, missing value triggers a placeholder render, not an error. */
  optional?: boolean;
}

export interface HtmlTemplateDescriptor {
  slug: string;
  /** Absolute path under /public (e.g. `/templates-html/luxe-gold/index.html`). */
  htmlPath: string;
  /** Public asset root (e.g. `/templates-html/luxe-gold/assets`). */
  assetsDir: string;
  /** Accent color for CSS theme variable bridge. */
  accent: string;
  /** Display name in catalog. */
  name: string;
  /** Event types this template supports. */
  eventTypes: Array<'wedding' | 'uzatu' | 'generic'>;
  /** Field declarations for editor binding + defaults. */
  fields: HtmlTemplateField[];
  /**
   * Optional computed fields. Computed values are derived from other resolved fields
   * via a tiny expression of the form `${a} & ${b}`. They are evaluated once,
   * server-side, before bindings are applied.
   */
  computed?: HtmlTemplateComputed[];
  /** Optional default music track. */
  defaultMusicUrl?: string;
}

export interface HtmlTemplateComputed {
  /** Manifest key the computed value binds to. */
  key: string;
  /** Expression body using `${fieldKey}` references. */
  expr: string;
}

/**
 * Resolved template data for render — every field has a concrete value or default.
 * Locale-aware defaults are pre-merged at the resolver layer.
 */
export interface HtmlTemplateData {
  locale: Locale;
  fields: Record<string, string>;
  musicUrl: string | null;
  /** Asset URLs resolved from descriptor.assetsDir + filename. */
  assets: Record<string, string>;
  /** Defaults merged for missing fields — used to populate data-bind cleanly. */
  defaults: Record<string, string>;
}

/**
 * Selector result — `kind: 'html'` triggers HTML-engine render.
 * `kind: 'missing'` returns 404 from the public route.
 */
export type HtmlTemplateResolution =
  | { kind: 'html'; descriptor: HtmlTemplateDescriptor }
  | { kind: 'missing'; slug: string };
