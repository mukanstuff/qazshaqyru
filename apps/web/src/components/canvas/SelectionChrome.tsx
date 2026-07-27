import type { CSSProperties } from 'react';
import type { CanvasElement } from '@/lib/canvas/types';

interface Props {
  el: CanvasElement;
  selected: boolean;
  zoom: number;
  children: React.ReactNode;
  onDragStart: (e: React.PointerEvent) => void;
}

const HANDLER = 8;

/**
 * Selection chrome: brand-burgundy outline + gold accent, square corner
 * handlers and a round rotate handle above. Visible only when selected.
 *
 * The chrome wraps the rendered element; interactions are on the wrapper
 * so that clicking/dragging anywhere on the element starts a move.
 */
export function SelectionChrome({ el, selected, zoom, children, onDragStart }: Props) {
  if (!selected) return <>{children}</>;

  const outlineStyle: CSSProperties = {
    outline: `2px solid #6b1d3a`,
    outlineOffset: 1,
    boxShadow: '0 0 0 1px rgba(201,169,97,0.9) inset',
  };

  const handlerStyle = (pos: string): CSSProperties => {
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
    if (v === 'middle') base.top = '50%';
    if (h === 'left') base.left = -(HANDLER / 2) / zoom;
    if (h === 'right') base.right = -(HANDLER / 2) / zoom;
    if (h === 'center') base.left = '50%';
    if (v === 'middle') base.transform = 'translateY(-50%)';
    if (h === 'center') base.transform = (base.transform || '') + ' translateX(-50%)';
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

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', cursor: 'move', ...outlineStyle }}
      onPointerDown={(e) => {
        if (el.locked) return;
        onDragStart(e);
      }}
      data-selected-id={el.id}
    >
      {children}
      {/* handlers */}
      <div style={handlerStyle('top-left')} data-resize="nw" />
      <div style={handlerStyle('top-right')} data-resize="ne" />
      <div style={handlerStyle('bottom-left')} data-resize="sw" />
      <div style={handlerStyle('bottom-right')} data-resize="se" />
      <div style={connector} />
      <div style={rotateHandle} data-rotate="true" title="Повернуть" />
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
