/**
 * Pure immutable mutations on a CanvasDocument. These are used both by
 * the editor reducer (so undo/redo just snapshots documents) and by tests.
 *
 * All functions return a NEW document (structural sharing where possible).
 */
import { nanoid } from 'nanoid';
import type {
  BaseElement,
  CanvasBackground,
  CanvasElement,
  CanvasElementType,
  InvitationCanvasDocument,
} from './types';
import { elementDefaultSize, CANVAS_VERSION } from './types';

export function createEmptyDocument(
  width: number = 390,
  bg?: Partial<CanvasBackground>
): InvitationCanvasDocument {
  return {
    version: CANVAS_VERSION,
    width,
    background: {
      type: 'solid',
      color: '#fff8f1',
      ...bg,
    },
    elements: [],
    editorMetadata: { lastModifiedAt: new Date().toISOString() },
  };
}

function nextZIndex(elements: CanvasElement[]): number {
  if (elements.length === 0) return 1;
  return Math.max(...elements.map((e) => e.zIndex)) + 1;
}

function stampModified(doc: InvitationCanvasDocument): InvitationCanvasDocument {
  return {
    ...doc,
    editorMetadata: {
      ...(doc.editorMetadata || {}),
      lastModifiedAt: new Date().toISOString(),
    },
  };
}

/**
 * Add a new element of given type at the given canvas-local percent position.
 */
export function addElement(
  doc: InvitationCanvasDocument,
  type: CanvasElementType,
  partial: Partial<CanvasElement> = {}
): InvitationCanvasDocument {
  const defaults = elementDefaultSize(type);
  const id = partial.id || nanoid(10);
  const base: BaseElement = {
    id,
    type,
    x: partial.x ?? (100 - defaults.w) / 2,
    y: partial.y ?? 120,
    w: partial.w ?? defaults.w,
    h: partial.h ?? defaults.h,
    rotation: 0,
    zIndex: nextZIndex(doc.elements),
    locked: false,
    hidden: false,
  };

  // Per-type defaults for text/content properties.
  let el: CanvasElement;
  switch (type) {
    case 'text':
      el = {
        ...base,
        type: 'text',
        text: (partial as { text?: string }).text ?? 'Текст',
        fontFamily: 'Montserrat',
        fontSize: 16,
        fontWeight: 400,
        color: '#1a1a1a',
        textAlign: 'center',
        lineHeight: 1.4,
        letterSpacing: 0,
      } as CanvasElement;
      break;
    case 'heading':
      el = {
        ...base,
        type: 'heading',
        as: 'h1',
        text: (partial as { text?: string }).text ?? 'Заголовок',
        fontFamily: 'Cormorant',
        fontSize: 36,
        fontWeight: 600,
        color: '#6b1d3a',
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: 0.5,
      } as CanvasElement;
      break;
    case 'image':
      el = {
        ...base,
        type: 'image',
        src: (partial as { src?: string }).src || '/assets/placeholder.svg',
        objectFit: 'cover',
        borderRadius: 12,
      } as CanvasElement;
      break;
    case 'button':
      el = {
        ...base,
        type: 'button',
        label: 'Подробнее',
        action: { kind: 'rsvp' },
        bgColor: '#6b1d3a',
        textColor: '#ffffff',
        fontSize: 16,
        fontFamily: 'Montserrat',
        fontWeight: 600,
        borderRadius: 999,
      } as CanvasElement;
      break;
    case 'shape':
      el = {
        ...base,
        type: 'shape',
        shape: 'rect',
        fill: '#c9a961',
        strokeWidth: 0,
        opacity: 1,
      } as CanvasElement;
      break;
    case 'divider':
      el = {
        ...base,
        type: 'divider',
        color: '#c9a961',
        thickness: 2,
        style: 'solid',
      } as CanvasElement;
      break;
    case 'couple-names':
      el = {
        ...base,
        type: 'couple-names',
        first: 'Айбек',
        second: 'Айдана',
        connector: '&',
        font: 'Cormorant',
        fontSize: 56,
        color: '#6b1d3a',
      } as CanvasElement;
      break;
    case 'countdown':
      el = {
        ...base,
        type: 'countdown',
        fontFamily: 'Unbounded',
        fontSize: 22,
        color: '#6b1d3a',
        showLabels: true,
      } as CanvasElement;
      break;
    case 'rsvp-form':
      el = {
        ...base,
        type: 'rsvp-form',
        fontFamily: 'Montserrat',
        bgColor: '#ffffff',
        textColor: '#1a1a1a',
        accentColor: '#6b1d3a',
        askPlusOne: true,
        askDietary: true,
        askChildren: true,
      } as CanvasElement;
      break;
    case 'wishes':
      el = {
        ...base,
        type: 'wishes',
        fontFamily: 'Montserrat',
        bgColor: '#ffffff',
        textColor: '#1a1a1a',
        accentColor: '#6b1d3a',
        reactions: ['❤️', '🙏', '🥂', '👏'],
        allowAnonymous: true,
      } as CanvasElement;
      break;
    case 'program':
      el = {
        ...base,
        type: 'program',
        items: [],
        fontFamily: 'Montserrat',
        bgColor: '#ffffff',
        textColor: '#1a1a1a',
        accentColor: '#c9a961',
      } as CanvasElement;
      break;
    case 'map':
      el = {
        ...base,
        type: 'map',
        zoom: 14,
        showStaticOnly: false,
      } as CanvasElement;
      break;
    case 'music':
      el = {
        ...base,
        type: 'music',
        autoPlayMuted: true,
        accentColor: '#6b1d3a',
      } as CanvasElement;
      break;
    case 'gift':
      el = {
        ...base,
        type: 'gift',
        showDonors: true,
        accentColor: '#c9a961',
      } as CanvasElement;
      break;
    case 'qr':
      el = {
        ...base,
        type: 'qr',
        size: 180,
        fgColor: '#1a1a1a',
        bgColor: '#ffffff',
        errorCorrection: 'M',
      } as CanvasElement;
      break;
    case 'lottie':
      el = {
        ...base,
        type: 'lottie',
        src: '/assets/lottie/rings.json',
        loop: true,
        autoplay: true,
        speed: 1,
      } as CanvasElement;
      break;
    case 'video-bg':
      el = {
        ...base,
        type: 'video-bg',
        src: '',
        opacity: 0.6,
      } as CanvasElement;
      break;
    case 'ornament':
      el = {
        ...base,
        type: 'ornament',
        ornamentId: 'oy-1',
        flipX: false,
        flipY: false,
      } as CanvasElement;
      break;
    default:
      throw new Error(`Unknown element type: ${type}`);
  }

  const merged = { ...el, ...partial, id } as CanvasElement;
  return stampModified({ ...doc, elements: [...doc.elements, merged] });
}

export function updateElement(
  doc: InvitationCanvasDocument,
  id: string,
  patch: Partial<CanvasElement>
): InvitationCanvasDocument {
  const elements = doc.elements.map((el) => (el.id === id ? ({ ...el, ...patch } as CanvasElement) : el));
  return stampModified({ ...doc, elements });
}

export function updateElementPosition(
  doc: InvitationCanvasDocument,
  id: string,
  pos: { x?: number; y?: number; w?: number; h?: number | 'auto'; rotation?: number }
): InvitationCanvasDocument {
  return updateElement(doc, id, pos);
}

export function deleteElement(doc: InvitationCanvasDocument, id: string): InvitationCanvasDocument {
  return stampModified({ ...doc, elements: doc.elements.filter((e) => e.id !== id) });
}

export function duplicateElement(doc: InvitationCanvasDocument, id: string): InvitationCanvasDocument {
  const src = doc.elements.find((e) => e.id === id);
  if (!src) return doc;
  const clone: CanvasElement = {
    ...src,
    id: nanoid(10),
    x: Math.min(95, src.x + 3),
    y: src.y + 20,
    zIndex: nextZIndex(doc.elements),
  } as CanvasElement;
  return stampModified({ ...doc, elements: [...doc.elements, clone] });
}

export function moveElement(
  doc: InvitationCanvasDocument,
  id: string,
  direction: 'front' | 'back' | 'forward' | 'backward'
): InvitationCanvasDocument {
  const idx = doc.elements.findIndex((e) => e.id === id);
  if (idx === -1) return doc;
  const els = [...doc.elements].sort((a, b) => a.zIndex - b.zIndex);
  const sortedIdx = els.findIndex((e) => e.id === id);
  const el = els[sortedIdx];
  switch (direction) {
    case 'front':
      el.zIndex = nextZIndex(doc.elements);
      break;
    case 'back':
      el.zIndex = Math.min(...doc.elements.map((e) => e.zIndex)) - 1;
      break;
    case 'forward': {
      const above = els.slice(sortedIdx + 1).find((e) => !e.hidden);
      if (above) {
        const t = el.zIndex;
        el.zIndex = above.zIndex;
        above.zIndex = t;
      }
      break;
    }
    case 'backward': {
      const below = [...els].slice(0, sortedIdx).reverse().find((e) => !e.hidden);
      if (below) {
        const t = el.zIndex;
        el.zIndex = below.zIndex;
        below.zIndex = t;
      }
      break;
    }
  }
  return stampModified({ ...doc, elements: els });
}

export function setBackground(
  doc: InvitationCanvasDocument,
  bg: Partial<CanvasBackground>
): InvitationCanvasDocument {
  return stampModified({ ...doc, background: { ...doc.background, ...bg } });
}

/**
 * Re-normalize z-indices to a contiguous 1..N sequence. Useful after
 * repeated forward/back operations.
 */
export function normalizeZIndices(doc: InvitationCanvasDocument): InvitationCanvasDocument {
  const sorted = [...doc.elements].sort((a, b) => a.zIndex - b.zIndex);
  const elements = sorted.map((el, i) => ({ ...el, zIndex: i + 1 } as CanvasElement));
  return { ...doc, elements };
}

/**
 * Deep-clone a document (for history snapshots). Uses structured clone
 * when available; falls back to JSON roundtrip.
 */
export function cloneDocument(doc: InvitationCanvasDocument): InvitationCanvasDocument {
  if (typeof structuredClone === 'function') return structuredClone(doc);
  return JSON.parse(JSON.stringify(doc));
}

/**
 * Resize a rect-style element while preserving aspect ratio when `lockRatio`
 * is set AND the original w/h are both numeric. The new values are passed as
 * the "desired" w/h in percent / px; this clamps them and enforces aspect.
 */
export function resizeElement(
  doc: InvitationCanvasDocument,
  id: string,
  newW: number,
  newH: number | 'auto',
  _handle: 'se' | 'sw' | 'ne' | 'nw' | 'n' | 's' | 'e' | 'w' = 'se',
  options: { lockRatio?: boolean; origW?: number; origH?: number } = {}
): InvitationCanvasDocument {
  const el = doc.elements.find((e) => e.id === id);
  if (!el) return doc;
  let w = Math.max(5, Math.min(100, newW));
  let h: number | 'auto' = newH;
  if (options.lockRatio && typeof el.h === 'number' && typeof newH === 'number' && options.origW && options.origH) {
    const ratio = options.origH / options.origW;
    h = Math.max(5, w * (doc.width / 100) * ratio) / (doc.width / 100);
    // convert px h... since h is px we compute differently
    h = Math.max(5, (w / 100) * doc.width * ratio);
  } else if (typeof h === 'number') {
    h = Math.max(5, h);
  }
  return updateElement(doc, id, { w, h });
}

/**
 * History stack implementation for undo/redo. Keeps up to `maxSize`
 * document snapshots.
 */
export class HistoryStack {
  private past: InvitationCanvasDocument[] = [];
  private future: InvitationCanvasDocument[] = [];

  constructor(private current: InvitationCanvasDocument, private maxSize = 100) {}

  get present(): InvitationCanvasDocument {
    return this.current;
  }

  /** Call this BEFORE applying a change; it snapshots the current state. */
  pushSnapshot(next: InvitationCanvasDocument): void {
    this.past.push(cloneDocument(this.current));
    if (this.past.length > this.maxSize) this.past.shift();
    this.future = [];
    this.current = next;
  }

  undo(): InvitationCanvasDocument | null {
    const prev = this.past.pop();
    if (!prev) return null;
    this.future.push(cloneDocument(this.current));
    this.current = prev;
    return this.current;
  }

  redo(): InvitationCanvasDocument | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(cloneDocument(this.current));
    this.current = next;
    return this.current;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }
}
