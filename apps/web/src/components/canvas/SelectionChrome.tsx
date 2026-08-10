import type { CSSProperties, ReactNode } from 'react';
import type { CanvasElement } from '@/lib/canvas/types';
import { MiniToolbar } from './MiniToolbar';

interface Props {
  el: CanvasElement;
  selected: boolean;
  zoom: number;
  children: ReactNode;
  onDragStart: (e: React.PointerEvent) => void;
  /** ResizeHandle now includes side handles: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' */
  onResizeStart?: (e: React.PointerEvent, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w') => void;
  onRotateStart?: (e: React.PointerEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Mini-toolbar callbacks — pass when element is selected */
  onToolbarColorChange?: (color: string) => void;
  onToolbarFontSizeChange?: (size: number) => void;
  onToolbarDuplicate?: () => void;
  onToolbarDelete?: () => void;
  onToolbarUndo?: () => void;
  onToolbarRedo?: () => void;
}

const HANDLER = 8;

/**
 * Selection chrome: brand-burgundy outline + gold accent, square corner
 * handlers and a round rotate handle above. Visible only when selected.
 *
 * Includes:
 * - 4 corner resize handles (nw/ne/sw/se)
 * - 4 side resize handles (n/e/s/w)
 * - rotate handle with connector
 * - floating mini-toolbar (above the element)
 */
export function SelectionChrome({
  el,
  selected,
  zoom,
  children,
  onDragStart,
  onResizeStart,
  onRotateStart,
  onContextMenu,
  onToolbarColorChange,
  onToolbarFontSizeChange,
  onToolbarDuplicate,
  onToolbarDelete,
  onToolbarUndo,
  onToolbarRedo,
}: Props) {
  if (!selected) {
    return <div onContextMenu={onContextMenu}>{children}</div>;
  }

  const outlineStyle: CSSProperties = {
    outline: `2px solid #6b1d3a`,
    outlineOffset: 1,
    boxShadow: '0 0 0 1px rgba(201,169,97,0.9) inset',
  };

  const cornerHandlerStyle = (pos: string): CSSProperties => {
    const base: CSSProperties = {
      position: 'absolute',
      width: HANDLER / zoom,
      height: HANDLER / zoom,
      background: '#ffffff',
      border: `1px solid #6b1d3a`,
      borderRadius: 2,
      zIndex: 1000,
    };
    const [v, h] = pos.split('-') as ('top' | 'bottom' | 'middle')[] & ('left' | 'right' | 'center')[];
    if (v === 'top') base.top = -(HANDLER / 2) / zoom;
    if (v === 'bottom') base.bottom = -(HANDLER / 2) / zoom;
    if (h === 'left') base.left = -(HANDLER / 2) / zoom;
    if (h === 'right') base.right = -(HANDLER / 2) / zoom;
    return base;
  };

  const sideHandlerStyle = (pos: 'top' | 'bottom' | 'left' | 'right'): CSSProperties => {
    const isVertical = pos === 'top' || pos === 'bottom';
    const base: CSSProperties = {
      position: 'absolute',
      background: '#ffffff',
      border: `1px solid #6b1d3a`,
      zIndex: 1000,
      cursor: isVertical ? 'ns-resize' : 'ew-resize',
    };
    const side = 6 / zoom;
    if (pos === 'top') {
      base.top = -(side / 2) / zoom;
      base.left = '20%';
      base.width = `calc(60% + ${HANDLER / zoom}px)`;
      base.height = `${side / zoom}px`;
    } else if (pos === 'bottom') {
      base.bottom = -(side / 2) / zoom;
      base.left = '20%';
      base.width = `calc(60% + ${HANDLER / zoom}px)`;
      base.height = `${side / zoom}px`;
    } else if (pos === 'left') {
      base.left = -(side / 2) / zoom;
      base.top = '20%';
      base.height = `calc(60% + ${HANDLER / zoom}px)`;
      base.width = `${side / zoom}px`;
    } else {
      base.right = -(side / 2) / zoom;
      base.top = '20%';
      base.height = `calc(60% + ${HANDLER / zoom}px)`;
      base.width = `${side / zoom}px`;
    }
    return base;
  };

  const rotateHandle: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: -(20 / zoom + 6),
    width: 12 / zoom,
    height: 12 / zoom,
    borderRadius: '50%',
    background: '#c9a961',
    border: `1px solid #6b1d3a`,
    transform: 'translateX(-50%)',
    cursor: 'grab',
    zIndex: 1001,
  };

  const connector: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: -(20 / zoom + 6) + 12 / zoom,
    width: 1 / zoom,
    height: 20 / zoom,
    background: '#c9a961',
    transform: 'translateX(-50%)',
    zIndex: 1000,
  };

  const hasToolbar =
    onToolbarColorChange &&
    onToolbarFontSizeChange &&
    onToolbarDuplicate &&
    onToolbarDelete &&
    onToolbarUndo &&
    onToolbarRedo;

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', cursor: 'move', ...outlineStyle }}
      onPointerDown={(e) => {
        if (el.locked) return;
        // 2026-08-09: skip drag-start when this is the second click of a
        // double-click on the editable text surface. Without this, dragging
        // micro-movement on dblclick would move the element by 0-2px. The
        // SelectionChrome fires before dblclick bubbles up to the text, so
        // we have to filter here.
        if (e.detail >= 2) return;
        onDragStart(e);
      }}
      onContextMenu={onContextMenu}
      data-selected-id={el.id}
    >
      {/* Mini-toolbar floating above */}
      {hasToolbar && (
        <MiniToolbar
          el={el}
          zoom={zoom}
          onColorChange={onToolbarColorChange!}
          onFontSizeChange={onToolbarFontSizeChange!}
          onDuplicate={onToolbarDuplicate!}
          onDelete={onToolbarDelete!}
          onUndo={onToolbarUndo!}
          onRedo={onToolbarRedo!}
        />
      )}

      {children}

      {/* Corner resize handles */}
      <div
        style={{ ...cornerHandlerStyle('top-left'), cursor: 'nwse-resize' }}
        data-resize="nw"
        onPointerDown={(e) => {
          e.stopPropagation();
          if (el.locked) return;
          onResizeStart?.(e, 'nw');
        }}
      />
      <div
        style={{ ...cornerHandlerStyle('top-right'), cursor: 'nesw-resize' }}
        data-resize="ne"
        onPointerDown={(e) => {
          e.stopPropagation();
          if (el.locked) return;
          onResizeStart?.(e, 'ne');
        }}
      />
      <div
        style={{ ...cornerHandlerStyle('bottom-left'), cursor: 'nesw-resize' }}
        data-resize="sw"
        onPointerDown={(e) => {
          e.stopPropagation();
          if (el.locked) return;
          onResizeStart?.(e, 'sw');
        }}
      />
      <div
        style={{ ...cornerHandlerStyle('bottom-right'), cursor: 'nwse-resize' }}
        data-resize="se"
        onPointerDown={(e) => {
          e.stopPropagation();
          if (el.locked) return;
          onResizeStart?.(e, 'se');
        }}
      />

      {/* Side resize handles */}
      <div
        style={sideHandlerStyle('top')}
        data-resize="n"
        onPointerDown={(e) => {
          e.stopPropagation();
          if (el.locked) return;
          onResizeStart?.(e, 'n');
        }}
      />
      <div
        style={sideHandlerStyle('bottom')}
        data-resize="s"
        onPointerDown={(e) => {
          e.stopPropagation();
          if (el.locked) return;
          onResizeStart?.(e, 's');
        }}
      />
      <div
        style={sideHandlerStyle('left')}
        data-resize="w"
        onPointerDown={(e) => {
          e.stopPropagation();
          if (el.locked) return;
          onResizeStart?.(e, 'w');
        }}
      />
      <div
        style={sideHandlerStyle('right')}
        data-resize="e"
        onPointerDown={(e) => {
          e.stopPropagation();
          if (el.locked) return;
          onResizeStart?.(e, 'e');
        }}
      />

      <div style={connector} />
      <div
        style={rotateHandle}
        data-rotate="true"
        title="Повернуть"
        onPointerDown={(e) => {
          e.stopPropagation();
          if (el.locked) return;
          onRotateStart?.(e);
        }}
      />
      {el.locked && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: 10,
            background: '#6b1d3a',
            color: '#fff',
            padding: '1px 4px',
            borderRadius: 2,
          }}
        >
          🔒
        </div>
      )}
    </div>
  );
}
