import { BRAND_ACCENT, BRAND_PRIMARY, CANVAS_VERSION, DEFAULT_MOBILE_WIDTH } from './types';
import type { InvitationCanvasDocument } from './types';

export function buildDefaultInvitationCanvas(opts: {
  locale?: 'ru' | 'kz';
  eventDate?: Date;
} = {}): InvitationCanvasDocument {
  const locale = opts.locale ?? 'ru';
  const isKz = locale === 'kz';
  const eventDate = opts.eventDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const eventDateIso = eventDate.toISOString();

  const dateLabel = eventDate.toLocaleDateString(locale === 'kz' ? 'kk-KZ' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    version: CANVAS_VERSION,
    width: DEFAULT_MOBILE_WIDTH,
    background: {
      type: 'solid',
      color: '#fff8f1',
    },
    elements: [
      {
        id: 'el-hero-title',
        type: 'couple-names',
        x: 5,
        y: 80,
        w: 90,
        h: 'auto',
        rotation: 0,
        zIndex: 1,
        locked: false,
        hidden: false,
        editableByEndUser: true,
        placeholderKey: 'coupleNames',
        first: isKz ? 'Айдана' : 'Айдана',
        second: isKz ? 'Алихан' : 'Алихан',
        connector: 'heart',
        font: 'Cormorant',
        fontSize: 56,
        color: BRAND_PRIMARY,
        connectorColor: BRAND_ACCENT,
      },
      {
        id: 'el-event-date',
        type: 'text',
        x: 10,
        y: 240,
        w: 80,
        h: 'auto',
        rotation: 0,
        zIndex: 2,
        locked: false,
        hidden: false,
        editableByEndUser: true,
        placeholderKey: 'eventDate',
        text: dateLabel,
        fontFamily: 'Montserrat',
        fontSize: 18,
        fontWeight: 500,
        color: '#2c1810',
        textAlign: 'center',
        lineHeight: 1.4,
        letterSpacing: 0,
      },
      {
        id: 'el-event-place',
        type: 'text',
        x: 10,
        y: 300,
        w: 80,
        h: 'auto',
        rotation: 0,
        zIndex: 3,
        locked: false,
        hidden: false,
        editableByEndUser: true,
        placeholderKey: 'venueName',
        text: isKz ? 'Ресторан «Жарық»' : 'Ресторан «Жарык»',
        fontFamily: 'Montserrat',
        fontSize: 16,
        fontWeight: 400,
        color: '#5c3a2e',
        textAlign: 'center',
        lineHeight: 1.4,
        letterSpacing: 0,
      },
      {
        id: 'el-rsvp-button',
        type: 'button',
        x: 20,
        y: 380,
        w: 60,
        h: 56,
        rotation: 0,
        zIndex: 4,
        locked: false,
        hidden: false,
        editableByEndUser: true,
        label: isKz ? 'Жауап беру' : 'Подтвердить',
        action: { kind: 'rsvp' },
        bgColor: BRAND_PRIMARY,
        textColor: '#ffffff',
        fontSize: 16,
        fontFamily: 'Montserrat',
        fontWeight: 600,
        borderRadius: 12,
        paddingX: 24,
        paddingY: 14,
      },
    ],
    editorMetadata: {
      lastModifiedAt: new Date().toISOString(),
    },
  };
}