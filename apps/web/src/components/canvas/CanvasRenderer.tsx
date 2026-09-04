/**
 * CanvasRenderer — renders an InvitationCanvasDocument as either a guest-facing
 * read-only page or the editor stage (mode='editor' wraps elements with selectable
 * shells handled by CanvasEditor).
 *
 * This component is intentionally side-effect-light. It is imported from the
 * guest page (/i/[slug]) as a client component to enable intersection-observer
 * animations; SSR still renders the initial tree; only animation triggers hydrate.
 */
'use client';

import { forwardRef, useEffect, useRef, type CSSProperties } from 'react';
import { cn } from '@/lib/shared/utils';
import type {
  AnimationConfig,
  IdleMotionConfig,
  CanvasElement,
  InvitationCanvasDocument,
  TextElement,
  HeadingElement,
  FontFamily,
} from '@/lib/canvas/types';
import { ensureDocumentFonts } from './elements/fontStack';
import { TextElementView } from './elements/TextElementView';
import { HeadingElementView } from './elements/HeadingElementView';
import { EditableTextView } from './elements/EditableTextView';
import { ImageElementView, OYU_CLIP_ID, OYU_CLIP_PATH } from './elements/ImageElementView';
import { ButtonElementView } from './elements/ButtonElementView';
import { ShapeElementView } from './elements/ShapeElementView';
import { DividerElementView } from './elements/DividerElementView';
import { CoupleNamesElementView } from './elements/CoupleNamesElementView';
import { CountdownElementView } from './elements/CountdownElementView';
import { CalendarElementView } from './elements/CalendarElementView';
import { RsvpFormElementView } from './elements/RsvpFormElementView';
import { WishesElementView } from './elements/WishesElementView';
import { MapElementView } from './elements/MapElementView';
import { MusicPlayerElementView } from './elements/MusicPlayerElementView';
import { GiftBlockElementView } from './elements/GiftBlockElementView';
import { QrCodeElementView } from './elements/QrCodeElementView';
import { ProgramElementView } from './elements/ProgramElementView';
import { OrnamentElementView } from './elements/OrnamentElementView';
import { LottieElementView } from './elements/LottieElementView';
import { VideoBgElementView } from './elements/VideoBgElementView';
import { PlaceholderFunctionalView } from './elements/PlaceholderFunctionalView';

export type RendererMode = 'guest' | 'editor';

export interface CanvasRendererProps {
  document: InvitationCanvasDocument;
  mode?: RendererMode;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** In editor mode, wraps each element with selection chrome.
   *  2026-08-20 (Phase B3): second argument passes canvasWidth so the
   *  chrome can correctly convert px→percent for drag/resize. The rest are
   *  the mutation callbacks so SelectionChrome can call them without needing
   *  to thread them separately. */
  renderEditorShell?: (
    el: CanvasElement,
    children: React.ReactNode,
    canvasWidth: number,
    callbacks: {
      onPositionChange: (id: string, pos: { x?: number; y?: number }) => void;
      onResize: (id: string, dim: { w?: number; h?: number | 'auto' }) => void;
      onRotate: (id: string, rotation: number) => void;
      onDragEnd: (id: string) => void;
    },
  ) => React.ReactNode;
  /** If true, plays animations immediately (used by editor "preview"). */
  forceAnimations?: boolean;
  /** Invitation URL for QR / calendar / share elements. */
  shareUrl?: string;
  /**
   * The published invitation slug.
   *
   * `/api/wishes` addresses an invitation by slug. The wishes element used to
   * read an invitation id out of `templateBindTo` — a field no template sets —
   * and post it under a key the route rejects, so the wishes wall fetched
   * nothing and saved nothing on every invitation ever published.
   */
  slug?: string;
  /** Locale for labels (ru | kz). */
  locale?: 'ru' | 'kz';
  /** Personal guest link token — lets the RSVP form identify the guest
   *  instead of asking for name/phone (which the open-RSVP endpoint requires). */
  guestToken?: string | null;
  /** False when the invitation only accepts answers through personal links. */
  openRsvp?: boolean;
  /** Extra className for the stage. */
  className?: string;

  /**
   * 2026-08-14: how the user enters text-edit mode in editor.
   *   'single' (default) — one tap → edit (guest-friendly).
   *   'double'            — double-click required (admin, advanced).
   * Only affects editor mode and only text/heading elements.
   */
  editingTrigger?: 'single' | 'double';

  /**
   * 2026-08-20 (Phase B3): element mutation callbacks used by the editor's
   * SelectionChrome drag/resize/rotate handles.
   */
  onElementPositionChange?: (id: string, pos: { x?: number; y?: number }) => void;
  onElementResize?: (id: string, dim: { w?: number; h?: number | 'auto' }) => void;
  onElementRotate?: (id: string, rotation: number) => void;
  /** Called when a drag/resize/rotate session ends — triggers history snapshot. */
  onElementDragEnd?: (id: string) => void;

  /**
   * 2026-07-30 PRODUCT MODEL ENFORCEMENT:
   * When true (from paid template order / fullAccess), this renderer MUST produce
   * a completely clean page — no watermark, no upsell hints.
   * Canvas path for paid invitations is ALWAYS clean (pay once = fullAccess).
   * See: PRODUCT_MODEL_AND_RULES.md, PRODUCT_DECISIONS_2026-07-30.md
   * Parent (CanvasGuestPage / public client) is responsible for setting this.
   * Legacy watermark logic lives only in section-engine paths.
   */
  fullAccess?: boolean;

  /**
   * 2026-08-09: in-place text editing plumbing.
   *
   * Editor-only. When provided, the renderer routes text/heading elements
   * through EditableTextView which:
   *  - reacts to dblclick by entering edit mode
   *  - shows a floating toolbar (B/I/КАПС/size/align/color)
   *  - calls back with `onTextPatch(id, patch)` for property changes and
   *    `onTextChange(id, { text })` for live typing
   *
   * Both callbacks are wrapped through HistoryStack by the parent so undo
   * works naturally — typing creates a new snapshot on commit (blur/Esc).
   */
  editingTextId?: string | null;
  onStartTextEdit?: (id: string) => void;
  onStopTextEdit?: (id: string) => void;
  onTextChange?: (id: string, patch: { text: string }) => void;
  onTextPatch?: (id: string, patch: Partial<import('@/lib/canvas/types').TextProps>) => void;
}

/**
 * The ornament clip path, emitted once per page.
 *
 * A CSS clip-path referencing url(#id) needs the shape to exist in the
 * document, and bounding-box units are what let one definition fit every photo
 * whatever its size. Zero-sized rather than display:none, which would stop some
 * engines resolving the reference.
 */
function OyuClipDefs() {
  return (
    <svg width={0} height={0} aria-hidden focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <clipPath id={OYU_CLIP_ID} clipPathUnits="objectBoundingBox">
          <path d={OYU_CLIP_PATH} />
        </clipPath>
      </defs>
    </svg>
  );
}

function animClass(cfg?: AnimationConfig): string {
  if (!cfg || cfg.type === 'none') return '';
  switch (cfg.type) {
    case 'fade': return 'canvas-anim canvas-anim-fade';
    case 'fadeUp': return 'canvas-anim canvas-anim-fade-up';
    case 'fadeDown': return 'canvas-anim canvas-anim-fade-down';
    case 'zoomIn': return 'canvas-anim canvas-anim-zoom-in';
    case 'slideLeft': return 'canvas-anim canvas-anim-slide-left';
    case 'slideRight': return 'canvas-anim canvas-anim-slide-right';
    case 'flip': return 'canvas-anim canvas-anim-flip';
    case 'revealUp': return 'canvas-anim canvas-anim-reveal-up';
    case 'letters': return 'canvas-anim canvas-anim-letters';
    case 'kenBurns': return 'canvas-anim canvas-anim-ken-burns';
    case 'draw': return 'canvas-anim canvas-anim-draw';
    default: return '';
  }
}

function idleClass(cfg?: IdleMotionConfig): string {
  if (!cfg) return '';
  switch (cfg.type) {
    case 'spin': return 'canvas-idle canvas-idle-spin';
    case 'float': return 'canvas-idle canvas-idle-float';
    case 'sway': return 'canvas-idle canvas-idle-sway';
    case 'pulse': return 'canvas-idle canvas-idle-pulse';
    default: return '';
  }
}

/**
 * Every font family referenced anywhere in a document.
 *
 * Element types disagree on the property name — most use `fontFamily`, but
 * `couple-names` uses `font` — so both are collected. Missing one of them
 * means the most prominent text on the page (the names) loads no webfont.
 */
function collectDocumentFonts(doc: InvitationCanvasDocument): FontFamily[] {
  const out: FontFamily[] = [];
  for (const el of doc.elements) {
    const a = (el as { fontFamily?: FontFamily }).fontFamily;
    const b = (el as { font?: FontFamily }).font;
    if (a) out.push(a);
    if (b) out.push(b);
  }
  return out;
}

function elementStyle(el: CanvasElement, mode: 'editor' | 'guest'): CSSProperties {
  // Pinned elements (floating music toggle, "write a wish" button) leave the
  // document flow on the guest page and stick to a viewport corner. In the
  // editor they stay at their authored x/y so the host can still select and
  // move them on the canvas — a `position: fixed` element inside the zoomed,
  // scrolled editor stage would escape the stage entirely.
  if (el.pinned) {
    const { corner, offsetX, offsetY } = el.pinned;
    const [vertical, horizontal] = corner.split('-') as ['top' | 'bottom', 'left' | 'right'];
    return {
      // Guest: fixed to the viewport, so it stays reachable while scrolling.
      // Editor: anchored to the same corner of the *stage* instead. It must
      // appear where the guest will see it — showing it at its raw x/y made
      // the control look like a stray block dropped mid-page and invited the
      // host to drag it somewhere that would have no effect. `fixed` cannot be
      // used here because the editor stage is scaled and scrolled, and a fixed
      // child would escape it entirely.
      position: mode === 'guest' ? 'fixed' : 'absolute',
      [vertical]: `${offsetY}px`,
      // The design is a fixed-width card centred in the viewport (see
      // CanvasGuestPage's `max-w-[600px] mx-auto`); on a wide desktop window
      // that leaves real empty margin on both sides, and on a phone — where
      // almost every guest actually opens the invitation — the card fills the
      // viewport and there is none. A plain `${offsetX}px` sat flush against
      // the card either way, right on top of the artwork's own edge decor.
      // `vw` scales the gap with how much room there actually is: on a ~375px
      // phone the vw term is a couple of px and `max()` falls back to the
      // authored offset (hugging the corner, same as before); on a desktop
      // window it grows past the card's margin and the button clears it,
      // without ever measuring the card's rendered width in JS.
      [horizontal]: mode === 'guest' ? `max(${offsetX}px, 3.4vw)` : `${offsetX}px`,
      width: typeof el.h === 'number' ? undefined : 'auto',
      ...(typeof el.h === 'number' ? { height: `${el.h}px` } : {}),
      zIndex: el.zIndex,
      opacity: el.hidden ? 0 : undefined,
      pointerEvents: el.hidden ? 'none' : undefined,
    } as CSSProperties;
  }

  const left = `${el.x}%`;
  const top = `${el.y}px`;
  const w = `${el.w}%`;
  const hPx = typeof el.h === 'number' ? `${el.h}px` : undefined;
  const rotate = el.rotation ? `rotate(${el.rotation}deg)` : undefined;
  // translate3d(0,0,0) forces a GPU compositing layer for this element so
  // rotation/animation don't repaint the rest of the canvas.
  const gpuLayer = 'translate3d(0,0,0)';
  return {
    position: 'absolute',
    left,
    top,
    width: w,
    ...(hPx ? { height: hPx } : { height: 'auto' }),
    transform: rotate ? `${gpuLayer} ${rotate}` : gpuLayer,
    transformOrigin: 'center center',
    zIndex: el.zIndex,
    opacity: el.hidden ? 0 : undefined,
    pointerEvents: el.hidden ? 'none' : undefined,
    // animation variables
    ['--anim-duration' as string]: el.animation ? `${el.animation.duration}s` : undefined,
    ['--anim-delay' as string]: el.animation ? `${el.animation.delay}s` : undefined,
    ['--anim-ease' as string]: el.animation ? el.animation.easing : undefined,
  } as CSSProperties;
}

export const CanvasRenderer = forwardRef<HTMLDivElement, CanvasRendererProps>(function CanvasRenderer(props, forwardedRef) {
  const {
    document: doc,
    mode = 'guest',
    selectedId = null,
    onSelect,
    renderEditorShell,
    forceAnimations,
    shareUrl,
    slug,
    locale = 'ru',
    guestToken = null,
    openRsvp = true,
    className,
    fullAccess = false,
    editingTextId = null,
    onStartTextEdit,
    onStopTextEdit,
    onTextChange,
    onTextPatch,
    editingTrigger = 'single',
    onElementPositionChange,
    onElementResize,
    onElementRotate,
    onElementDragEnd,
  } = props;

  // Canvas width for coordinate conversion in drag/resize.
  const canvasWidth = doc.width;

  // Load every webfont the document asks for, in one request.
  //
  // Without this the guest page renders the whole invitation in fallback
  // faces: nothing on the guest path ever triggered a Google Fonts request,
  // so a template designed in Forum + Pacifico arrived as Georgia + generic
  // cursive. Only the self-hosted KZ families happened to work, because they
  // come from the global stylesheet rather than from here.
  useEffect(() => {
    ensureDocumentFonts(collectDocumentFonts(doc));
  }, [doc]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2026-07-30 PRODUCT MODEL ENFORCEMENT (PRODUCT_MODEL_AND_RULES.md)
  // fullAccess === true  (from paid Template.priceKzt order)  ⇒  CLEAN PAGE
  //   • no watermark
  //   • no upsell
  //   • all elements fully functional for guest
  // This renderer is ONLY reached for canvas documents.
  // Legacy watermark / paywall logic lives exclusively in section-engine paths.
  // If fullAccess, the parent already decided "pay once = full".
  // Adding any watermark here for fullAccess would violate the sacred rule.
  // ═══════════════════════════════════════════════════════════════════════════
  if (fullAccess && mode === 'guest') {
    // explicit marker so future readers / agents cannot accidentally add paid-watermark
    // console.debug is stripped in prod; this is documentation
    // eslint-disable-next-line no-console
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // console.debug('[canvas] rendering fullAccess clean guest page');
    }
  }

  const stageRef = useRef<HTMLDivElement | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);

  // Guest animation observer (20% visibility threshold).
  useEffect(() => {
    if (mode !== 'guest') return;
    if (forceAnimations) return;
    const root = stageRef.current;
    if (!root) return;

    // Cleanup previous
    ioRef.current?.disconnect();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      // threshold 0, not 0.2.
      //
      // 0.2 asks for a fifth of the element's own area, which is a bad fit for
      // what this observer does: a section eyebrow is 20px tall and a hero
      // photograph is 800px, and "a fifth of it" means something completely
      // different for each. Worse, an entrance animation's held first frame can
      // shrink the measured rect (revealUp clips itself), and any threshold
      // above 0 then refuses to fire at all — which is exactly how every
      // section eyebrow ended up permanently invisible. Firing as soon as any
      // part of the element enters is both what an entrance wants and the only
      // value that cannot deadlock.
      { threshold: 0, rootMargin: '0px 0px -8% 0px' }
    );
    root.querySelectorAll<HTMLElement>('.canvas-anim').forEach((el) => io.observe(el));
    ioRef.current = io;
    return () => io.disconnect();
  }, [mode, forceAnimations, doc]);

  /**
   * Parallax.
   *
   * Elements carrying `parallax` are offset against the page's scroll, which
   * is what separates a background from the text sitting on it — a flat page
   * where every layer moves at exactly one speed is the main reason our
   * invitations read as a document rather than as a card.
   *
   * Written to a CSS variable rather than to `transform` directly, because the
   * element's transform already carries its rotation and GPU-layer hint;
   * `translate` is a separate property and composites independently.
   * Guest mode only, and skipped entirely under prefers-reduced-motion.
   */
  useEffect(() => {
    if (mode !== 'guest') return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = stageRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));
    if (nodes.length === 0) return;

    /*
     * Each element's untransformed centre, in page coordinates, measured once.
     *
     * Measuring `getBoundingClientRect()` on every scroll looks like the
     * obvious implementation and is wrong: the rect already includes the
     * translate this effect applied a frame earlier, so each pass computes its
     * offset from its own previous output. The result is a feedback loop that
     * settles at a fixed point instead of tracking the scroll, and the fixed
     * point can sit hundreds of pixels away from where the element was
     * authored — a section background ends up detached from the content it is
     * supposed to sit behind. The baseline has to come from a measurement taken
     * with the transform cleared.
     */
    const measure = () => {
      const scrollY = window.scrollY;
      return nodes.map((node) => {
        node.style.setProperty('--parallax-y', '0px');
        const rect = node.getBoundingClientRect();
        return {
          node,
          factor: Number(node.dataset.parallax || 0),
          centre: rect.top + scrollY + rect.height / 2,
        };
      });
    };
    let tracked = measure();

    let frame = 0;
    const apply = () => {
      frame = 0;
      const viewportH = window.innerHeight;
      const viewportCentre = window.scrollY + viewportH / 2;
      for (const { node, factor, centre } of tracked) {
        if (!factor) continue;
        // Zero as the element passes the middle of the screen, so it sits
        // exactly where it was authored while it is being looked at.
        const delta = centre - viewportCentre;
        /*
         * Clamped to one viewport's worth of travel.
         *
         * Unclamped, `delta` grows with the distance to the element, so a
         * background four thousand pixels down the page starts life displaced
         * by four hundred — far outside the section it belongs to, leaving a
         * bare strip where its own artwork should be. One screen of travel is
         * more than the effect ever needs, and the ground elements carry
         * enough overhang to cover it.
         */
        const limit = viewportH * factor;
        const offset = Math.max(-limit, Math.min(limit, -delta * factor));
        node.style.setProperty('--parallax-y', `${offset.toFixed(1)}px`);
      }
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };
    // A resize relayouts the page, so the baselines have to be taken again.
    const onResize = () => {
      tracked = measure();
      apply();
    };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [mode, doc]);

  // Preview animations in editor: toggle .is-preview class on all anim elements.
  useEffect(() => {
    if (!forceAnimations || !stageRef.current) return;
    const nodes = stageRef.current.querySelectorAll<HTMLElement>('.canvas-anim');
    nodes.forEach((el) => {
      el.classList.remove('is-preview');
      // reflow to restart animation
      void el.offsetWidth;
      el.classList.add('is-preview');
    });
  }, [forceAnimations]);

  // Compute a sensible document height if it's auto.
  const autoHeight = Math.max(
    800,
    doc.elements.reduce((max, el) => {
      const approxH = typeof el.h === 'number' ? el.h : 60;
      return Math.max(max, el.y + approxH + 40);
    }, 0)
  );

  const bgStyle = bgToCss(doc);

  return (
    <div
      ref={(node) => {
        stageRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      className={cn(
        // `isolate` confines every element's z-index (schema allows up to
        // 10000, and pinned chrome like the music toggle sits at ~9990) to a
        // stacking context scoped to the stage. Without it, on any editor
        // viewport wide enough that the mobile `transform: scale(...)` isn't
        // applied (so nothing else here creates that context), those z-index
        // values compared directly against the fixed bottom dock's z-index:54
        // and routinely won — a template's countdown, calendar or a CTA
        // button would render on top of the toolbar instead of behind it.
        'relative isolate select-none',
        // Guests see the page crop — a full-bleed ornament must be cut at the
        // edge. The editor must not: clipping here also clipped the selection
        // outline and resize handles of anything reaching past the canvas, so
        // an element could be selected and dragged while its controls were
        // invisible.
        mode === 'editor' ? 'overflow-visible' : 'overflow-hidden',
        className
      )}
      style={{
        width: '100%',
        maxWidth: doc.width,
        margin: '0 auto',
        // An explicit `doc.height` (every template-kit document sets one) used
        // to win outright over the computed extent, so it went stale the
        // moment an element was added below it: absolutely-positioned
        // children never grow their parent's box, so the stage stayed at its
        // original height and new elements landed in space that didn't
        // exist — visibly cut off below the template, or entirely below the
        // fold since the scroll region ended before them. Taking the larger
        // of the two keeps an explicit height as a floor without ever letting
        // it clip real content.
        minHeight: Math.max(doc.height ?? 0, autoHeight),
        ...bgStyle,
      }}
      data-canvas-width={doc.width}
      data-canvas-export-preview="true"
      onClick={(e) => {
        if (mode === 'editor' && onSelect) {
          // Click on stage background clears selection.
          if (e.target === e.currentTarget) onSelect(null);
        }
      }}
    >
      <OyuClipDefs />
      {(() => {
        // Only the first of each type gets the anchor id — two rsvp-form/map
        // elements sharing one id would be invalid HTML, and a template only
        // ever has at most one of either in practice.
        const firstRsvpId = mode === 'guest' ? doc.elements.find((e) => e.type === 'rsvp-form' && !e.hidden)?.id : undefined;
        const firstMapId = mode === 'guest' ? doc.elements.find((e) => e.type === 'map' && !e.hidden)?.id : undefined;
        return doc.elements.map((el) => {
        // Hidden elements must not reach the guest DOM at all — they can
        // carry sensitive content (RSVP inputs, gift/Kaspi payment details).
        // In the editor we still mount them at opacity:0 so the host can see
        // a ghost of what they're toggling and click it back on.
        if (el.hidden && mode === 'guest') return null;
        const inner = renderElement(el, {
          mode,
          shareUrl,
          slug,
          locale,
          guestToken,
          openRsvp,
          width: doc.width,
          editing: editingTextId === el.id,
          selected: selectedId === el.id,
          editingTrigger,
          onStartEdit: onStartTextEdit ? () => onStartTextEdit(el.id) : undefined,
          onStopEdit: onStopTextEdit ? () => onStopTextEdit(el.id) : undefined,
          onTextChange: onTextChange ? (patch) => onTextChange(el.id, patch) : undefined,
          onTextPatch: onTextPatch ? (patch) => onTextPatch(el.id, patch) : undefined,
          stopNativeActions: mode === 'editor' && !!onSelect,
        });
        // Entrance animations are a guest-page effect. In the editor the
        // observer that reveals them never runs, so applying the classes there
        // pins every animated element at opacity 0 — the host opens the editor
        // and sees only the background, with the text present in the DOM but
        // invisible. `forceAnimations` is the explicit "preview" toggle.
        const animated = mode === 'guest' || forceAnimations;
        const cls = cn(
          animated ? animClass(el.animation) : undefined,
          selectedId === el.id ? 'canvas-selected' : undefined
        );
        // Idle motion wraps the element's own content, never the editor shell:
        // the shell carries the drag/resize handles, and a handle that slowly
        // rotates away from the thing it resizes is unusable. In the editor the
        // loop is off entirely for the same reason — you cannot place an
        // element that will not hold still.
        const idleCls = animated ? idleClass(el.idle) : '';
        const content = idleCls ? (
          <div
            className={idleCls}
            style={{ ['--idle-duration' as string]: `${el.idle!.duration}s` }}
          >
            {inner}
          </div>
        ) : (
          inner
        );
        const shell = renderEditorShell
          ? renderEditorShell(el, content, canvasWidth, {
              onPositionChange: onElementPositionChange!,
              onResize: onElementResize!,
              onRotate: onElementRotate!,
              onDragEnd: onElementDragEnd!,
            })
          : content;
        const clickable = mode === 'editor' && onSelect;
        // Button elements can point at '#rsvp' / '#map' (see
        // ButtonElementView.computeHref). Those anchors only resolve if
        // *something* on the page actually carries the id — give the guest's
        // rsvp-form/map element one so "Подтвердить" / "Открыть карту"
        // buttons actually scroll to them instead of doing nothing.
        const anchorId = el.id === firstRsvpId ? 'rsvp' : el.id === firstMapId ? 'map' : undefined;
        return (
          <div
            key={el.id}
            id={anchorId}
            className={cn(cls, el.parallax ? 'canvas-parallax' : undefined)}
            // Only the guest page scrolls, so only there does parallax mean
            // anything; in the editor the offset would just misreport where an
            // element actually sits.
            data-parallax={mode === 'guest' && el.parallax ? el.parallax : undefined}
            style={anchorId ? { ...elementStyle(el, mode), scrollMarginTop: 24 } : elementStyle(el, mode)}
            onClick={(e) => {
              if (clickable) {
                e.stopPropagation();
                onSelect!(el.id);
              }
            }}
          >
            {shell}
          </div>
        );
        });
      })()}
    </div>
  );
});

export function bgToCss(doc: InvitationCanvasDocument): CSSProperties {
  const b = doc.background;
  if (b.type === 'solid') {
    return { background: b.color || '#fff8f1' };
  }
  if (b.type === 'gradient' && b.gradient) {
    const { from, to, angle = 180 } = b.gradient;
    return { background: `linear-gradient(${angle}deg, ${from}, ${to})` };
  }
  if (b.type === 'image' && b.imageSrc) {
    return {
      backgroundImage: `url(${b.imageSrc})`,
      backgroundSize: b.backgroundSize || 'cover',
      backgroundPosition: 'center',
      backgroundColor: b.color,
    };
  }
  if (b.type === 'video') {
    return { background: b.color || '#000' };
  }
  return { background: '#fff8f1' };
}

function renderElement(
  el: CanvasElement,
  ctx: {
    mode: RendererMode;
    shareUrl?: string;
    locale?: 'ru' | 'kz';
    guestToken?: string | null;
    openRsvp?: boolean;
    slug?: string;
    width: number;
    editing?: boolean;
    selected?: boolean;
    editingTrigger?: 'single' | 'double';
    onStartEdit?: () => void;
    onStopEdit?: () => void;
    onTextChange?: (patch: { text: string }) => void;
    onTextPatch?: (patch: Partial<import('@/lib/canvas/types').TextProps>) => void;
    /** In editor mode: prevent button/native element actions from firing
     *  before the element is selected. */
    stopNativeActions?: boolean;
  }
): React.ReactNode {
  // In editor mode, route text/heading through the editable surface.
  // Guest mode always uses the read-only view.
  if (ctx.mode === 'editor' && ctx.onStartEdit && ctx.onStopEdit && ctx.onTextChange && ctx.onTextPatch) {
    if (el.type === 'text' || el.type === 'heading') {
      return (
        <EditableTextView
          el={el as TextElement | HeadingElement}
          editing={!!ctx.editing}
          selected={!!ctx.selected}
          editingTrigger={ctx.editingTrigger ?? 'single'}
          onStartEdit={ctx.onStartEdit}
          onStopEdit={ctx.onStopEdit}
          onChange={ctx.onTextChange}
          onPatch={ctx.onTextPatch}
        />
      );
    }
  }
  switch (el.type) {
    case 'text': return <TextElementView el={el} />;
    case 'heading': return <HeadingElementView el={el} />;
    case 'image': return <ImageElementView el={el} />;
    case 'button': return <ButtonElementView el={el} locale={ctx.locale} shareUrl={ctx.shareUrl} stopPropagation={ctx.stopNativeActions} />;
    case 'shape': return <ShapeElementView el={el} />;
    case 'divider': return <DividerElementView el={el} />;
    case 'couple-names': return <CoupleNamesElementView el={el} />;
    case 'countdown': return <CountdownElementView el={el} />;
    case 'calendar': return <CalendarElementView el={el} locale={ctx.locale} />;
    case 'rsvp-form': return <RsvpFormElementView el={el} shareUrl={ctx.shareUrl} mode={ctx.mode} locale={ctx.locale} guestToken={ctx.guestToken} openRsvp={ctx.openRsvp} />;
    case 'wishes': return <WishesElementView el={el} shareUrl={ctx.shareUrl} slug={ctx.slug} mode={ctx.mode} locale={ctx.locale} />;
    case 'map': return <MapElementView el={el} locale={ctx.locale} />;
    case 'music': return <MusicPlayerElementView el={el} locale={ctx.locale} />;
    case 'gift': return <GiftBlockElementView el={el} mode={ctx.mode} />;
    case 'qr': return <QrCodeElementView el={el} shareUrl={ctx.shareUrl} mode={ctx.mode} />;
    case 'program': return <ProgramElementView el={el} />;
    case 'ornament': return <OrnamentElementView el={el} />;
    case 'lottie': return <LottieElementView el={el} />;
    case 'video-bg': return <VideoBgElementView el={el} />;
    default:
      return null;
  }
}
