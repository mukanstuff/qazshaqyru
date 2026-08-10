/**
 * Pre-made section blocks for the admin template builder.
 * Each section is a group of canvas elements designed for a specific
 * use-case (hero, date/time, venue, program, etc.).
 *
 * Sections are inserted as a unit, positioned relative to each other.
 * y-coordinates are stacked so sections appear in order when inserted.
 */
import { nanoid } from 'nanoid';
import type {
  CanvasElement,
  InvitationCanvasDocument,
} from './types';

// ─── Section definition ─────────────────────────────────────────────────────

export interface SectionDefinition {
  id: string;
  nameRu: string;
  nameKz: string;
  descriptionRu: string;
  descriptionKz: string;
  heightHint: number;
  build(startY: number): CanvasElement[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return nanoid(10);
}

const BRAND = { primary: '#6b1d3a', accent: '#c9a961', dark: '#1b1419', ivory: '#fff8f1' };

// ─── Section builders ────────────────────────────────────────────────────────

function buildHeroSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'heading', as: 'h1',
    x: 5, y: startY, w: 90, h: 'auto',
    text: 'Айбек & Айдана',
    fontFamily: 'Cormorant', fontSize: 52, fontWeight: 600,
    color: BRAND.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'coupleNames',
  };
  const el2: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 90, w: 80, h: 'auto',
    text: 'Приглашаем вас на нашу свадьбу',
    fontFamily: 'Montserrat', fontSize: 16, fontWeight: 400,
    color: '#555', textAlign: 'center', lineHeight: 1.5,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'heroSubtitle',
  };
  const el3: CanvasElement = {
    id: uid(), type: 'divider',
    x: 25, y: startY + 150, w: 50, h: 2,
    color: BRAND.accent, thickness: 1, style: 'solid',
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2, el3];
}

function buildDateTimeSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: 'Дата и время',
    fontFamily: 'Montserrat', fontSize: 12, fontWeight: 500,
    color: BRAND.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 2, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'heading', as: 'h2',
    x: 5, y: startY + 30, w: 90, h: 'auto',
    text: '15 августа 2026',
    fontFamily: 'Cormorant', fontSize: 36, fontWeight: 600,
    color: BRAND.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'eventDate',
  };
  const el3: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 90, w: 80, h: 'auto',
    text: 'в 16:00',
    fontFamily: 'Montserrat', fontSize: 22, fontWeight: 400,
    color: '#333', textAlign: 'center', lineHeight: 1.4,
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

function buildVenueSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: 'Место проведения',
    fontFamily: 'Montserrat', fontSize: 12, fontWeight: 500,
    color: BRAND.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 2, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'heading', as: 'h2',
    x: 5, y: startY + 30, w: 90, h: 'auto',
    text: 'Ресторан Жетысу',
    fontFamily: 'Cormorant', fontSize: 32, fontWeight: 600,
    color: BRAND.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'venueName',
  };
  const el3: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 85, w: 80, h: 'auto',
    text: 'г. Алматы, ул. Абая 100',
    fontFamily: 'Montserrat', fontSize: 14, fontWeight: 400,
    color: '#555', textAlign: 'center', lineHeight: 1.5,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'venueAddress',
  };
  const el4: CanvasElement = {
    id: uid(), type: 'map',
    x: 5, y: startY + 130, w: 90, h: 180,
    zoom: 14, showStaticOnly: false,
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

function buildProgramSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: 'ПРОГРАММА ДНЯ',
    fontFamily: 'Montserrat', fontSize: 12, fontWeight: 600,
    color: BRAND.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 3, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: nanoid(10), type: 'program',
    x: 5, y: startY + 35, w: 90, h: 'auto',
    items: [
      { id: nanoid(6), time: '16:00', title: 'Сбор гостей' },
      { id: nanoid(6), time: '17:00', title: 'Церемония' },
      { id: nanoid(6), time: '18:30', title: 'Банкет' },
      { id: nanoid(6), time: '22:00', title: 'Торт и танцы' },
    ],
    fontFamily: 'Montserrat', bgColor: 'transparent',
    textColor: '#333', accentColor: BRAND.accent,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2];
}

function buildWishesSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: 'ПОЖЕЛАНИЯ',
    fontFamily: 'Montserrat', fontSize: 12, fontWeight: 600,
    color: BRAND.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 3, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'wishes',
    x: 5, y: startY + 35, w: 90, h: 'auto',
    fontFamily: 'Montserrat', bgColor: 'transparent',
    textColor: '#333', accentColor: BRAND.primary,
    reactions: ['❤️', '🙏', '🥂', '👏'], allowAnonymous: true,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2];
}

function buildRsvpSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: 'ПОДТВЕРЖДЕНИЕ ПРИСУТСТВИЯ',
    fontFamily: 'Montserrat', fontSize: 12, fontWeight: 600,
    color: BRAND.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 3, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'heading', as: 'h2',
    x: 5, y: startY + 30, w: 90, h: 'auto',
    text: 'С的非会',
    fontFamily: 'Cormorant', fontSize: 32, fontWeight: 600,
    color: BRAND.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
  };
  const el3: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 85, w: 80, h: 'auto',
    text: 'Пожалуйста, сообщите нам о своём решении до 1 августа',
    fontFamily: 'Montserrat', fontSize: 14, fontWeight: 400,
    color: '#666', textAlign: 'center', lineHeight: 1.5,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el4: CanvasElement = {
    id: uid(), type: 'rsvp-form',
    x: 5, y: startY + 130, w: 90, h: 'auto',
    fontFamily: 'Montserrat', bgColor: 'transparent',
    textColor: '#333', accentColor: BRAND.primary,
    askPlusOne: true, askDietary: true, askChildren: true,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2, el3, el4];
}

function buildDressCodeSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: 'DRESS CODE',
    fontFamily: 'Montserrat', fontSize: 12, fontWeight: 600,
    color: BRAND.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 3, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'heading', as: 'h2',
    x: 5, y: startY + 30, w: 90, h: 'auto',
    text: 'Элегантный',
    fontFamily: 'Cormorant', fontSize: 32, fontWeight: 600,
    color: BRAND.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'dressCode',
  };
  const el3: CanvasElement = {
    id: uid(), type: 'shape',
    x: 30, y: startY + 90, w: 40, h: 12,
    shape: 'rect', fill: '#d4af37', strokeWidth: 0, opacity: 1,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el4: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 115, w: 80, h: 'auto',
    text: 'Бежевый, золотой, шампань',
    fontFamily: 'Montserrat', fontSize: 13, fontWeight: 400,
    color: '#888', textAlign: 'center', lineHeight: 1.5,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2, el3, el4];
}

function buildGiftSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: 'ПОДАРОК',
    fontFamily: 'Montserrat', fontSize: 12, fontWeight: 600,
    color: BRAND.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 3, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'gift',
    x: 5, y: startY + 35, w: 90, h: 'auto',
    showDonors: true, accentColor: BRAND.accent,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2];
}

function buildCountdownSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: 'ДО СВАДЬБЫ',
    fontFamily: 'Montserrat', fontSize: 12, fontWeight: 600,
    color: BRAND.accent, textAlign: 'center', lineHeight: 1.4,
    letterSpacing: 3, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'countdown',
    x: 5, y: startY + 30, w: 90, h: 'auto',
    fontFamily: 'Unbounded', fontSize: 28,
    color: BRAND.primary, showLabels: true,
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2];
}

function buildTextBlockSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY, w: 80, h: 'auto',
    text: 'Дорогие наши! Мы так счастливы разделить с вами этот особенный день. Ваше присутствие сделает наш праздник по-настоящему незабываемым.',
    fontFamily: 'Montserrat', fontSize: 15, fontWeight: 400,
    color: '#444', textAlign: 'center', lineHeight: 1.7,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'greetingText',
  };
  const el2: CanvasElement = {
    id: uid(), type: 'divider',
    x: 35, y: startY + 90, w: 30, h: 1,
    color: BRAND.accent, thickness: 1, style: 'solid',
    rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2];
}

function buildHashtagSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'heading', as: 'h2',
    x: 5, y: startY, w: 90, h: 'auto',
    text: '#АйбекАйдана2026',
    fontFamily: 'Unbounded', fontSize: 22, fontWeight: 700,
    color: BRAND.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
    editableByEndUser: true, editableProperties: ['text'],
    placeholderKey: 'hashtag',
  };
  const el2: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 50, w: 80, h: 'auto',
    text: 'Делитесь фото и видео с нашего торжества в соцсетях',
    fontFamily: 'Montserrat', fontSize: 13, fontWeight: 400,
    color: '#888', textAlign: 'center', lineHeight: 1.5,
    letterSpacing: 0, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  return [el1, el2];
}

function buildThankYouSection(startY: number): CanvasElement[] {
  const el1: CanvasElement = {
    id: uid(), type: 'heading', as: 'h2',
    x: 5, y: startY, w: 90, h: 'auto',
    text: 'Спасибо, что были с нами!',
    fontFamily: 'Cormorant', fontSize: 36, fontWeight: 600,
    color: BRAND.primary, textAlign: 'center', lineHeight: 1.2,
    letterSpacing: 0.5, rotation: 0, zIndex: 1, locked: false, hidden: false,
  };
  const el2: CanvasElement = {
    id: uid(), type: 'text',
    x: 10, y: startY + 60, w: 80, h: 'auto',
    text: 'Ваша любовь и поддержка сделали этот день идеальным',
    fontFamily: 'Montserrat', fontSize: 15, fontWeight: 400,
    color: '#555', textAlign: 'center', lineHeight: 1.6,
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
    id: 'program',
    nameRu: 'Программа дня',
    nameKz: 'Күн бағдарламасы',
    descriptionRu: 'Расписание с временим и описанием',
    descriptionKz: 'Уақыт пен сипаттамасы бар бағдарлама',
    heightHint: 220,
    build: buildProgramSection,
  },
  {
    id: 'wishes',
    nameRu: 'Пожелания гостей',
    nameKz: 'Қонақтар тілектері',
    descriptionRu: 'Блок для поздравлений с реакциями',
    descriptionKz: 'Реакциялары бар құттықтау блогы',
    heightHint: 300,
    build: buildWishesSection,
  },
  {
    id: 'rsvp',
    nameRu: 'Подтверждение RSVP',
    nameKz: 'RSVP растау',
    descriptionRu: 'Форма подтверждения присутствия',
    descriptionKz: 'қатысу растау формасы',
    heightHint: 380,
    build: buildRsvpSection,
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
    id: 'gift',
    nameRu: 'Подарки',
    nameKz: 'Сыйлықтар',
    descriptionRu: 'Блок «Подарки» с Kaspi',
    descriptionKz: 'Kaspi болатын «Сыйлықтар» блогы',
    heightHint: 150,
    build: buildGiftSection,
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

  // Stack sections with 20px gap
  const elements = section.build(afterY + 20);

  return {
    ...doc,
    elements: [...doc.elements, ...elements],
    editorMetadata: {
      ...(doc.editorMetadata || {}),
      lastModifiedAt: new Date().toISOString(),
    },
  };
}
