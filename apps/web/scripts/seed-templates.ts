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
  steppeHero,
  type SectionEntry,
  type TemplateTheme,
} from '../src/lib/canvas/template-kit';

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
  sortOrder: number;
  theme: TemplateTheme;
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

const RECIPES: Recipe[] = [
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
  for (const r of RECIPES) {
    const { document } = buildTemplate({
      theme: r.theme,
      sections: r.sections,
      assets: r.assets,
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
        category: 'wedding',
        previewImageUrl: `/assets/previews/${r.slug}.webp`,
        priceKzt: r.priceKzt,
        sortOrder: r.sortOrder,
        isActive: true,
        isCanvasTemplate: true,
        canvas: document as unknown as object,
      },
      update: {
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
