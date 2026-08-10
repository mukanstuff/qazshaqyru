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
  CanvasElement,
  InvitationCanvasDocument,
  TextElement,
  HeadingElement,
} from '@/lib/canvas/types';
import { TextElementView } from './elements/TextElementView';
import { HeadingElementView } from './elements/HeadingElementView';
import { EditableTextView } from './elements/EditableTextView';
import { ImageElementView } from './elements/ImageElementView';
import { ButtonElementView } from './elements/ButtonElementView';
import { ShapeElementView } from './elements/ShapeElementView';
import { DividerElementView } from './elements/DividerElementView';
import { CoupleNamesElementView } from './elements/CoupleNamesElementView';
import { CountdownElementView } from './elements/CountdownElementView';
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
  /** In editor mode, wraps each element with selection chrome. */
  renderEditorShell?: (el: CanvasElement, children: React.ReactNode) => React.ReactNode;
  /** If true, plays animations immediately (used by editor "preview"). */
  forceAnimations?: boolean;
  /** Invitation URL for QR / calendar / share elements. */
  shareUrl?: string;
  /** Locale for labels (ru | kz). */
  locale?: 'ru' | 'kz';
  /** Extra className for the stage. */
  className?: string;

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
    default: return '';
  }
}

function elementStyle(el: CanvasElement, width: number): CSSProperties {
  const pxPerPercent = width / 100;
  const left = `${el.x}%`;
  const top = `${el.y}px`;
  const w = `${el.w}%`;
  const hPx = typeof el.h === 'number' ? `${el.h}px` : undefined;
  const rotate = el.rotation ? `rotate(${el.rotation}deg)` : undefined;
  return {
    position: 'absolute',
    left,
    top,
    width: w,
    ...(hPx ? { height: hPx } : { height: 'auto' }),
    transform: rotate ? translateHack(el.w, pxPerPercent) + ' ' + rotate : translateHack(el.w, pxPerPercent),
    transformOrigin: 'center center',
    zIndex: el.zIndex,
    opacity: el.hidden ? 0 : undefined,
    pointerEvents: el.hidden ? 'none' : undefined,
    // animation variables
    ['--anim-duration' as string]: el.animation ? `${el.animation.duration}s` : undefined,
    ['--anim-delay' as string]: el.animation ? `${el.animation.delay}s` : undefined,
  } as CSSProperties;
}

/**
 * Translate element -50% on X axis? No — x is left-edge percent. Keep left-aligned.
 * The helper is just a no-op transform placeholder to compose with rotation.
 */
function translateHack(_w: number, _pxPct: number): string {
  return 'translate3d(0,0,0)';
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
    locale = 'ru',
    className,
    fullAccess = false,
    editingTextId = null,
    onStartTextEdit,
    onStopTextEdit,
    onTextChange,
    onTextPatch,
  } = props;

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
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );
    root.querySelectorAll<HTMLElement>('.canvas-anim').forEach((el) => io.observe(el));
    ioRef.current = io;
    return () => io.disconnect();
  }, [mode, forceAnimations, doc]);

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
      className={cn('relative overflow-hidden select-none', className)}
      style={{
        width: '100%',
        maxWidth: doc.width,
        margin: '0 auto',
        minHeight: doc.height ?? autoHeight,
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
      {doc.elements.map((el) => {
        const inner = renderElement(el, {
          mode,
          shareUrl,
          locale,
          width: doc.width,
          editing: editingTextId === el.id,
          selected: selectedId === el.id,
          onStartEdit: onStartTextEdit ? () => onStartTextEdit(el.id) : undefined,
          onStopEdit: onStopTextEdit ? () => onStopTextEdit(el.id) : undefined,
          onTextChange: onTextChange ? (patch) => onTextChange(el.id, patch) : undefined,
          onTextPatch: onTextPatch ? (patch) => onTextPatch(el.id, patch) : undefined,
        });
        const cls = cn(
          animClass(el.animation),
          selectedId === el.id ? 'canvas-selected' : undefined
        );
        const shell = renderEditorShell ? renderEditorShell(el, inner) : inner;
        const clickable = mode === 'editor' && onSelect;
        return (
          <div
            key={el.id}
            className={cls}
            style={elementStyle(el, doc.width)}
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
      })}
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
    width: number;
    editing?: boolean;
    selected?: boolean;
    onStartEdit?: () => void;
    onStopEdit?: () => void;
    onTextChange?: (patch: { text: string }) => void;
    onTextPatch?: (patch: Partial<import('@/lib/canvas/types').TextProps>) => void;
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
    case 'button': return <ButtonElementView el={el} locale={ctx.locale} shareUrl={ctx.shareUrl} />;
    case 'shape': return <ShapeElementView el={el} />;
    case 'divider': return <DividerElementView el={el} />;
    case 'couple-names': return <CoupleNamesElementView el={el} />;
    case 'countdown': return <CountdownElementView el={el} />;
    case 'rsvp-form': return <RsvpFormElementView el={el} shareUrl={ctx.shareUrl} mode={ctx.mode} locale={ctx.locale} />;
    case 'wishes': return <WishesElementView el={el} shareUrl={ctx.shareUrl} mode={ctx.mode} />;
    case 'map': return <MapElementView el={el} />;
    case 'music': return <MusicPlayerElementView el={el} />;
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
