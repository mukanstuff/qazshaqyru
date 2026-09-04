/**
 * Pre-made section blocks — composite groups of canvas elements
 * (hero, date/time, venue, program, etc.) inserted as a unit from the
 * editor's "Секции" dock tab.
 *
 * Unlike a plain element from ElementPalette, a section bundles several
 * elements with sensible relative positions. Its style and language are
 * derived from the document being edited (existing heading/body font and
 * colour, and `doc.locale`) rather than fixed constants, so the inserted
 * block matches whatever template it lands in instead of always coming out
 * in one hardcoded burgundy/gold Russian palette.
 */
import { nanoid } from 'nanoid';
import type {
  CanvasElement,
  FontFamily,
  InvitationCanvasDocument,
} from './types';

// ─── Section definition ─────────────────────────────────────────────────────

export interface SectionContext {
  locale: 'kz' | 'ru';
  headingFont: FontFamily;
  bodyFont: FontFamily;
  primary: string;
  accent: string;
  body: string;
}

export interface SectionDefinition {
  id: string;
  nameRu: string;
  nameKz: string;
  descriptionRu: string;
  descriptionKz: string;
  heightHint: number;
  build(startY: number, ctx: SectionContext): CanvasElement[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return nanoid(10);
}

function pick(ctx: SectionContext, ru: string, kz: string): string {
  return ctx.locale === 'kz' ? kz : ru;
}

const FALLBACK: SectionContext = {
  locale: 'ru',
  headingFont: 'Cormorant',
  bodyFont: 'Montserrat',
  primary: '#2c2117',
  accent: '#c9a961',
  body: '#555555',
};

/**
 * Reads the document's own elements to figure out what "matching the
 * template" means here — its actual heading/body fonts and colours —
 * instead of a hardcoded brand palette that ignored the current theme.
 */
export function deriveSectionContext(doc: InvitationCanvasDocument): SectionContext {
  const els = doc.elements;
  const coupleNames = els.find((e) => e.type === 'couple-names');
  const heading = els.find((e) => e.type === 'heading');
  const text = els.find((e) => e.type === 'text');
  const accentSource = els.find((e) => e.type === 'divider' || e.type === 'ornament');

  const headingFont =
    (coupleNames?.type === 'couple-names' ? coupleNames.font : undefined) ??
    (heading?.type === 'heading' ? heading.fontFamily : undefined) ??
    FALLBACK.headingFont;
  const bodyFont = (text?.type === 'text' ? text.fontFamily : undefined) ?? FALLBACK.bodyFont;
  const primary =
    (coupleNames?.type === 'couple-names' ? coupleNames.color : undefined) ??
    (heading?.type === 'heading' ? heading.color : undefined) ??
    FALLBACK.primary;
  const body = (text?.type === 'text' ? text.color : undefined) ?? FALLBACK.body;
  const accent =
    (accentSource?.type === 'divider' ? accentSource.color : undefined) ?? FALLBACK.accent;

  return {
    locale: doc.locale ?? FALLBACK.locale,
    headingFont,
    bodyFont,
    primary,
    accent,
    body,
  };
}

// ─── Section builders ────────────────────────────────────────────────────────

function buildHeroSection(startY: number, ctx: SectionContext): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'heading', as: 'h1',
    x: 5, y: startY, w: 90, h: 'auto',
    text: pick(ctx, 'Айбек & Айдана', 'Айбек & Айдана'),
    fontFamily: ctx.headingFont, fontSize: 52, fontWeight: 600,
    color: ctx.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'coupleNames',
  };
  const el2: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 90, w: 80, h: 'auto',
    text: pick(ctx, 'Приглашаем вас на нашу свадьбу', 'Сіздерді үйлену тойымызға шақырамыз'),
    fontFamily: ctx.bodyFont, fontSize: 16, fontWeight: 400,
    color: ctx.body, textAlign: 'center', lineHeight: 1.5,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'heroSubtitle',
  };
  const el3: CanvasElement = {
    id: uid(), type: 'divider',
    x: 25, y: startY + 150, w: 50, h: 2,
    color: ctx.accent, thickness: 1, style: 'solid',
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2, el3];
}

function buildDateTimeSection(startY: number, ctx: SectionContext): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: pick(ctx, 'Дата и время', 'Күні мен уақыты'),
    fontFamily: ctx.bodyFont, fontSize: 12, fontWeight: 500,
    color: ctx.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 2, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'heading', as: 'h2',
    x: 5, y: startY + 30, w: 90, h: 'auto',
    text: pick(ctx, '15 августа 2026', '2026 жылдың 15 тамызы'),
    fontFamily: ctx.headingFont, fontSize: 36, fontWeight: 600,
    color: ctx.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'eventDate',
  };
  const el3: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 90, w: 80, h: 'auto',
    text: pick(ctx, 'в 16:00', '16:00-де'),
    fontFamily: ctx.bodyFont, fontSize: 22, fontWeight: 400,
    color: ctx.body, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'eventTime',
  };
  const el4: CanvasElement = {
    id: uid(), type: 'ornament',
    x: 40, y: startY + 140, w: 20, h: 40,
    ornamentId: 'oy-1', flipX: false, flipY: false,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2, el3, el4];
}

function buildVenueSection(startY: number, ctx: SectionContext): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: pick(ctx, 'Место проведения', 'Өткізу орны'),
    fontFamily: ctx.bodyFont, fontSize: 12, fontWeight: 500,
    color: ctx.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 2, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'heading', as: 'h2',
    x: 5, y: startY + 30, w: 90, h: 'auto',
    text: pick(ctx, 'Ресторан Жетысу', 'Жетісу мейрамханасы'),
    fontFamily: ctx.headingFont, fontSize: 32, fontWeight: 600,
    color: ctx.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'venueName',
  };
  const el3: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 85, w: 80, h: 'auto',
    text: pick(ctx, 'г. Алматы, ул. Абая 100', 'Алматы қ., Абай көш. 100'),
    fontFamily: ctx.bodyFont, fontSize: 14, fontWeight: 400,
    color: ctx.body, textAlign: 'center', lineHeight: 1.5,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'venueAddress',
  };
  const el4: CanvasElement = {
    id: uid(), type: 'map',
    x: 5, y: startY + 130, w: 90, h: 180,
    zoom: 14, showStaticOnly: false, accentColor: ctx.accent,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el2, el3, el1, el4];
}

function buildPhotoSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'image',
    x: 5, y: startY, w: 90, h: 320,
    src: '/assets/placeholder.svg',
    objectFit: 'cover', borderRadius: 16,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['imageSrc'],
    placeholderKey: 'coverPhoto',
  };
  const el2: CanvasElement = {
    id: uid(), type: 'ornament',
    x: 42, y: startY + 330, w: 16, h: 30,
    ornamentId: 'oy-2', flipX: false, flipY: false,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2];
}

function buildDressCodeSection(startY: number, ctx: SectionContext): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: 'DRESS CODE',
    fontFamily: ctx.bodyFont, fontSize: 12, fontWeight: 600,
    color: ctx.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 3, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'heading', as: 'h2',
    x: 5, y: startY + 30, w: 90, h: 'auto',
    text: pick(ctx, 'Элегантный', 'Талғампаз'),
    fontFamily: ctx.headingFont, fontSize: 32, fontWeight: 600,
    color: ctx.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'dressCode',
  };
  const el3: CanvasElement = {
    id: uid(), type: 'shape',
    x: 30, y: startY + 90, w: 40, h: 12,
    shape: 'rect', fill: ctx.accent, strokeWidth: 0, opacity: 1,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el4: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 115, w: 80, h: 'auto',
    text: pick(ctx, 'Бежевый, золотой, шампань', 'Бежевый, алтын, шампан түстері'),
    fontFamily: ctx.bodyFont, fontSize: 13, fontWeight: 400,
    color: ctx.body, textAlign: 'center', lineHeight: 1.5,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2, el3, el4];
}

function buildCountdownSection(startY: number, ctx: SectionContext): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: pick(ctx, 'ДО СВАДЬБЫ', 'ТОЙҒА ДЕЙІН'),
    fontFamily: ctx.bodyFont, fontSize: 12, fontWeight: 600,
    color: ctx.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 3, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'countdown',
    x: 5, y: startY + 30, w: 90, h: 'auto',
    fontFamily: ctx.headingFont, fontSize: 28,
    color: ctx.primary, showLabels: true,
    labels: ctx.locale === 'kz'
      ? { days: 'күн', hours: 'сағ', minutes: 'мин', seconds: 'сек' }
      : { days: 'дн', hours: 'ч', minutes: 'мин', seconds: 'сек' },
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2];
}

function buildTextBlockSection(startY: number, ctx: SectionContext): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: pick(
      ctx,
      'Дорогие наши! Мы так счастливы разделить с вами этот особенный день. Ваше присутствие сделает наш праздник по-настоящему незабываемым.',
      'Қымбатты достар! Осы ерекше күнді сіздермен бөлісуге қуаныштымыз. Сіздердің қатысуларыңыз тойымызды есте қаларлықтай етеді.'
    ),
    fontFamily: ctx.bodyFont, fontSize: 15, fontWeight: 400,
    color: ctx.body, textAlign: 'center', lineHeight: 1.7,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'greetingText',
  };
  const el2: CanvasElement = {
    id: uid(), type: 'divider',
    x: 35, y: startY + 90, w: 30, h: 1,
    color: ctx.accent, thickness: 1, style: 'solid',
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2];
}

function buildHashtagSection(startY: number, ctx: SectionContext): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'heading', as: 'h2',
    x: 5, y: startY, w: 90, h: 'auto',
    text: '#АйбекАйдана2026',
    fontFamily: ctx.headingFont, fontSize: 22, fontWeight: 700,
    color: ctx.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'hashtag',
  };
  const el2: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 50, w: 80, h: 'auto',
    text: pick(
      ctx,
      'Делитесь фото и видео с нашего торжества в соцсетях',
      'Тойымыздың фото-бейнелерін әлеуметтік желіде бөлісіңіз'
    ),
    fontFamily: ctx.bodyFont, fontSize: 13, fontWeight: 400,
    color: ctx.body, textAlign: 'center', lineHeight: 1.5,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2];
}

function buildThankYouSection(startY: number, ctx: SectionContext): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'heading', as: 'h2',
    x: 5, y: startY, w: 90, h: 'auto',
    text: pick(ctx, 'Спасибо, что были с нами!', 'Бізбен бірге болғандарыңызға рақмет!'),
    fontFamily: ctx.headingFont, fontSize: 36, fontWeight: 600,
    color: ctx.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 60, w: 80, h: 'auto',
    text: pick(
      ctx,
      'Ваша любовь и поддержка сделали этот день идеальным',
      'Сіздердің сүйіспеншілігіңіз бен қолдауыңыз бұл күнді керемет етті'
    ),
    fontFamily: ctx.bodyFont, fontSize: 15, fontWeight: 400,
    color: ctx.body, textAlign: 'center', lineHeight: 1.6,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el3: CanvasElement = {
    id: uid(), type: 'ornament',
    x: 42, y: startY + 120, w: 16, h: 30,
    ornamentId: 'oy-1', flipX: false, flipY: false,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2, el3];
}

// ─── Registry ────────────────────────────────────────────────────────────────

export const TEMPLATE_SECTIONS: SectionDefinition[] = [
  {
    id: 'hero',
    nameRu: 'Hero — имена пары',
    nameKz: 'Hero — жұп аты',
    descriptionRu: 'Заголовок с именами, подзаголовок и разделитель',
    descriptionKz: 'Есімдер тақырыбы, ішкі мәтін және бөлгіш',
    heightHint: 180,
    build: buildHeroSection,
  },
  {
    id: 'datetime',
    nameRu: 'Дата и время',
    nameKz: 'Күні мен уақыты',
    descriptionRu: 'Дата, время события с декоративным орнаментом',
    descriptionKz: 'Оқиғаның күні, уақыты әріптермен безендірілген',
    heightHint: 200,
    build: buildDateTimeSection,
  },
  {
    id: 'venue',
    nameRu: 'Место проведения',
    nameKz: 'Өткізу орны',
    descriptionRu: 'Название площадки, адрес и интерактивная карта',
    descriptionKz: 'Алаң аты, мекенжай және интерактивті карта',
    heightHint: 340,
    build: buildVenueSection,
  },
  {
    id: 'photo',
    nameRu: 'Фото-блок',
    nameKz: 'Фото блогы',
    descriptionRu: 'Большое фото с закруглёнными углами',
    descriptionKz: 'Дөңгеленген бұрышты үлкен фотосурет',
    heightHint: 370,
    build: buildPhotoSection,
  },
  {
    id: 'dresscode',
    nameRu: 'Dress Code',
    nameKz: 'Dress Code',
    descriptionRu: 'Дресс-код с цветовым индикатором',
    descriptionKz: 'Түс индикаторы бар дресс-код',
    heightHint: 150,
    build: buildDressCodeSection,
  },
  {
    id: 'countdown',
    nameRu: 'Обратный отсчёт',
    nameKz: 'Кері санақ',
    descriptionRu: 'Таймер до события',
    descriptionKz: 'Оқиғаға дейінгі таймер',
    heightHint: 110,
    build: buildCountdownSection,
  },
  {
    id: 'text',
    nameRu: 'Текстовый блок',
    nameKz: 'Мәтіндік блок',
    descriptionRu: 'Произвольный текст с разделителем',
    descriptionKz: 'Бөлгіші бар ерікті мәтін',
    heightHint: 120,
    build: buildTextBlockSection,
  },
  {
    id: 'hashtag',
    nameRu: 'Хэштег',
    nameKz: 'Хэштег',
    descriptionRu: 'Хэштег мероприятия для соцсетей',
    descriptionKz: 'Әлеуметтік желілер үшін іс-шара хэштегі',
    heightHint: 100,
    build: buildHashtagSection,
  },
  {
    id: 'thankyou',
    nameRu: 'Спасибо',
    nameKz: 'Рақмет',
    descriptionRu: 'Финальный блок благодарности',
    descriptionKz: 'Соңғы алғыс блогы',
    heightHint: 170,
    build: buildThankYouSection,
  },
];

// ─── Insert section into document ────────────────────────────────────────────

export function insertSection(
  doc: InvitationCanvasDocument,
  sectionId: string,
  afterY: number = 0
): InvitationCanvasDocument {
  const section = TEMPLATE_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return doc;

  const ctx = deriveSectionContext(doc);

  // Stack sections with 20px gap
  const elements = section.build(afterY + 20, ctx);

  return {
    ...doc,
    elements: [...doc.elements, ...elements],
    editorMetadata: {
      ...(doc.editorMetadata || {}),
      lastModifiedAt: new Date().toISOString(),
    },
  };
}
