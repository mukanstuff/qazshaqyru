import { type CSSProperties, type PointerEvent, type ReactNode, useCallback } from 'react';
import { Lock, RotateCw, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useDrag } from './hooks/useDrag';
import { useResize, type ResizeHandle } from './hooks/useResize';
import { useRotate } from './hooks/useRotate';
import type { CanvasElement } from '@/lib/canvas/types';

interface Props {
  el: CanvasElement;
  /** Canvas width in pixels — used to position the rotate handle above the element. */
  canvasWidth: number;
  /** Canvas stage element — resize/drag/rotate math reads its bounding box. */
  stageRef: React.RefObject<HTMLElement>;
  selected: boolean;
  /** True while this element's text is being edited in place. */
  editing?: boolean;
  children: ReactNode;
  onDelete?: () => void;
  /** Opens the properties sheet for this element — a deliberate second
   * action, not automatic on select (see onTap). */
  onEditProperties?: () => void;
  highlighted?: boolean;
  onTap?: () => void;
  onPositionChange?: (pos: { x?: number; y?: number }) => void;
  onResize?: (dim: { w?: number; h?: number | 'auto' }) => void;
  onRotate?: (rotation: number) => void;
  /** Called on drag/resize/rotate session end — used to commit undo history. */
  onDragEnd?: () => void;
  onContextMenu?: (e: { clientX: number; clientY: number }) => void;
  locale?: 'ru' | 'kz';
}

const HANDLE_IDS: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  w: 'w-resize',   e: 'e-resize',
  sw: 'sw-resize', s: 's-resize', se: 'se-resize',
};

/**
 * Selection chrome: outline, delete button, 8 resize handles, rotate handle.
 * Drag/resize/rotate math is delegated to the shared, tested useDrag/useResize/
 * useRotate hooks (components/canvas/hooks/) instead of duplicating pointer
 * math here — this component used to hand-roll its own copy of the same
 * calculations, untested and un-throttled.
 */
export function SelectionChrome({
  el,
  canvasWidth,
  stageRef,
  selected,
  editing = false,
  children,
  onDelete,
  onEditProperties,
  highlighted,
  onTap,
  onPositionChange,
  onResize,
  onRotate,
  onDragEnd,
  onContextMenu,
  locale = 'ru',
}: Props) {
  const isActive = selected || highlighted;
  const t = locale === 'ru'
    ? { rotate: 'Повернуть', delete: 'Удалить', properties: 'Свойства', locked: 'Заблокировано', auto: 'авто' }
    : { rotate: 'Бұру', delete: 'Жою', properties: 'Қасиеттері', locked: 'Бекітілген', auto: 'авто' };

  const { beginDrag } = useDrag({
    stageRef,
    scale: 1,
    docWidth: el.w,
    onMove: (_id, x, y) => onPositionChange?.({ x, y }),
    onEnd: () => onDragEnd?.(),
    getInitial: () => ({ x: el.x, y: el.y, w: el.w }),
  });

  const { beginResize } = useResize({
    stageRef,
    scale: 1,
    docWidth: el.w,
    onResize: (_id, x, y, w, h) => {
      onPositionChange?.({ x, y });
      onResize?.({ w, h });
    },
    onEnd: () => onDragEnd?.(),
    getInitial: () => ({ x: el.x, y: el.y, w: el.w, h: el.h }),
  });

  const { beginRotate } = useRotate({
    stageRef,
    onRotate: (_id, angle) => onRotate?.(angle),
    onEnd: () => onDragEnd?.(),
    getInitial: () => ({ rotation: el.rotation }),
  });

  const handleDragPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (target.closest('[data-chrome-handle]')) return;
      if (target.closest('[data-element-delete]')) return;
      beginDrag(el.id, e);
    },
    [beginDrag, el.id],
  );

  const handleResizePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>, handle: ResizeHandle) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      beginResize(el.id, handle, e);
    },
    [beginResize, el.id],
  );

  const handleRotatePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      beginRotate(el.id, e);
    },
    [beginRotate, el.id],
  );

  const cx = el.x + el.w / 2;
  const cy = el.y + (typeof el.h === 'number' ? el.h / 2 : 0);

  /*
   * `locked` used to be a badge and nothing more: the padlock rendered, and the
   * element still dragged, resized, rotated and deleted exactly as before. Only
   * `pinned` actually held anything in place. A lock that does not lock is
   * worse than no lock, because the host trusts it and then loses the layout.
   */
  const immovable = el.pinned || el.locked;

  const handles: Array<{ id: ResizeHandle; left: string; top: string }> = selected && !immovable
    ? HANDLE_IDS.map((id) => ({
        id,
        left: id === 'nw' || id === 'w' || id === 'sw' ? '0%' : id === 'n' || id === 's' ? '50%' : '100%',
        top: id === 'nw' || id === 'n' || id === 'ne' ? '0%' : id === 'w' || id === 'e' ? '50%' : '100%',
      }))
    : [];

  const outlineStyle: CSSProperties = isActive
    ? { outline: '2px solid var(--ed-accent)', outlineOffset: 2 }
    : {};

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', ...outlineStyle }}
      data-selected-id={el.id}
      data-element-type={el.type}
      data-highlighted={highlighted ? 'on' : 'off'}
      data-selected={selected ? 'on' : 'off'}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-element-delete]')) return;
        if (target.closest('[data-element-edit]')) return;
        if (target.closest('[data-chrome-handle]')) return;
        onTap?.();
      }}
      onDoubleClick={(e) => {
        // Text and headings edit in place, so their own view handles the
        // double-click. Everything else had no response at all — double-
        // clicking the couple's names, the countdown or the calendar simply
        // did nothing, even though each has a properties panel with the fields
        // to change. Route those to that panel instead of leaving the gesture
        // dead.
        if (el.type === 'text' || el.type === 'heading') return;
        if (!onEditProperties) return;
        const target = e.target as HTMLElement;
        if (target.closest('[data-chrome-handle]')) return;
        e.stopPropagation();
        onTap?.();
        onEditProperties();
      }}
      onContextMenu={(e) => {
        if (!onContextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        onTap?.();
        onContextMenu({ clientX: e.clientX, clientY: e.clientY });
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          touchAction: editing ? 'auto' : 'none',
          userSelect: editing ? 'text' : undefined,
          cursor: editing ? 'text' : undefined,
        }}
        onPointerDown={selected && !immovable && !editing ? handleDragPointerDown : undefined}
        className={selected ? 'canvas-element-drag-surface' : undefined}
      >
        {children}
      </div>

      {selected && onRotate && !immovable && (
        <div
          data-chrome-rotate-zone
          className="canvas-rotate-zone"
          // Positioned relative to the element, not to the document. The inline
          // style used to compute `left` and `top` from `el.x` / `el.y` —
          // absolute canvas coordinates — while sitting inside a wrapper that
          // is already positioned over the element. The handle therefore landed
          // far from the element it rotates, and because the rotation angle is
          // measured from the element's true centre, grabbing a handle that sits
          // near that centre made a tiny pointer movement swing the element
          // wildly: the handle appeared to fly faster than the cursor.
          // `left: 50%` + `translateX(-50%)` already come from the stylesheet.
          style={{ top: -46 }}
          onPointerDown={handleRotatePointerDown}
        >
          {/* Handle first, line second. The column previously ran line-then-
              handle, which put the grip flat against the element's top edge and
              left the leader line sticking up into empty space above it. The
              grip belongs at the far tip, with the line tethering it back down
              to the element. */}
          <div data-chrome-handle="rotate" className="canvas-rotate-handle" title={t.rotate} aria-label={t.rotate}>
            <RotateCw size={12} aria-hidden="true" />
          </div>
          <div className="canvas-rotate-line" />
        </div>
      )}

      {handles.map((h) => (
        <div
          key={h.id}
          data-chrome-handle={h.id}
          className="canvas-resize-handle"
          style={{ left: h.left, top: h.top, cursor: HANDLE_CURSORS[h.id] }}
          onPointerDown={(e) => handleResizePointerDown(e, h.id)}
        />
      ))}

      {selected && onDelete && !el.locked && (
        <button
          type="button"
          data-element-delete
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="canvas-selection-delete"
          title={t.delete}
          aria-label={t.delete}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      )}

      {selected && onEditProperties && (
        <button
          type="button"
          data-element-edit
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEditProperties();
          }}
          className="canvas-selection-edit"
          title={t.properties}
          aria-label={t.properties}
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
        </button>
      )}

      {/*
        Measurements of what is selected, in the pixels the guest will see —
        `el.w` is a percentage of the document width, which is not a number
        anyone can match two photos by.
      */}
      {selected && (
        <span className="canvas-size-badge">
          {Math.round((el.w / 100) * canvasWidth)}
          {' × '}
          {typeof el.h === 'number' ? Math.round(el.h) : t.auto}
        </span>
      )}

      {el.locked && (
        <span className="canvas-selection-lock" aria-label={t.locked}>
          <Lock size={11} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
