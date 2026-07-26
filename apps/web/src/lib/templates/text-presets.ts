import type { EventType } from '@prisma/client';

export interface TextPreset {
  /** Short label for editor UI */
  labelRu: string;
  labelKz: string;
  /** Opening greeting / invitation body */
  greetingRu: string;
  greetingKz: string;
  /** Optional closing line */
  closingRu?: string;
  closingKz?: string;
}

const WEDDING: TextPreset[] = [
  {
    labelRu: 'Классическое приглашение',
    labelKz: 'Классикалық шақыру',
    greetingRu:
      'Дорогие родные и близкие! С радостью приглашаем вас разделить с нами самый счастливый день нашей жизни.',
    greetingKz:
      'Құрметті ағайын-туыс, жақын достар! Өміріміздің ең бақытты күнін бізбен бірге тойлауға шақырамыз.',
    closingRu: 'Будем рады видеть вас на нашем торжестве!',
    closingKz: 'Салтанатымызда сіздерді көруге қуаныштымыз!',
  },
  {
    labelRu: 'Торжественное',
    labelKz: 'Салтанатты шақыру',
    greetingRu:
      'Приглашаем вас на торжественную церемонию бракосочетания. Ваше присутствие сделает этот день особенным.',
    greetingKz:
      'Сіздерді неке қию салтанатына шақырамыз. Сіздердің қатысуыңыз бұл күнді ерекше етеді.',
  },
  {
    labelRu: 'Ақ дастархан',
    labelKz: 'Ақ дастархан',
    greetingRu:
      'Уважаемые ағайын-туыс! Приглашаем вас за ақ дастархан — пусть наш дом наполнится радостью и благословением.',
    greetingKz:
      'Құрметті ағайын-туыс! Ақ дастарханымызға шақырамыз. Қуаныш пен батаңызбен толы болсын!',
    closingRu: 'Ждём вас с открытым сердцем!',
    closingKz: 'Жүрегімізді ашып күтеміз!',
  },
  {
    labelRu: 'Құрметті ағайын-туыс',
    labelKz: 'Құрметті ағайын-туыс',
    greetingRu:
      'Дорогие родные! С радостью приглашаем вас на наш торжественный той. Ваше присутствие — лучший подарок для нас.',
    greetingKz:
      'Құрметті ағайын-туыс! Салтанатты тойымызға шақырамыз. Сіздердің қатысуыңыз — бізге ең қымбат сыйлық.',
    closingKz: 'Дастарханымызға қош келіңіздер!',
  },
];

const TOY: TextPreset[] = [
  {
    labelRu: 'Традиционный той',
    labelKz: 'Дәстүрлі той',
    greetingRu:
      'Уважаемые гости! Приглашаем вас на той по случаю важного события в нашей семье. Ждём вас за дастарханом!',
    greetingKz:
      'Құрметті қонақтар! Отбасымыздағы маңызды оқиғаға орай өткізілетін тойға шақырамыз. Дастарханымызда сіздерді күтеміз!',
    closingRu: 'Добро пожаловать!',
    closingKz: 'Қош келдіңіздер!',
  },
  {
    labelRu: 'Семейный праздник',
    labelKz: 'Отбасылық мереке',
    greetingRu:
      'Дорогие друзья и родные! Собираемся отметить радостное событие в кругу семьи и близких.',
    greetingKz:
      'Құрметті достар мен ағайын! Отбасы мен жақындардың ортасында қуанышты оқиғаны атап өтеміз.',
  },
  {
    labelRu: 'Ақ дастархан',
    labelKz: 'Ақ дастархан',
    greetingRu:
      'Уважаемые гости! Приглашаем вас за ақ дастархан — пусть наш дом наполнится радостью.',
    greetingKz:
      'Құрметті қонақтар! Ақ дастарханымызға шақырамыз. Отбасымыздағы қуанышты бізбен бөлісіңіздер!',
    closingRu: 'Добро пожаловать!',
    closingKz: 'Қош келдіңіздер!',
  },
];

const BETASHAR: TextPreset[] = [
  {
    labelRu: 'Беташар',
    labelKz: 'Беташар',
    greetingRu:
      'Дорогие гости! Приглашаем вас на торжественный беташар. Разделите с нами радость этого особенного дня.',
    greetingKz:
      'Құрметті қонақтар! Салтанатты беташарға шақырамыз. Осы ерекше күннің қуанышын бізбен бөлісіңіздер.',
    closingRu: 'Ждём вас с нетерпением!',
    closingKz: 'Сіздерді асыға күтеміз!',
  },
  {
    labelRu: 'Келін беташары',
    labelKz: 'Келін беташары',
    greetingRu: 'Приглашаем на беташар нашей келін. Пусть новая семья будет счастливой!',
    greetingKz:
      'Құрметті ағайын! Келініміздің беташарына шақырамыз. Жаңа отбасы бақытты болсын!',
    closingKz: 'Дастарханымызға қош келіңіздер!',
  },
];

const KYZ_UZATU: TextPreset[] = [
  {
    labelRu: 'Қыз ұзату',
    labelKz: 'Қыз ұзату',
    greetingRu:
      'Құрметті ағайын-туыс, достар! Қызымызды ұзату салтанатына шақырамыз. Сіздердің қатысуыңыз біз үшін маңызды.',
    greetingKz:
      'Құрметті ағайын-туыс, достар! Қызымызды ұзату салтанатына шақырамыз. Сіздердің қатысуыңыз біз үшін маңызды.',
    closingRu: 'Дастарханымызда күтеміз!',
    closingKz: 'Дастарханымызда күтеміз!',
  },
  {
    labelRu: 'Прощание с дочерью',
    labelKz: 'Қызбен қоштасу',
    greetingRu:
      'Дорогие родные! Приглашаем вас на церемонию проводов нашей дочери. Поделитесь с нами этим трогательным моментом.',
    greetingKz:
      'Құрметті ағайын! Қызымызды ұзату рәсіміне шақырамыз. Осы сәтті бізбен бірге өткізіңіздер.',
  },
  {
    labelRu: 'Дәстүрлі ұзату',
    labelKz: 'Дәстүрлі ұзату',
    greetingRu: 'Уважаемые ағайын! Приглашаем на қыз ұзату — традиционное прощание с дочерью.',
    greetingKz:
      'Құрметті ағайын-туыс! Қызымызды ұзату дәстүріне шақырамыз. Батаңыз бен қуанышыңызбен қонақ болыңыздар.',
    closingKz: 'Жүрегімізді ашып күтеміз!',
  },
];

const SUNDET_TOY: TextPreset[] = [
  {
    labelRu: 'Сундет той',
    labelKz: 'Сүндет той',
    greetingRu:
      'Дорогие родные и друзья! Приглашаем вас на сундет той нашего сына. Разделите с нами радость этого важного дня.',
    greetingKz:
      'Құрметті ағайын-туыс, достар! Ұлымыздың сүндет тойына шақырамыз. Осы маңызды күннің қуанышын бізбен бөлісіңіздер.',
    closingRu: 'Ждём вас за дастарханом!',
    closingKz: 'Дастарханымызда күтеміз!',
  },
  {
    labelRu: 'Традиционный обряд',
    labelKz: 'Дәстүрлі рәсім',
    greetingRu:
      'Уважаемые гости! С радостью приглашаем вас на торжество по случаю сундет тоя.',
    greetingKz:
      'Құрметті қонақтар! Сүндет той салтанатына шақырамыз.',
  },
  {
    labelRu: 'Бала сүндеті',
    labelKz: 'Бала сүндеті',
    greetingRu: 'Дорогие ағайын! Приглашаем на сүндет той — важный этап в жизни нашего сына.',
    greetingKz:
      'Құрметті ағайын-туыс! Ұлымыздың сүндет тойына шақырамыз. Батаңыз бен қуанышыңызбен қонақ болыңыздар.',
    closingKz: 'Қош келдіңіздер!',
  },
];

const BIRTHDAY: TextPreset[] = [
  {
    labelRu: 'День рождения',
    labelKz: 'Туған күн',
    greetingRu: 'Приглашаем вас отпраздновать день рождения! Будем рады видеть вас на празднике.',
    greetingKz: 'Туған күнді бірге тойлауға шақырамыз! Мерекеде сіздерді көруге қуаныштымыз.',
  },
];

const ANNIVERSARY: TextPreset[] = [
  {
    labelRu: 'Юбилей',
    labelKz: 'Мерейтой',
    greetingRu:
      'Дорогие друзья! Приглашаем вас на юбилей. Разделите с нами радость этого знаменательного дня.',
    greetingKz:
      'Құрметті достар! Мерейтойға шақырамыз. Осы маңызды күннің қуанышын бізбен бөлісіңіздер.',
  },
];

const CORPORATE: TextPreset[] = [
  {
    labelRu: 'Корпоратив',
    labelKz: 'Корпоратив',
    greetingRu: 'Уважаемые коллеги! Приглашаем вас на корпоративное мероприятие.',
    greetingKz: 'Құрметті әріптестер! Корпоративтік іс-шараға шақырамыз.',
  },
];

const DEFAULT: TextPreset[] = [
  {
    labelRu: 'Универсальное',
    labelKz: 'Жалпы',
    greetingRu: 'Приглашаем вас на наше торжество. Будем рады видеть вас!',
    greetingKz: 'Салтанатымызға шақырамыз. Сіздерді көруге қуаныштымыз!',
  },
];

const BY_EVENT: Record<EventType, TextPreset[]> = {
  wedding: WEDDING,
  toy: TOY,
  betashar: BETASHAR,
  kyz_uzatu: KYZ_UZATU,
  sundet_toy: SUNDET_TOY,
  tusau_keser: BIRTHDAY,
  birthday: BIRTHDAY,
  anniversary: ANNIVERSARY,
  corporate: CORPORATE,
  other: DEFAULT,
};

/** Kazakh / Russian text presets for invitation copy, keyed by event type */
export function getTextPresets(eventType: EventType): TextPreset[] {
  return BY_EVENT[eventType] ?? DEFAULT;
}

export function getTextPreset(eventType: EventType, index: number): TextPreset | undefined {
  const presets = getTextPresets(eventType);
  return presets[index];
}

/** Resolve event type from template slug prefix */
export function eventTypeFromSlug(slug: string): EventType {
  if (slug.startsWith('kyz') || slug.startsWith('kyz-')) return 'kyz_uzatu';
  if (slug.startsWith('sundet')) return 'sundet_toy';
  if (slug.startsWith('wedding') || slug.startsWith('frame-')) return 'wedding';
  if (slug.startsWith('toy')) return 'toy';
  if (slug.startsWith('betashar')) return 'betashar';
  if (slug.startsWith('tusau') || slug.startsWith('tusau-')) return 'tusau_keser';
  if (slug.startsWith('birthday') || slug.startsWith('dark-lux')) return 'birthday';
  if (slug.startsWith('anniversary')) return 'anniversary';
  if (slug.startsWith('corporate')) return 'corporate';
  return 'other';
}
