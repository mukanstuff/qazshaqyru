/**
 * The catalogue, as skins.
 *
 * Both entries run the same `WEDDING_SKELETON` with the same `WEDDING_COPY`:
 * identical sections, identical order, identical sentences, identical type
 * scale. Everything that differs is in this file.
 *
 * Each palette carries three hues, not five values of one. Ours used to be an
 * unbroken brown ramp — #3A2E22 / #9C8A73 / #6E563F / #9D7648 on #F3EDDA — and
 * that is monochrome by definition; no amount of typography rescues it. toi's
 * flagship runs a cool slate ink, a crimson accent and a blue for controls on a
 * pale sky ground.
 */
import type { Skin } from './skin';

const A = '/assets/templates/aq-mor';
const OYU = '/assets/templates/oyu-kit';

/** Cream paper, wine and gold, a sealed envelope, pill controls. */
export const AQ_MOR: Skin = {
  slug: 'aq-mor',
  active: false,
  nameKz: 'Ақ мөр',
  nameRu: 'Ақ мөр',
  descriptionKz: 'Мөрі бар хатқалта, кремді қағаз, шарап пен алтын.',
  descriptionRu: 'Конверт с сургучной печатью, кремовая бумага, вино и золото.',
  priceKzt: 4990,
  sortOrder: 0,

  palette: {
    page: '#F3EDDA',
    panel: '#F3EDDA',
    ink: '#33352E',
    muted: '#8C8A79',
    accent: '#8C3A4A',
    gold: '#A6853F',
    onPhoto: '#FDF8F0',
    onPage: '#33352E',
  },
  fonts: {
    sans: 'Montserrat',
    // Shelley is the script on toi's flagship card and Romul the all-caps
    // antiqua shaqyru24 sets its values in. What was here before — a
    // rounded geometric black for the couple's names — was the single
    // loudest thing on the opening screen and read as a cartoon face.
    script: 'Shelley',
    display: 'Oranienbaum',
    heavy: 'Romul',
  },

  surface: 'flat',
  panelRadius: 0,
  panelInset: 6,

  hero: { kind: 'wave', radius: 0 },

  gallery: { kind: 'strip', radius: 10, mask: 'none' },

  pill: true,

  cardFill: 'rgba(255,252,244,0.55)',
  cardStroke: 'rgba(140,58,74,0.20)',
  heroWash: 'rgba(40,20,24,0.62)',
  photoShadow: 'rgba(140,58,74,0.20)',
  datePillFill: 'rgba(255,252,244,0.14)',
  datePillStroke: 'rgba(253,248,240,0.55)',

  decor: {
    srcs: [`${OYU}/oyu-medallion.png`, `${OYU}/oyu-rosette.png`, `${OYU}/oyu-corner.png`],
    tints: ['rgba(140,58,74,0.24)', 'rgba(166,133,63,0.30)', 'rgba(51,53,46,0.14)'],
    rule: `${OYU}/oyu-rule.png`,
    size: 24,
  },

  assets: {
    hero: `${A}/flowers.webp`,
    gallery1: `${A}/rings.webp`,
    gallery2: `${A}/pearls.webp`,
    gallery3: `${A}/flowers-2.webp`,
    closing: `${A}/venue-2.webp`,
  },

  envelope: true,
};

/**
 * The same invitation on a dark ground: deep olive page, ivory panels with the
 * 50px radius shaqyru24 uses, an inset hero card with a 25px radius, arched
 * gallery frames, squared controls, a second script and a terracotta accent.
 */
export const KURA_ALTYN: Skin = {
  slug: 'kura-altyn',
  active: false,
  nameKz: 'Күреңалтын',
  nameRu: 'Күреңалтын',
  descriptionKz: 'Қою зәйтүн фон, піл сүйегі панельдер, аркалы суреттер, алтын ою.',
  descriptionRu: 'Глубокий оливковый фон, панели цвета слоновой кости, арочные фото, золотое ою.',
  priceKzt: 4990,
  sortOrder: 1,

  palette: {
    page: '#3F4234',
    panel: '#F7F3E8',
    ink: '#33301F',
    muted: '#8A8570',
    accent: '#7A3B34',
    gold: '#B08F3E',
    onPhoto: '#F7F3E8',
    onPage: '#EDE6D2',
  },
  fonts: {
    sans: 'Montserrat',
    script: 'Ametist',
    display: 'Monumenta',
    heavy: 'Monumenta',
  },

  surface: 'panel',
  panelRadius: 50,
  panelInset: 4,

  // Three frames down the right edge with the two initials beside them —
  // shaqyru24's fourth device, and the only one of the four that puts type
  // and photography side by side instead of one on top of the other.
  hero: { kind: 'monogram', radius: 4 },

  gallery: { kind: 'duo', radius: 0, mask: 'arch' },

  pill: false,

  cardFill: 'rgba(247,243,232,0.92)',
  cardStroke: 'rgba(176,143,62,0.35)',
  heroWash: 'rgba(24,26,18,0.66)',
  photoShadow: 'rgba(24,26,18,0.34)',
  datePillFill: 'rgba(247,243,232,0.10)',
  datePillStroke: 'rgba(247,243,232,0.50)',

  decor: {
    srcs: [`${OYU}/oyu-rosette.png`, `${OYU}/oyu-corner.png`, `${OYU}/oyu-medallion.png`],
    tints: ['rgba(176,143,62,0.55)', 'rgba(122,59,52,0.48)', 'rgba(247,243,232,0.22)'],
    rule: `${OYU}/oyu-rule.png`,
    size: 22,
  },

  assets: {
    hero: `${A}/venue.webp`,
    hero2: `${A}/rings-2.webp`,
    hero3: `${A}/pearls.webp`,
    gallery1: `${A}/flowers-2.webp`,
    gallery2: `${A}/rings-2.webp`,
    gallery3: `${A}/pearls.webp`,
    closing: `${A}/flowers.webp`,
  },

  envelope: false,
};



const X = '/assets/templates/xat';

/**
 * «Хат» — the invitation as a letter that is actually opened.
 *
 * The flagship, and the first template in this catalogue that is not a
 * rearrangement of somebody else's card.
 *
 * What it does that the reference services do not:
 *
 *  - **The envelope is filmed.** Both of them open on an envelope screen and
 *    both draw it in CSS. Ours plays a clip of a real one being opened and
 *    hands over to the page when it ends. That is the frame a host screenshots
 *    into the group chat.
 *  - **A printed band runs the whole page.** One seamless ою tile repeated
 *    from the invitation down to the wishes, with a finial at each end, so the
 *    page reads as one printed sheet instead of nine stacked boxes — and so
 *    the content has something to sit against instead of being centred by
 *    default. Every card in this market is a centred column on flat colour.
 *  - **Photographs are mounted, not cropped.** A white margin, two degrees off
 *    square and a photographed album corner holding each print.
 *  - **The programme runs along a thread** with photographed objects beside
 *    it rather than being a two-column table of times.
 *  - **The page turns itself.** `autoScroll` has been implemented on the guest
 *    page and offered in the editor since before this template existed and no
 *    template had ever set it. toi runs it on every card.
 *
 * `typeScale: 1.2` puts body copy at 20 design px — about 19 rendered on a
 * 375px handset, which is where toi's own large card (`template29`, scale 1.4,
 * body 20.3) sits. Their small card, the one we had been copying, is 14.
 */
export const XAT: Skin = {
  slug: 'xat',
  nameKz: 'Хат',
  nameRu: 'Хат',
  descriptionKz:
    'Нағыз хатқалта: басып ашасыз, ішінен шақыру шығады. Қағаз, ою жиегі, суреттер альбомдағыдай қыстырылған.',
  descriptionRu:
    'Настоящий конверт: нажимаете — он вскрывается, из него выходит приглашение. Бумага, орнаментальный кант, фотографии вклеены как отпечатки.',
  priceKzt: 4990,
  sortOrder: 0,

  typeScale: 1.2,

  palette: {
    page: '#F4EFE4',
    panel: '#FBF7EF',
    ink: '#2E2A24',
    muted: '#8A8071',
    accent: '#7A2E38',
    gold: '#A8863F',
    onPhoto: '#FBF7EF',
    onPage: '#2E2A24',
  },
  fonts: {
    sans: 'Montserrat',
    script: 'Shelley',
    display: 'Monumenta',
    heavy: 'Romul',
  },

  surface: 'flat',
  panelRadius: 0,
  panelInset: 0,

  hero: { kind: 'letter', radius: 0 },

  gallery: { kind: 'stagger', radius: 2, mask: 'none' },

  pill: true,

  cardFill: 'rgba(251,247,239,0.82)',
  cardStroke: 'rgba(168,134,63,0.32)',
  heroWash: 'rgba(30,22,16,0.42)',
  photoShadow: 'rgba(46,42,36,0.26)',
  datePillFill: 'rgba(251,247,239,0.14)',
  datePillStroke: 'rgba(251,247,239,0.55)',

  decor: {
srcs: [`${X}/oyu-rosette.png`],
    tints: ['rgba(168,134,63,0.30)', 'rgba(122,46,56,0.20)', 'rgba(46,42,36,0.12)'],
    rule: `${X}/oyu-rule.png`,
    size: 22,
  },

  wash: {
srcs: [`${X}/hero.webp`, `${X}/gallery-1.webp`, `${X}/closing.webp`],
    // Present at one edge, gone at the other. A flat veil — theirs is a
    // uniform rgba(250,245,236,.72) — reads as a texture and nothing else.
    from: 'rgba(244,239,228,0.55)',
    to: 'rgba(244,239,228,0.98)',
    saturate: 62,
  },

  band: {
    tile: `${X}/oyu-band-tile.png`,
    capTop: `${X}/oyu-rosette.png`,
    capBottom: `${X}/oyu-rosette.png`,
    width: 7,
    inset: 3,
    side: 'left',
    tint: 'rgba(168,134,63,0.55)',
  },

  print: {
    border: 9,
    borderColor: '#FBF7EF',
    cornerSrc: `${X}/cut-print-corner.webp`,
  },

  assets: {
    hero: `${X}/hero.webp`,
    gallery1: `${X}/gallery-1.webp`,
    gallery2: `${X}/gallery-2.webp`,
    gallery3: `${X}/gallery-3.webp`,
    closing: `${X}/closing.webp`,
    paper: `${X}/paper.webp`,
    paperEdge: `${X}/paper-edge-torn.webp`,
    print1: `${X}/gallery-2.webp`,
    print2: `${X}/gallery-3.webp`,
    print3: `${X}/gallery-1.webp`,
  },

  envelope: {
    videoSrc: `${X}/video/envelope-open.mp4`,
    posterSrc: `${X}/video/envelope-open-poster.webp`,
    // Measured, not guessed: the envelope occupies x 30-610 of the clip's 720,
    // so it sits left of centre and a centred `cover` crop cuts its left tip
    // off on every handset.
    focus: '18% center',
    accent: '#7A2E38',
  },

  autoScroll: { enabled: true, speed: 'slow' },
};

/**
 * The catalogue.
 *
 * `XAT` is the only one a customer sees. The two below it are kept as code —
 * their compositions (`wave`, `monogram`) and their photography are real, and
 * only the bar has moved — but they are `active: false` until they are rebuilt
 * to it. Two more skins that ran on borrowed photographs were deleted outright:
 * a template that reuses another one's pictures is that template in a
 * different colour.
 */
export const SKINS: Skin[] = [XAT, AQ_MOR, KURA_ALTYN];
