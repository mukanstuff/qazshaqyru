/**
 * One skeleton, many skins.
 *
 * Every template in this catalogue used to be its own file of seven hundred
 * hand-placed coordinates, which is why they all drifted and why "a hundred
 * templates" was never going to happen. The reference services do not work
 * that way: the same page comes back over and over, and what varies is the
 * wrapping. So the running order and the words live here, and `skin.ts` holds
 * everything that may change.
 *
 * The block list and every number in `layout.ts` are measured, not invented.
 * Source: toi.com.kz `wedding/template30`, read element by element out of the
 * DOM at their native 430px width. Cross-checked against shaqyru24's two
 * best-selling cards (their API reports `total_sold`, so "best-selling" is a
 * fact rather than a guess).
 *
 * The two findings that mattered most, because both contradict what this
 * catalogue was doing:
 *
 *  - **Photographs are rare and clustered.** The whole toi card carries FOUR:
 *    one in the hero and three in a single gallery strip. Nowhere else — not
 *    at the date, not at the hosts, not at the venue, not at the close. Our
 *    templates put a full-width photograph between every pair of text blocks,
 *    which is what made them read as a slideshow.
 *  - **One section is about one phone screen.** Theirs run 550-1065px against
 *    a 844px viewport, and nothing is shorter than 550. Ours had blocks of 250
 *    and 330, so the page felt like a list rather than a sequence of screens.
 */

export type BlockKind =
  | 'hero'
  | 'invite'
  | 'gallery'
  | 'when'
  | 'hosts'
  | 'details'
  | 'rsvp'
  | 'wishes'
  | 'closing';

export interface Block {
  kind: BlockKind;
}

/**
 * The running order, with the measured height of each block on their card.
 *
 * `when` is deliberately one big block rather than four small ones: on their
 * page the date, the calendar, the two ceremony times, the countdown, the
 * venue and the map button are a single 1065px screen-and-a-bit. Splitting
 * that into separate sections is how ours ended up with a 330px venue block
 * surrounded by air.
 */
export const WEDDING_SKELETON: Block[] = [
  { kind: 'hero' },
  { kind: 'invite' },
  { kind: 'gallery' },
  { kind: 'when' },
  { kind: 'hosts' },
  { kind: 'details' },
  { kind: 'rsvp' },
  { kind: 'wishes' },
  { kind: 'closing' },
];

export interface Bilingual {
  kz: string;
  ru: string;
}

export interface ProgramRow {
  time: string;
  title: Bilingual;
}

/**
 * The words.
 *
 * Fixed across templates for the same reason the order is: on both reference
 * services the sentences are near-identical from card to card, because they
 * are the sentences a Kazakh wedding invitation contains.
 */
export interface SkeletonCopy {
  /**
   * Demo date, ISO.
   *
   * `calendar` and `countdown` read nothing but their own `targetIso`; with
   * none set the countdown renders a lone ♥ and the calendar renders
   * whatever month it happens to be. `apply-field-placeholders` overwrites
   * this the moment a host fills the wizard in.
   */
  eventIso: string;
  /** The small caps line above the names on the opening screen. */
  heroKicker: Bilingual;
  heroDate: Bilingual;
  first: string;
  second: string;

  inviteEyebrow: Bilingual;
  inviteBody: Bilingual;

  galleryEyebrow: Bilingual;

  whenEyebrow: Bilingual;
  dateLine: string;
  startsLabel: Bilingual;
  startsTime: string;
  ceremonies: ProgramRow[];
  venueEyebrow: Bilingual;
  venueName: Bilingual;
  mapButton: Bilingual;

  hostsEyebrow: Bilingual;
  hostsName: Bilingual;

  dressTitle: Bilingual;
  dressBody: Bilingual;
  programTitle: Bilingual;
  program: ProgramRow[];

  rsvpEyebrow: Bilingual;
  rsvpTitle: Bilingual;

  wishesEyebrow: Bilingual;
  wishesTitle: Bilingual;

  closing: Bilingual;
}

export const WEDDING_COPY: SkeletonCopy = {
  eventIso: '2027-05-15T12:00:00.000Z',
  heroKicker: { kz: 'Үйлену тойына шақыру', ru: 'Приглашение на свадьбу' },
  heroDate: { kz: '15 мамыр 2027', ru: '15 мая 2027' },
  first: 'Айдар',
  second: 'Айсұлу',

  inviteEyebrow: { kz: 'Құрметті қонақтар!', ru: 'Дорогие гости!' },
  inviteBody: {
    kz: 'Сіз(дер)ді балаларымыздың үйлену тойына арналған салтанатты ақ дастарханымыздың қадірлі қонағы болуға шақырамыз.',
    ru: 'Приглашаем вас разделить с нами торжество по случаю бракосочетания наших детей.',
  },

  galleryEyebrow: { kz: 'Біздің тарихымыз', ru: 'Наша история' },

  whenEyebrow: { kz: 'Күнді белгілеу', ru: 'Сохраните дату' },
  dateLine: '15.05.2027',
  startsLabel: { kz: 'басталуы', ru: 'начало' },
  startsTime: '18:00',
  ceremonies: [
    { time: '12:00', title: { kz: 'Құдалық', ru: 'Құдалық' } },
    { time: '14:00', title: { kz: 'Беташар', ru: 'Беташар' } },
  ],
  venueEyebrow: { kz: 'Той өтетін орын', ru: 'Место проведения' },
  venueName: { kz: 'Алматы қ., «Салтанат» сарайы', ru: 'г. Алматы, «Салтанат» сарайы' },
  mapButton: { kz: 'Карта арқылы ашу', ru: 'Открыть на карте' },

  hostsEyebrow: { kz: 'Той иелері', ru: 'Хозяева торжества' },
  hostsName: { kz: 'Серік & Гүлнар', ru: 'Серик & Гульнар' },

  dressTitle: { kz: 'Дресс-код', ru: 'Дресс-код' },
  dressBody: {
    kz: 'Құрметті қонақтар, тойға әдемі әрі салтанатты киіммен келуіңізді сұраймыз.',
    ru: 'Дорогие гости, просим вас прийти в нарядной и торжественной одежде.',
  },
  programTitle: { kz: 'Бағдарлама', ru: 'Программа' },
  program: [
    { time: '17:00', title: { kz: 'Қонақтарды қарсы алу', ru: 'Встреча гостей' } },
    { time: '18:00', title: { kz: 'Тойдың басталуы', ru: 'Начало торжества' } },
    { time: '22:00', title: { kz: 'Тойдың аяқталуы', ru: 'Завершение' } },
  ],

  rsvpEyebrow: { kz: 'Жауабыңызды күтеміз', ru: 'Ждём вашего ответа' },
  rsvpTitle: { kz: 'Сіз келесіз бе?', ru: 'Вы придёте?' },

  wishesEyebrow: { kz: 'Ізгі ниетпен', ru: 'С добрыми пожеланиями' },
  wishesTitle: { kz: 'Тілектер', ru: 'Пожелания' },

  closing: { kz: 'Оқиға басталды!', ru: 'История началась!' },
};
