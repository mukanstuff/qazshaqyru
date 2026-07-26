/**
 * Shared props for all invitation layout components.
 * Each layout receives the invitation data and template config,
 * then renders all content sections.
 */

'use client';

import type { TemplateConfig } from '@/lib/templates';

export interface InvitationData {
  id: string;
  slug: string;
  title: string;
  eventType: string;
  eventDate: string;
  eventTime?: string | null;
  eventPlace?: string | null;
  eventTimezone: string;
  templateKey: string;
  templateData: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    backgroundImage?: string;
    coverPhoto?: string; // Photo for "About us" section
    couplePhoto1?: string; // First person photo
    couplePhoto2?: string; // Second person photo
    galleryPhoto1?: string;
    galleryPhoto2?: string;
    galleryPhoto3?: string;
    galleryPhoto4?: string;
  };
  musicUrl?: string | null;
  mapUrl?: string | null;
  address?: string | null;
  customText?: Record<string, unknown>;
  language: 'kz' | 'ru';
  hostName?: string | null;
  /** Personalized guest name when opened via personal link */
  guestDisplayName?: string | null;
  /** Assigned banquet table name for personal guest link */
  seatingTableName?: string | null;
  isPast: boolean;
  /** From public API when open RSVP is enabled */
  openRsvp?: boolean;
  /** Show freemium watermark until publication fee paid */
  showWatermark?: boolean;
}

export interface RSVPData {
  guest: {
    id: string;
    name: string;
    hasPlusOne: boolean;
    plusOneName?: string | null;
    seatingTableName?: string | null;
  };
  invitation: {
    title: string;
    slug: string;
    eventDate: string;
    eventTime?: string | null;
    eventPlace?: string | null;
    eventTimezone: string;
    language: 'kz' | 'ru';
    hostName?: string | null;
    isActive: boolean;
  };
  response?: { status: string; message?: string | null; dietaryRestrictions?: string | null } | null;
}

export type ShareChannel = 'whatsapp' | 'telegram' | 'copy';

export interface LayoutProps {
  invitation: InvitationData;
  rsvpData: RSVPData | null;
  templateConfig: TemplateConfig;
  onOpenRSVP: () => void;
  onShare: (type: ShareChannel) => void;
  showShareMenu: boolean;
  onToggleShare: () => void;
  copied: boolean;
  isPlaying: boolean;
  onToggleMusic: () => void;
  hasInteracted: boolean;
  rsvpStatus: string | null;
  showRSVP: boolean;
  /** Show RSVP UI only for guests with a personal link token */
  canRSVP?: boolean;
  /** Personal guest token when present (Kaspi ack, seating). */
  guestToken?: string | null;
  isEditing?: boolean;
  onFieldSave?: (field: string, value: string) => void;
  onProgramChange?: (program: Array<{ time: string; title: string; description?: string }>) => void;
  onPhotoSave?: (photoKey: string, url: string) => void;
  suppressGuestChrome?: boolean;
}

/** Content sections extracted from customText */
export interface InvitationContent {
  greeting?: string;
  aboutCouple?: string;
  program?: Array<{ time: string; title: string; description?: string }>;
  footer?: string;
  dressCode?: string;
  kaspiPhone?: string;
  instagramUrl?: string;
  telegramUrl?: string;
}

export function extractContent(customText: Record<string, unknown> | undefined): InvitationContent {
  return {
    greeting: customText?.greeting as string | undefined,
    aboutCouple: customText?.aboutCouple as string | undefined,
    program: parseProgram(customText?.program),
    footer: customText?.footer as string | undefined,
    dressCode: customText?.dressCode as string | undefined,
    kaspiPhone: customText?.kaspiPhone as string | undefined,
    instagramUrl: customText?.instagramUrl as string | undefined,
    telegramUrl: customText?.telegramUrl as string | undefined,
  };
}

export function parseCustomTextFieldValue(
  key: string,
  value: string,
): unknown {
  if (key === 'program') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (key === 'openRsvp') {
    return value === 'true';
  }
  return value;
}

export function parseProgram(
  value: unknown
): Array<{ time: string; title: string; description?: string }> {
  if (Array.isArray(value)) {
    return value as Array<{ time: string; title: string; description?: string }>;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed as Array<{ time: string; title: string; description?: string }>;
      }
    } catch {
      return [];
    }
  }
  return [];
}

/** Parse event date string to Date object */
export function parseEventDate(dateStr: string): Date {
  return new Date(dateStr);
}

/** Format date as DD.MM.YYYY for display */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/** Format date as YYYY-MM-DD for <input type="date"> */
export function formatDateISO(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}
