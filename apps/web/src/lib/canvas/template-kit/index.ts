/**
 * Template section library.
 *
 * A template is a recipe: pick a theme, list sections, point at an asset
 * folder. `buildTemplate` returns a document that has already been validated
 * against the real Zod schema, so a recipe that would be rejected on save
 * fails here instead of silently blanking an invitation later.
 */
import { canvasDocumentSchema } from '../schemas';
import type { InvitationCanvasDocument } from '../types';
import { composeTemplate, type ComposeOptions, type ComposeResult } from './compose';

export type {
  AssetKey,
  AssetMap,
  ElementSpec,
  SectionBuilder,
  SectionContext,
  SectionEntry,
  SectionResult,
  TemplateTheme,
} from './types';

export {
  archHero,
  steppeHero,
  divider,
  paintedHero,
  paintedDivider,
  paintedClosing,
  BLEED,
  calendar,
  closing,
  countdown,
  dressCode,
  floatingMusic,
  greeting,
  hero,
  location,
  rsvp,
} from './builders';

export {
  OYU_GROUNDS,
  oyuBand,
  oyuClosing,
  oyuGreeting,
  oyuHero,
  oyuPortrait,
  oyuProgram,
  oyuWhen,
} from './oyu-builders';

export {
  AK_OTAU_ASSETS,
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
} from './ak-otau-builders';

export {
  amClosing,
  amDate,
  amFlowers,
  amGreeting,
  amHero,
  amHosts,
  amPearls,
  amProgram,
  amRings,
  amRsvp,
  amVenue,
  amWishes,
} from './aq-mor-builders';

export {
  SYRMAQ_ASSETS,
  OYU,
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
} from './syrmaq-builders';

export {
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
} from './inju-builders';

export {
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
} from './saukele-builders';

export { WEDDING_SKELETON, WEDDING_COPY, type Block, type BlockKind, type Bilingual, type SkeletonCopy } from './skeleton';
export type { Skin, SkinPalette, SkinFonts, SkinAssets, SkinDecor } from './skin';
export { skeletonSections, skinToTheme } from './layout';

export { THEMES, type ThemeName } from './themes';
export { composeTemplate, type ComposeOptions, type ComposeResult } from './compose';

export class TemplateValidationError extends Error {
  constructor(
    message: string,
    readonly issues: unknown
  ) {
    super(message);
    this.name = 'TemplateValidationError';
  }
}

export interface BuildTemplateResult extends ComposeResult {
  document: InvitationCanvasDocument;
}

/**
 * Compose and validate in one step. Throws rather than returning an invalid
 * document — a template that cannot round-trip through Zod must never reach
 * the database, because `parseCanvasOrEmpty` would later swallow it whole.
 */
export function buildTemplate(opts: ComposeOptions): BuildTemplateResult {
  const composed = composeTemplate(opts);
  const parsed = canvasDocumentSchema.safeParse(composed.document);

  if (!parsed.success) {
    throw new TemplateValidationError(
      'Template recipe produced a document the canvas schema rejects',
      parsed.error.issues
    );
  }

  // A prop the element schema does not know is silently deleted by Zod, and
  // the element then renders on its schema defaults. Nothing catches it:
  // `ElementSpec.props` is loosely typed so tsc is happy, and the parse
  // succeeds so the seed reports the template as built. «Сәукеле» shipped its
  // countdown in wine #6b1d3a and Cormorant this way — the recipe had said
  // `textColor` and `timeColor`, and the schema calls them `color` and
  // `accentColor`. Compare the key sets and refuse the build instead.
  const dropped: string[] = [];
  const parsedElements = (parsed.data as { elements: Record<string, unknown>[] }).elements;
  composed.document.elements.forEach((raw, i) => {
    const kept = new Set(Object.keys(parsedElements[i] ?? {}));
    for (const key of Object.keys(raw)) {
      if (!kept.has(key)) dropped.push(`${(raw as { id?: string }).id ?? i} (${raw.type}): ${key}`);
    }
  });
  if (dropped.length) {
    throw new TemplateValidationError(
      `Template recipe sets ${dropped.length} prop(s) the element schema does not have; ` +
        `they would be dropped and the element would render on defaults:\n  ${dropped.join('\n  ')}`,
      []
    );
  }

  return {
    document: parsed.data as unknown as InvitationCanvasDocument,
    layout: composed.layout,
  };
}
