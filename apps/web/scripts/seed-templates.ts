/**
 * Publish the template-kit recipes into the catalogue.
 *
 * Templates are *recipes* in code, not hand-edited rows: this script composes
 * each one through `buildTemplate` (which validates against the real canvas
 * schema) and upserts it by slug. Re-running after a recipe changes republishes
 * it, so the catalogue can never drift from the code that produced it.
 *
 *   pnpm seed:templates
 */
import { PrismaClient } from '@prisma/client';
import {
  akClosing,
  akDressCode,
  akHero,
  akHosts,
  akInvite,
  akLocation,
  akProgram,
  akRsvp,
  akStory,
  akWhen,
  akWishes,
  buildTemplate,
  calendar,
  countdown,
  divider,
  floatingMusic,
  greeting,
  location,
  oyuBand,
  oyuClosing,
  oyuGreeting,
  oyuHero,
  oyuPortrait,
  oyuProgram,
  oyuWhen,
  paintedClosing,
  paintedDivider,
  paintedHero,
  rsvp,
  skeletonSections,
  skinToTheme,
  steppeHero,
  syrClosing,
  syrDress,
  syrFrieze,
  syrHero,
  syrInvite,
  syrLocation,
  syrOlen,
  syrProgram,
  syrRsvp,
  syrStory,
  syrWhen,
  syrWishes,
  injuArch,
  injuBand,
  injuClosing,
  injuMedallion,
  injuGreeting,
  injuHero,
  injuHosts,
  injuLocation,
  injuRsvp,
  injuWhen,
  injuWishes,
  saukeleBand,
  saukeleClosing,
  saukeleGreeting,
  saukeleHero,
  saukeleHosts,
  saukeleLocation,
  saukeleObject,
  saukeleRsvp,
  saukeleWhen,
  saukeleWishes,
  type SectionEntry,
  type TemplateTheme,
} from '../src/lib/canvas/template-kit';
import { WEDDING_COPY, WEDDING_SKELETON } from '../src/lib/canvas/template-kit/skeleton';
import { SKINS } from '../src/lib/canvas/template-kit/skins';

const prisma = new PrismaClient();

// A far-future date so the countdown and calendar look alive in previews.
const ISO = '2027-05-15T12:00:00.000Z';

interface Recipe {
  slug: string;
  nameRu: string;
  nameKz: string;
  descriptionRu: string;
  descriptionKz: string;
  priceKzt: number;
  /**
   * Prisma enum `TemplateCategory`. Defaults to `wedding` because every
   * recipe before «Сырмақ» was a wedding, and the seed hardcoded it — which
   * is why the catalogue had five wedding templates and nothing in any other
   * category, while the landing page advertised six occasions.
   */
  category?: 'wedding' | 'toy' | 'betashar' | 'kyz_uzatu' | 'sundet_toy' | 'tusau_keser' | 'birthday' | 'anniversary' | 'corporate' | 'other';
  sortOrder: number;
  theme: TemplateTheme;
  /**
   * Open behind a sealed envelope — see ComposeOptions.envelope.
   *
   * Object form carries the clip. It was boolean only, so a template could
   * switch the gate on but never hand it a video, and the envelope film shot
   * for «Сәукеле» sat in the assets folder unreferenced.
   */
  envelope?: boolean | { videoSrc?: string; posterSrc?: string; focus?: string; accent?: string };
  /** The page scrolls itself until touched — see ComposeOptions.autoScroll. */
  autoScroll?: { enabled: boolean; speed?: 'slow' | 'normal' | 'fast' };
  /**
   * How the ground asset is laid down. A paper texture must repeat: one
   * square scan stretched over a 5000px document is a smear with no fibre.
   */
  groundSize?: 'cover' | 'repeat';
  assets: Record<string, string>;
  sections: SectionEntry[];
}

const GARDEN_THEME: TemplateTheme = {
  paper: '#f8f3e7',
  ink: '#4c4a3d',
  accent: '#b39355',
  muted: '#9a9481',
  onPhoto: '#ffffff',
  display: 'Cormorant',
  body: 'Montserrat',
  script: 'Cormorant',
};

// Warm parchment, walnut ink, muted brass — read to match the қошқар мүйіз
// ornament rather than the watercolour set.
const STEPPE_THEME: TemplateTheme = {
  paper: '#f7f2e9',
  ink: '#4a3a28',
  accent: '#a8791f',
  muted: '#948468',
  onPhoto: '#ffffff',
  display: 'Cormorant',
  body: 'Montserrat',
  script: 'Cormorant',
};

/**
 * The one dark palette in the catalogue.
 *
 * Both reference services and both of our own templates are painted on cream;
 * a fifth cream card is invisible in a grid of a hundred and twenty. Graphite
 * paper with antique gold reads instantly as a different product, and it is the
 * palette gold line ornament actually wants — on cream a hairline disappears,
 * on graphite it is the whole design.
 */
const OYU_THEME: TemplateTheme = {
  paper: '#14171b',
  ink: '#efe9dd',
  accent: '#c9a227',
  muted: '#8b8f96',
  onPhoto: '#ffffff',
  display: 'Cormorant',
  body: 'Montserrat',
  script: 'Cormorant',
};

/**
 * Warm ivory, antique gold and қызыл — the register both reference services
 * lead their wedding catalogues with, and the one this catalogue was missing.
 * The three existing themes are cream, parchment and graphite; none of them
 * carries a saturated tone, so nothing in the catalogue had a focal point.
 */
const AK_OTAU_THEME: TemplateTheme = {
  paper: '#f7efe3',
  ink: '#3d2f26',
  accent: '#a9812f',
  muted: '#8d7a63',
  onPhoto: '#ffffff',
  accentDeep: '#7d1f2b',
  display: 'Forum',
  body: 'Montserrat',
  /*
   * Names and pull-quotes are set in a real Garamond italic, not in a script.
   *
   * The script route was tried and rejected on the evidence: rendered over the
   * actual hero photograph next to seven alternatives, every Kazakh-capable
   * script face (Bad Script, Caveat, Pacifico) reads as felt-tip handwriting
   * rather than calligraphy, and Bad Script mangles ұ outright. The faces that
   * do look like wedding calligraphy — Great Vibes, Marck Script — contain no
   * Kazakh glyphs at all. A refined italic antiqua is both the honest option
   * and the one several of the reference cards actually use.
   */
  script: 'EB Garamond',
};

/**
 * Undyed wool, madder and ochre — read off a photograph of a real syrmaq
 * felt carpet rather than borrowed from European bridal stationery.
 *
 * The catalogue had five cream-and-gold themes and nothing else, and so does
 * every reference card in the ұзату category. The point of difference here is
 * that the palette and the ornament come from the same source: the colours are
 * sampled from the carpet the ою itself is cut from. There is no gold.
 */
const SYRMAQ_THEME: TemplateTheme = {
  paper: '#EDE6D8',
  ink: '#2A211A',
  accent: '#9A3B34',
  muted: '#8A7A63',
  onPhoto: '#F5EFE2',
  accentDeep: '#B07C3E',
  display: 'Oranienbaum',
  body: 'Monolog',
  script: 'Corinthia',
};

/**
 * «Сәукеле» — қыз ұзату, вторая в этой категории.
 *
 * Светлый бумажный регистр, как измерено для ұзату. Палитра снята с зергерлік:
 * приглушённая бирюза-феруза, какой её ставят в казахское серебро, и
 * оксидированное серебро в `accentDeep` — оно несёт весь орнамент и подписи.
 * В каталоге это первый холодный шаблон: пять старых кремово-золотые, «Інжу»
 * золотой, «Сырмақ» красно-коричневый. Золота здесь нет ни грамма, и это
 * единственное, чем он расходится с «Сырмақ» на уровне палитры, а не скелета.
 */
const SAUKELE_THEME: TemplateTheme = {
  paper: '#F4F1EA',
  ink: '#2B2E33',
  accent: '#5E8B8C',
  muted: '#8D8B84',
  onPhoto: '#F7F4EE',
  accentDeep: '#8A8F96',
  display: 'DomainDisplay',
  body: 'Monolog',
  script: 'Shelley',
};

/**
 * «Інжу» — the high-key register, measured rather than guessed.
 *
 * Eight live best-sellers were screenshotted before this palette was chosen:
 * four of the eight paint the page flat `#ffffff`, the others `#f9faf3` and
 * `#f5f5f5`, and the wedding category has no dark variant at all. Warm
 * off-white paper, one warm brown ink, one brass gold. The greeting panel is
 * white at 62% over the paper, which is how their panels separate from the
 * ground without introducing a colour.
 *
 * Type roles are the pair both services actually set: Shelley for the names,
 * Monumenta for section headings, Romul for everything read as text.
 */
const INJU_THEME: TemplateTheme = {
  paper: '#F6F1E8',
  ink: '#3A2A1C',
  accent: '#C9A45F',
  muted: '#9A8B76',
  onPhoto: '#FFFFFF',
  accentDeep: '#A8853F',
  display: 'Monumenta',
  body: 'Romul',
  script: 'Shelley',
};

const RECIPES: Recipe[] = [
  {
    slug: 'inju',
    nameRu: 'Інжу',
    nameKz: 'Інжу',
    descriptionRu:
      'Шёлк и жемчуг во всю ширину, арка на смещённом кадре, қошқар мүйіз в пяти масштабах. Высокий ключ, тёплый белый.',
    descriptionKz:
      'Бүкіл енді алатын жібек пен інжу, жылжытылған кадрдағы арка, бес өлшемдегі қошқар мүйіз. Ашық, жылы ақ түс.',
    priceKzt: 4990,
    sortOrder: 0,
    theme: INJU_THEME,
    envelope: true,
    autoScroll: { enabled: true, speed: 'slow' },
    groundSize: 'repeat',
    assets: { ground: '/assets/templates/inju/paper-ground.webp' },
    sections: [
      { key: 'hero', build: injuHero() },
      { key: 'band', build: injuBand() },
      { key: 'greeting', build: injuGreeting() },
      { key: 'arch', build: injuArch() },
      { key: 'hosts', build: injuHosts() },
      { key: 'when', build: injuWhen({ targetIso: ISO }) },
      { key: 'medallion', build: injuMedallion() },
      { key: 'location', build: injuLocation() },
      { key: 'rsvp', build: injuRsvp() },
      { key: 'wishes', build: injuWishes() },
      { key: 'closing', build: injuClosing() },
      { key: 'music', build: floatingMusic({ variant: 'dial' }) },
    ],
  },
  {
    slug: 'syrmaq',
    category: 'kyz_uzatu',
    nameRu: 'Сырмақ',
    nameKz: 'Сырмақ',
    descriptionRu: 'Қыз ұзату в палитре войлочного ковра: небелёная шерсть, марена, охра. Крупный ою, смещённая колонка, без золота.',
    descriptionKz: 'Сырмақ түстеріндегі қыз ұзату: ақ жүн, қызыл, сары. Ірі ою, жылжытылған баған, алтынсыз.',
    priceKzt: 4990,
    sortOrder: 1,
    theme: SYRMAQ_THEME,
    assets: {},
    sections: [
      { key: 'hero', build: syrHero() },
      { key: 'frieze', build: syrFrieze() },
      { key: 'invite', build: syrInvite() },
      { key: 'olen', build: syrOlen() },
      { key: 'story', build: syrStory() },
      { key: 'when', build: syrWhen({ targetIso: ISO }) },
      { key: 'program', build: syrProgram() },
      { key: 'dress', build: syrDress() },
      { key: 'frieze2', build: syrFrieze(46) },
      { key: 'location', build: syrLocation() },
      { key: 'rsvp', build: syrRsvp() },
      { key: 'wishes', build: syrWishes() },
      { key: 'closing', build: syrClosing() },
    ],
  },
  {
    slug: 'saukele',
    category: 'kyz_uzatu',
    nameRu: 'Сәукеле',
    nameKz: 'Сәукеле',
    descriptionRu:
      'Қыз ұзату в серебре и бирюзе. Видео в герое, сәукеле в арке со смещением, ою в четырёх ролях. Высокий ключ, без золота.',
    descriptionKz:
      'Күміс пен феруза түсіндегі қыз ұзату. Геройда бейне, аркадағы сәукеле, төрт рөлдегі ою. Ашық түс, алтынсыз.',
    priceKzt: 4990,
    sortOrder: 0,
    theme: SAUKELE_THEME,
    envelope: {
      videoSrc: '/assets/templates/saukele/envelope.webm',
      posterSrc: '/assets/templates/saukele/envelope-poster.webp',
      accent: SAUKELE_THEME.accent,
    },
    autoScroll: { enabled: true, speed: 'slow' },
    groundSize: 'repeat',
    assets: { ground: '/assets/templates/saukele/ground-silk.webp' },
    sections: [
      { key: 'hero', build: saukeleHero() },
      { key: 'band', build: saukeleBand() },
      { key: 'greeting', build: saukeleGreeting() },
      { key: 'saukele', build: saukeleObject() },
      { key: 'hosts', build: saukeleHosts() },
      { key: 'when', build: saukeleWhen({ targetIso: ISO }) },
      { key: 'location', build: saukeleLocation() },
      { key: 'rsvp', build: saukeleRsvp() },
      { key: 'wishes', build: saukeleWishes() },
      { key: 'closing', build: saukeleClosing() },
      { key: 'music', build: floatingMusic({ variant: 'dial' }) },
    ],
  },
  {
    slug: 'ak-otau',
    nameRu: 'Ақ отау',
    nameKz: 'Ақ отау',
    descriptionRu:
      'Фотография во весь экран, казахский ою поверх неё и античное золото на слоновой кости.',
    descriptionKz:
      'Бүкіл экранды алатын фото, оның үстіндегі қазақ оюы және піл сүйегі мен көне алтын.',
    priceKzt: 4990,
    sortOrder: 1,
    theme: AK_OTAU_THEME,
    // Photography and ornament live in AK_OTAU_ASSETS; the sections reference
    // them directly.
    //
    // Deliberately NO `ground`. A paper texture was tried and removed: the
    // composer paints the ground with `background-size: cover` on a document
    // ~4900px tall, so a 1408x768 scan is scaled 6x by height and only a
    // narrow vertical strip of it is ever on screen. Every faint tonal
    // variation in that strip becomes a broad vertical band running down the
    // page — clearly visible behind the calendar. Blurring the source only
    // softened the band. A texture that can only be seen as a magnified smear
    // is not texture, so the ivory stays flat.
    assets: {},
    sections: [
      { key: 'hero', build: akHero() },
      { key: 'invite', build: akInvite() },
      { key: 'hosts', build: akHosts() },
      { key: 'story', build: akStory() },
      { key: 'when', build: akWhen({ targetIso: ISO }) },
      { key: 'program', build: akProgram() },
      { key: 'dresscode', build: akDressCode() },
      { key: 'location', build: akLocation() },
      { key: 'rsvp', build: akRsvp() },
      { key: 'wishes', build: akWishes() },
      { key: 'closing', build: akClosing() },
      { key: 'music', build: floatingMusic() },
    ],
  },
  {
    slug: 'altyn-oyu',
    nameRu: 'Алтын ою',
    nameKz: 'Алтын ою',
    descriptionRu: 'Графит и античное золото. Қошқар мүйіз, который рисует себя по мере прокрутки.',
    descriptionKz: 'Графит пен көне алтын. Айналдырған сайын өзін салатын қошқар мүйіз өрнегі.',
    priceKzt: 3990,
    sortOrder: 5,
    theme: OYU_THEME,
    // No raster artwork at all: the grounds are authored SVG and the ornament
    // is inline geometry, so this template is a few kilobytes and stays sharp
    // at any density.
    assets: {},
    sections: [
      { key: 'hero', build: oyuHero({ targetIso: ISO }) },
      { key: 'greeting', build: oyuGreeting() },
      { key: 'b1', build: oyuBand() },
      { key: 'portrait', build: oyuPortrait() },
      { key: 'when', build: oyuWhen({ targetIso: ISO }) },
      { key: 'b2', build: oyuBand() },
      { key: 'program', build: oyuProgram() },
      { key: 'location', build: location() },
      { key: 'b3', build: oyuBand() },
      { key: 'rsvp', build: rsvp() },
      { key: 'closing', build: oyuClosing() },
      { key: 'music', build: floatingMusic() },
    ],
  },
  {
    slug: 'aq-bata',
    nameRu: 'Ақ бата',
    nameKz: 'Ақ бата',
    descriptionRu: 'Акварельная арка с ботаникой, тёплый пергамент и антиква.',
    descriptionKz: 'Акварельді арка, жылы пергамент және классикалық қаріп.',
    priceKzt: 3990,
    sortOrder: 10,
    theme: GARDEN_THEME,
    assets: {
      heroBg: '/assets/generated/hero-bg.webp',
      divider: '/assets/generated/divider.webp',
      closingBg: '/assets/generated/closing-bg.webp',
    },
    sections: [
      { key: 'hero', build: paintedHero() },
      { key: 'greeting', build: greeting() },
      { key: 'd1', build: paintedDivider() },
      { key: 'calendar', build: calendar({ targetIso: ISO }) },
      { key: 'countdown', build: countdown({ targetIso: ISO }) },
      { key: 'd2', build: paintedDivider() },
      { key: 'location', build: location() },
      { key: 'd3', build: paintedDivider() },
      { key: 'rsvp', build: rsvp() },
      { key: 'closing', build: paintedClosing() },
      { key: 'music', build: floatingMusic() },
    ],
  },
  {
    slug: 'dala',
    nameRu: 'Дала',
    nameKz: 'Дала',
    descriptionRu: 'Қошқар мүйіз, тонкая рамка и печатная типографика.',
    descriptionKz: 'Қошқар мүйіз өрнегі, жіңішке жиек және баспа қарпі.',
    priceKzt: 3990,
    sortOrder: 20,
    theme: STEPPE_THEME,
    assets: {
      ground: '/assets/grounds/steppe-dawn.webp',
      heroBg: '/assets/templates/wedding-01/hero-bg.jpg',
    },
    sections: [
      { key: 'hero', build: steppeHero() },
      { key: 'greeting', build: greeting() },
      { key: 'd1', build: divider() },
      { key: 'calendar', build: calendar({ targetIso: ISO }) },
      { key: 'countdown', build: countdown({ targetIso: ISO }) },
      { key: 'd2', build: divider() },
      { key: 'location', build: location() },
      { key: 'd3', build: divider() },
      { key: 'rsvp', build: rsvp() },
      { key: 'closing', build: paintedClosing() },
      { key: 'music', build: floatingMusic() },
    ],
  },
];

async function main() {
  // Skins first. These are the templates that go through one skeleton and
  // one layout engine; the RECIPES below are the older hand-placed ones,
  // kept only until they are ported or retired.
  for (const skin of SKINS) {
    const { document } = buildTemplate({
      theme: skinToTheme(skin),
      sections: skeletonSections(WEDDING_SKELETON, WEDDING_COPY, skin),
      envelope: skin.envelope,
      // The page's own paper, tiled under every section. Without it the ground
      // is the palette's flat `page` colour, which is what a printed
      // invitation is precisely not.
      assets: skin.assets.paper ? { ground: skin.assets.paper } : {},
      autoScroll: skin.autoScroll,
      groundSize: skin.assets.paper ? 'repeat' : 'cover',
      locale: 'kz',
    });

    await prisma.template.upsert({
      where: { slug: skin.slug },
      create: {
        slug: skin.slug,
        nameRu: skin.nameRu,
        nameKz: skin.nameKz,
        descriptionRu: skin.descriptionRu,
        descriptionKz: skin.descriptionKz,
        category: 'wedding' as never,
        previewImageUrl: `/assets/previews/${skin.slug}.webp`,
        priceKzt: skin.priceKzt,
        sortOrder: skin.sortOrder,
        isActive: skin.active !== false,
        isCanvasTemplate: true,
        canvas: document as unknown as object,
      },
      update: {
        nameRu: skin.nameRu,
        nameKz: skin.nameKz,
        descriptionRu: skin.descriptionRu,
        descriptionKz: skin.descriptionKz,
        category: 'wedding' as never,
        priceKzt: skin.priceKzt,
        sortOrder: skin.sortOrder,
        isActive: skin.active !== false,
        isCanvasTemplate: true,
        canvas: document as unknown as object,
      },
    });

    console.log(
      `${skin.slug.padEnd(12)} ${document.elements.length} elements, ${document.height}px  ` +
        `[skin${skin.active === false ? ', hidden' : ''}]`,
    );
  }

  for (const r of RECIPES) {
    const { document } = buildTemplate({
      theme: r.theme,
      sections: r.sections,
      assets: r.assets,
      envelope: r.envelope,
      autoScroll: r.autoScroll,
      groundSize: r.groundSize,
      locale: 'kz',
    });

    await prisma.template.upsert({
      where: { slug: r.slug },
      create: {
        slug: r.slug,
        nameRu: r.nameRu,
        nameKz: r.nameKz,
        descriptionRu: r.descriptionRu,
        descriptionKz: r.descriptionKz,
        category: (r.category ?? 'wedding') as never,
        previewImageUrl: `/assets/previews/${r.slug}.webp`,
        priceKzt: r.priceKzt,
        sortOrder: r.sortOrder,
        isActive: true,
        isCanvasTemplate: true,
        canvas: document as unknown as object,
      },
      update: {
        category: (r.category ?? 'wedding') as never,
        nameRu: r.nameRu,
        nameKz: r.nameKz,
        descriptionRu: r.descriptionRu,
        descriptionKz: r.descriptionKz,
        previewImageUrl: `/assets/previews/${r.slug}.webp`,
        priceKzt: r.priceKzt,
        sortOrder: r.sortOrder,
        isActive: true,
        isCanvasTemplate: true,
        canvas: document as unknown as object,
      },
    });

    console.log(`${r.slug.padEnd(10)} ${document.elements.length} elements, ${document.height}px`);
  }

  // The old QA row is a bare test fixture, not something a customer should
  // ever see in the catalogue.
  const hidden = await prisma.template.updateMany({
    where: { slug: { in: ['qa-canvas-test'] } },
    data: { isActive: false },
  });
  if (hidden.count) console.log(`hid ${hidden.count} QA fixture(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
