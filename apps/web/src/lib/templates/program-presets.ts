import type { EventType } from '@prisma/client';

export interface ProgramItem {
  time: string;
  title: string;
  description?: string;
}

const WEDDING_RU: ProgramItem[] = [
  { time: '16:00', title: 'Встреча гостей', description: 'Welcome-зона, напитки' },
  { time: '17:00', title: 'Церемония / Никах', description: 'Торжественная часть' },
  { time: '18:30', title: 'Праздничный ужин', description: 'Дастархан' },
  { time: '21:00', title: 'Танцы и программа', description: 'Развлекательная часть' },
];

const WEDDING_KZ: ProgramItem[] = [
  { time: '16:00', title: 'Қонақтарды қарсы алу', description: 'Welcome-аймақ' },
  { time: '17:00', title: 'Салтанат / Неках', description: 'Рәсімдік бөлім' },
  { time: '18:30', title: 'Той дастарханы', description: 'Дастархан' },
  { time: '21:00', title: 'Би кеші', description: 'Көңілді бөлім' },
];

const TOY_RU: ProgramItem[] = [
  { time: '12:00', title: 'Встреча гостей' },
  { time: '13:00', title: 'Торжественная часть' },
  { time: '14:00', title: 'Обед / Дастархан' },
  { time: '16:00', title: 'Развлекательная программа' },
];

const TOY_KZ: ProgramItem[] = [
  { time: '12:00', title: 'Қонақтарды қарсы алу' },
  { time: '13:00', title: 'Салтанатты бөлім' },
  { time: '14:00', title: 'Дастархан' },
  { time: '16:00', title: 'Көңілді бағдарлама' },
];

const BETASHAR_RU: ProgramItem[] = [
  { time: '11:00', title: 'Сбор гостей' },
  { time: '12:00', title: 'Беташар', description: 'Торжественное открытие лица невесты' },
  { time: '13:30', title: 'Поздравления и подарки' },
  { time: '15:00', title: 'Праздничный стол' },
];

const BETASHAR_KZ: ProgramItem[] = [
  { time: '11:00', title: 'Қонақтар жиналуы' },
  { time: '12:00', title: 'Беташар', description: 'Келіннің бетін ашу рәсімі' },
  { time: '13:30', title: 'Құттықтаулар мен сыйлықтар' },
  { time: '15:00', title: 'Дастархан' },
];

const KYZ_RU: ProgramItem[] = [
  { time: '11:00', title: 'Сбор гостей' },
  { time: '12:00', title: 'Проводы невесты', description: 'Қыз ұзату рәсімі' },
  { time: '14:00', title: 'Праздничный обед' },
  { time: '16:00', title: 'Прощание с родителями' },
];

const KYZ_KZ: ProgramItem[] = [
  { time: '11:00', title: 'Қонақтар жиналуы' },
  { time: '12:00', title: 'Қыз ұзату', description: 'Қыз ұзату рәсімі' },
  { time: '14:00', title: 'Дастархан' },
  { time: '16:00', title: 'Ата-анамен қоштасу' },
];

const BIRTHDAY_RU: ProgramItem[] = [
  { time: '18:00', title: 'Встреча гостей' },
  { time: '19:00', title: 'Праздничный ужин' },
  { time: '20:30', title: 'Торт и поздравления' },
];

const BIRTHDAY_KZ: ProgramItem[] = [
  { time: '18:00', title: 'Қонақтарды қарсы алу' },
  { time: '19:00', title: 'Мерекелік кешкі ас' },
  { time: '20:30', title: 'Торт пен құттықтаулар' },
];

const DEFAULT_RU: ProgramItem[] = [
  { time: '17:00', title: 'Начало мероприятия' },
  { time: '18:00', title: 'Основная программа' },
  { time: '20:00', title: 'Завершение' },
];

const DEFAULT_KZ: ProgramItem[] = [
  { time: '17:00', title: 'Іс-шараның басталуы' },
  { time: '18:00', title: 'Негізгі бағдарлама' },
  { time: '20:00', title: 'Аяқталу' },
];

const PRESETS: Record<EventType, { ru: ProgramItem[]; kz: ProgramItem[] }> = {
  wedding: { ru: WEDDING_RU, kz: WEDDING_KZ },
  toy: { ru: TOY_RU, kz: TOY_KZ },
  betashar: { ru: BETASHAR_RU, kz: BETASHAR_KZ },
  kyz_uzatu: { ru: KYZ_RU, kz: KYZ_KZ },
  sundet_toy: { ru: TOY_RU, kz: TOY_KZ },
  tusau_keser: { ru: BIRTHDAY_RU, kz: BIRTHDAY_KZ },
  birthday: { ru: BIRTHDAY_RU, kz: BIRTHDAY_KZ },
  anniversary: { ru: BIRTHDAY_RU, kz: BIRTHDAY_KZ },
  corporate: { ru: DEFAULT_RU, kz: DEFAULT_KZ },
  other: { ru: DEFAULT_RU, kz: DEFAULT_KZ },
};

export function getProgramPreset(eventType: EventType, locale: 'ru' | 'kz' = 'ru'): ProgramItem[] {
  const preset = PRESETS[eventType] ?? PRESETS.other;
  return locale === 'kz' ? preset.kz : preset.ru;
}
