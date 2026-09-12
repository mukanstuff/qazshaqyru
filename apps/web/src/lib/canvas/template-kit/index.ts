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

  return {
    document: parsed.data as unknown as InvitationCanvasDocument,
    layout: composed.layout,
  };
}
