export type SectionType =
  | 'envelope-intro'
  | 'hero-names'
  | 'body-invitation'
  | 'cover-photo'
  | 'calendar'
  | 'countdown'
  | 'venue-map'
  | 'rsvp'
  | 'wishes'
  | 'music'
  | 'dress-code'
  | 'gallery'
  | 'final-text'
  | 'kaspi'
  | 'program';

export type TemplateFieldType = 'text' | 'date' | 'time' | 'textarea' | 'image' | 'url';

/** Event-type field profiles — which keys appear in quick-edit per celebration type. */
export type EventTypeProfile = 'wedding' | 'uzatu' | 'generic';

/** Prod render engines. HTML iframe remains deferred. */
export type TemplateRenderEngine = 'react-sections';

export interface EventFieldProfile {
  eventType: EventTypeProfile;
  /** Primary name field keys shown in hero (1–4 slots). */
  nameFields: string[];
  /** Optional extra fields beyond manifest.fields defaults. */
  extraFieldKeys?: string[];
}

export interface TemplateFieldDef {
  key: string;
  type: TemplateFieldType;
  required: boolean;
  labelRu: string;
  labelKz: string;
  defaultKz?: string;
  defaultRu?: string;
  /** Restrict field to specific event profiles; omit = all profiles. */
  profiles?: EventTypeProfile[];
}

export interface TemplateSection {
  /** Stable section id across instantiate / document / editor. */
  id: string;
  type: SectionType;
  props?: Record<string, unknown>;
  fieldBindings?: Record<string, string>;
  /** Default true when omitted. */
  defaultVisible?: boolean;
  /** Default true when omitted. */
  canHide?: boolean;
  /** Default false when omitted. */
  canReorder?: boolean;
}

export interface TemplateManifest {
  slug: string;
  /** `'react-sections'` */
  renderEngine: TemplateRenderEngine;
  sections: TemplateSection[];
  fields: TemplateFieldDef[];
  assets: Record<string, string>;
  /** Event-type profile for quick-edit field visibility. */
  eventTypeProfile?: EventTypeProfile;
  /** Optional video hero: webm path relative to template assets + poster key. */
  heroVideo?: { webm: string; poster: string };
  theme: {
    accent: string;
    textLight: string;
    textDark: string;
    fonts: {
      display: string;
      body: string;
      label?: string;
      ceremonial?: string;
    };
  };
}

/** Deferred — not a create or guest path. */
export interface HtmlTemplateManifest {
  slug: string;
  tier: 'HTML';
  htmlPath: string;
  assetsDir: string;
}
