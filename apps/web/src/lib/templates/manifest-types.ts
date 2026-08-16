/**
 * Manifest types — Phase 2 dev convenience only.
 *
 * `TemplateManifest` is preserved for editor infrastructure (manifest-shaped document) that
 * survives migration of legacy sections-based code. It is NOT used to render guest pages.
 */

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

export type EventTypeProfile = 'wedding' | 'uzatu' | 'generic';

export type TemplateRenderEngine = 'react-sections';

export interface EventFieldProfile {
  eventType: EventTypeProfile;
  nameFields: string[];
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
  profiles?: EventTypeProfile[];
}

export interface TemplateSection {
  id: string;
  type: SectionType;
  props?: Record<string, unknown>;
  fieldBindings?: Record<string, string>;
  defaultVisible?: boolean;
  canHide?: boolean;
  canReorder?: boolean;
}

export interface TemplateManifest {
  slug: string;
  renderEngine: TemplateRenderEngine;
  sections: TemplateSection[];
  fields: TemplateFieldDef[];
  assets: Record<string, string>;
  eventTypeProfile?: EventTypeProfile;
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
