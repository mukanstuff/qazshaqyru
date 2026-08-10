/**
 * HTML-template editor — shared TypeScript types.
 *
 * These types are the canonical shape of editor state and all panel props.
 * They mirror the fields in HtmlTemplateData + descriptor defaults,
 * with additional UI-only fields (accentMode, animationDuration, etc.).
 */

import type { Locale } from '@/lib/templates/html-engine/types';

// ─── Editor mode ─────────────────────────────────────────────────────────────

export type HtmlEditorMode = 'create' | 'edit';

/** Which invitation is being edited, if any. */
export interface HtmlEditorContext {
  mode: HtmlEditorMode;
  /** Set when mode === 'edit' and user has a saved invitation. */
  invitationId?: string;
  slug?: string;
}

// ─── Field values (mirrors what gets stored in DB) ────────────────────────────

export interface HtmlEditorFields {
  // Identity
  groomName: string;
  brideName: string;
  /** ISO date string, e.g. "2027-05-15" */
  eventDate: string;
  /** HH:mm, e.g. "18:00" */
  eventTime: string;
  eventPlace: string;
  address: string;

  // Content
  greeting: string;
  /** 2GIS, Google Maps, or Yandex Maps URL */
  mapUrl: string;
  /** KZ-formatted phone for WhatsApp RSVP, e.g. "+7 700 000 00 00" */
  whatsappPhone: string;

  // Design
  /** #rrggbb or empty string (means "use template default") */
  backgroundColor: string;
  accentColorMode: 'default' | 'custom';
  /** Set only when accentColorMode === 'custom' */
  accentColor: string;

  // Animation
  animationType: AnimationType;
  animationDuration: number; // seconds, 1.0–6.0
  autoScroll: boolean;
  showEnvelope: boolean;

  // Fonts
  fontMode: 'template' | 'custom';
  /** Applied to all text in the invitation when fontMode === 'custom' */
  fontFamily: string;
  newTextFontMode: 'environment' | 'custom';
  newTextFontFamily: string;

  // Media
  musicUrl: string;
  musicStartSec: number;
  musicEndSec: number;

  // Gallery
  galleryPhotos: string[]; // URLs, max 8

  // Card metadata (OG tags)
  cardTitle: string;
  cardDescription: string;
  cardImageUrl: string;

  // URL slug
  slug: string;

  // UI
  locale: Locale;
}

// ─── Animation ──────────────────────────────────────────────────────────────

export type AnimationType =
  | 'none'
  | 'fade-in'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'bounce-in'
  | 'rotate-in'
  | 'spin'
  | 'pulse'
  | 'shake'
  | 'wobble'
  | 'heartbeat'
  | 'float'
  | 'sway';

export interface AnimationOption {
  value: AnimationType;
  labelKz: string;
  labelRu: string;
  kind: 'enter' | 'loop';
  icon: string; // emoji or SVG string
}

export const ANIMATION_OPTIONS: AnimationOption[] = [
  { value: 'none',        labelKz: 'Жоқ',         labelRu: 'Нет',          kind: 'enter', icon: '🚫' },
  { value: 'fade-in',     labelKz: 'Пайда болу',   labelRu: 'Появление',    kind: 'enter', icon: '🌅' },
  { value: 'slide-left',  labelKz: 'Солдан',       labelRu: 'Слева',       kind: 'enter', icon: '⬅️' },
  { value: 'slide-right', labelKz: 'Оңнан',         labelRu: 'Справа',      kind: 'enter', icon: '➡️' },
  { value: 'slide-up',    labelKz: 'Төменнен',     labelRu: 'Снизу',       kind: 'enter', icon: '⬆️' },
  { value: 'slide-down',  labelKz: 'Жоғарыдан',   labelRu: 'Сверху',      kind: 'enter', icon: '⬇️' },
  { value: 'zoom-in',     labelKz: 'Үлкейту',      labelRu: 'Увеличение',  kind: 'enter', icon: '🔍' },
  { value: 'bounce-in',   labelKz: 'Секіру',       labelRu: 'Подпрыгивание', kind: 'enter', icon: '⚡' },
  { value: 'rotate-in',   labelKz: 'Бұрылу',       labelRu: 'Вращение',    kind: 'enter', icon: '🔄' },
  { value: 'spin',        labelKz: 'Айналу',       labelRu: 'Вращение',     kind: 'loop',  icon: '🌀' },
  { value: 'pulse',       labelKz: 'Пульсация',    labelRu: 'Пульсация',   kind: 'loop',  icon: '💗' },
  { value: 'shake',       labelKz: 'Сілкіну',      labelRu: 'Тряска',       kind: 'loop',  icon: '📳' },
  { value: 'wobble',      labelKz: 'Теңселу',      labelRu: 'Колебание',   kind: 'loop',  icon: '🌊' },
  { value: 'heartbeat',   labelKz: 'Жүрек соғуы',  labelRu: 'Сердцебиение', kind: 'loop', icon: '❤️' },
  { value: 'float',       labelKz: 'Қалқу',         labelRu: 'Парение',     kind: 'loop',  icon: '☁️' },
  { value: 'sway',        labelKz: 'Тербелу',       labelRu: 'Покачивание',  kind: 'loop',  icon: '🌳' },
];

// ─── RSVP fields config ─────────────────────────────────────────────────────

export interface RsvpFields {
  showPhone: boolean;
  showGuestCount: boolean;
  showWishes: boolean;
}

// ─── UI tab ─────────────────────────────────────────────────────────────────

export type EditorTab = 'content' | 'design' | 'media' | 'publish';

// ─── Save status ─────────────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ─── Slug validation result ─────────────────────────────────────────────────

export interface SlugValidationResult {
  ok: boolean;
  error?: string;
}
