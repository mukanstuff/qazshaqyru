/**
 * Stacks section builders into a finished canvas document.
 *
 * The composer owns three things sections must not decide for themselves:
 *  - absolute `y` (a section only knows offsets within itself),
 *  - element ids (deterministic, so two runs of the same recipe produce
 *    byte-identical documents and diffs stay readable),
 *  - `zIndex` (monotonically increasing down the page, so a later section's
 *    background can never cover an earlier section's text).
 */
import type { CanvasElement, InvitationCanvasDocument } from '../types';
import { CANVAS_VERSION } from '../types';
import type { AssetMap, SectionContext, SectionEntry, TemplateTheme } from './types';

export interface ComposeOptions {
  theme: TemplateTheme;
  sections: SectionEntry[];
  assets?: AssetMap;
  locale?: 'kz' | 'ru';
  width?: number;
  /** Extra breathing room inserted between sections, in px. */
  gap?: number;
  /**
   * Open behind a sealed envelope the guest taps to reveal the invitation.
   *
   * `EnvelopeGate` has existed on the guest page all along and no template
   * ever set the flag, so the feature shipped dead. It is worth switching on:
   * the best-selling wedding template at shaqyru24 opens exactly this way,
   * and this screen is the frame that gets screenshotted into the WhatsApp
   * group.
   */
  envelope?: boolean | { videoSrc?: string; posterSrc?: string; focus?: string; accent?: string; layout?: 'bottom' | 'split' };

  /**
   * The page scrolls itself, slowly, until the guest touches it.
   *
   * Fully implemented on the guest page (`CanvasGuestPage`, `useAutoScroll`)
   * and offered as a switch in the editor, and not one template has ever set
   * it — so the feature has shipped dead since it was written. toi runs it on
   * every card (`__TOI_AUTOSCROLL_SPEED = 60`).
   */
  autoScroll?: { enabled: boolean; speed?: 'slow' | 'normal' | 'fast' };

  /**
   * How the painted ground is laid down.
   *
   * `cover` stretches one copy over the whole document, which is right for a
   * painting and wrong for a material: a square paper texture pulled over
   * 6000px is a smear with no fibre left in it. A texture wants `repeat`.
   */
  groundSize?: 'cover' | 'repeat';
}

export interface ComposeResult {
  document: InvitationCanvasDocument;
  /** Where each section landed — useful for tests and for section reordering. */
  layout: Array<{ key: string; top: number; height: number }>;
}

export function composeTemplate(opts: ComposeOptions): ComposeResult {
  const {
    theme,
    sections,
    assets = {},
    locale = 'kz',
    width = 390,
    gap = 0,
    envelope = false,
    autoScroll,
    groundSize = 'cover',
  } = opts;
  const envelopeOn = envelope !== false && envelope !== undefined;
  const envelopeMedia = typeof envelope === 'object' ? envelope : undefined;

  const ctx: SectionContext = { theme, assets, locale, width };

  const elements: CanvasElement[] = [];
  const layout: ComposeResult['layout'] = [];

  let cursor = 0;
  // Start high enough that a template can still sit decorative elements
  // beneath the flow by hand if it ever needs to.
  let z = 10;

  for (const section of sections) {
    const { elements: specs, height } = section.build(ctx);

    // Entrance animation, staggered inside each section.
    //
    // Every element in every template previously had none: the renderer has
    // supported scroll-triggered entrances all along, but nothing ever set
    // the property, so the whole catalogue rendered static. Competitors
    // animate essentially everything, and it is a large part of why their
    // pages feel finished.
    //
    // Timing is matched to theirs after reading their stylesheet: 760ms on
    // cubic-bezier(.22,1,.36,1) — a long, soft deceleration, not `ease` — with
    // a per-element delay so a section arrives as a sequence rather than all
    // at once. Pinned elements are excluded: they are always on screen, so an
    // entrance would fire at an arbitrary scroll position.
    let animIndex = 0;

    specs.forEach((spec, i) => {
      const localY = typeof spec.props.y === 'number' ? spec.props.y : 0;
      const isPinned = Boolean(spec.props.pinned);
      const animate = spec.animate !== false && !isPinned;
      const animation = animate
        ? {
            type: 'fadeUp' as const,
            duration: 0.76,
            delay: Math.min(animIndex * 0.09, 0.55),
            easing: 'ease-out' as const,
            once: true,
            // A section's own choice wins over the house default, so a
            // template can choreograph rather than repeat one gesture.
            ...(typeof spec.animate === 'object' ? spec.animate : {}),
          }
        : undefined;
      if (animate) animIndex += 1;

      z += 1;
      elements.push({
        ...spec.props,
        ...(animation ? { animation } : {}),
        id: `${section.key}-${i}`,
        type: spec.type,
        y: cursor + localY,
        rotation: typeof spec.props.rotation === 'number' ? spec.props.rotation : 0,
        zIndex: typeof spec.props.zIndex === 'number' ? spec.props.zIndex : z,
        locked: false,
        hidden: false,
      } as CanvasElement);
    });

    layout.push({ key: section.key, top: cursor, height });
    cursor += height + gap;
  }

  return {
    document: {
      version: CANVAS_VERSION,
      width,
      height: cursor,
      // Templates are authored in a language; carry it so the renderer's own
      // labels agree with the words the sections already put on the canvas.
      locale,
      ...(envelopeOn ? { envelopeEnabled: true } : {}),
      ...(envelopeMedia ? { envelope: envelopeMedia } : {}),
      ...(autoScroll ? { autoScroll } : {}),
      // The painted ground runs behind the whole document, not just the hero.
      // Confining it to the opening screen made the style fall off a cliff at
      // the first section break: a composed card followed by a plain page.
      background: assets.ground
        ? {
            type: 'image',
            color: theme.paper,
            imageSrc: assets.ground,
            backgroundSize: groundSize,
          }
        : { type: 'solid', color: theme.paper, backgroundSize: 'cover' },
      elements,
      editorMetadata: { lastModifiedAt: new Date(0).toISOString() },
    } as InvitationCanvasDocument,
    layout,
  };
}
