'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { SeatingTableDto } from '@/lib/guests/seating';
import { usePointerSession } from '@/components/canvas/hooks/usePointerSession';
import { useI18n } from '@/i18n';
import { HALL_W, HALL_H, isHallObject, type TableShape } from '@/lib/guests/seating-layout';
import { ZOOM_STEPS, nextZoom } from '@/components/seating/SeatingZoom';

interface Props {
  tables: SeatingTableDto[];
  selectedTableId: string | null;
  onSelect: (id: string | null) => void;
  onMoveLocal: (id: string, x: number, y: number) => void;
  onMoveCommit: (id: string, x: number, y: number) => void;
  seatsLabel: (table: SeatingTableDto) => string;
}

/**
 * Where each chair sits around a table, as percentages of the table's own box.
 *
 * The plan used to draw a coloured blob with "10 орынның 4-і" written on it,
 * which is a number, not a picture: the owner could not see at a glance that
 * one table was half empty and the next was full. Chairs are what a seating
 * chart is made of, so they are drawn.
 *
 * Round tables get an evenly spaced ring; rectangular ones get two rows along
 * the long edges, which is how a banquet table is actually laid.
 */
function seatPositions(shape: TableShape, capacity: number): { left: number; top: number }[] {
  const n = Math.max(0, Math.min(capacity, 40));
  if (n === 0) return [];

  if (shape === 'rect') {
    const top = Math.ceil(n / 2);
    const bottom = n - top;
    const row = (count: number, y: number) =>
      Array.from({ length: count }, (_, i) => ({
        left: ((i + 1) / (count + 1)) * 100,
        top: y,
      }));
    return [...row(top, -9), ...row(bottom, 109)];
  }

  // Slightly outside the table edge, starting at the top and going clockwise.
  const radius = 58;
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      left: 50 + radius * Math.cos(angle),
      top: 50 + radius * Math.sin(angle),
    };
  });
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  scale: number;
  w: number;
  h: number;
  moved: boolean;
}

/**
 * The hall floor. Tables are positioned in the shared HALL_W × HALL_H logical
 * space and the whole surface is scaled to whatever width it gets, so a plan
 * laid out on a laptop is identical on a phone.
 */
export function SeatingHall({
  tables,
  selectedTableId,
  onSelect,
  onMoveLocal,
  onMoveCommit,
  seatsLabel,
}: Props) {
  const { t } = useI18n();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const session = usePointerSession<DragState>();
  const [zoom, setZoom] = useState(1);

  /*
   * Zooming has to keep looking at the same part of the hall.
   *
   * Growing the surface without touching scroll position pins the top-left
   * corner, so at 3× the owner is thrown to the entrance of the hall no matter
   * which table they were working on. The fraction of the plan at the centre of
   * the viewport is captured before the change and restored after layout.
   */
  const anchorRef = useRef<{ x: number; y: number } | null>(null);

  const changeZoom = useCallback((direction: 1 | -1) => {
    setZoom((current) => {
      const vp = viewportRef.current;
      if (vp) {
        anchorRef.current = {
          x: (vp.scrollLeft + vp.clientWidth / 2) / Math.max(vp.scrollWidth, 1),
          y: (vp.scrollTop + vp.clientHeight / 2) / Math.max(vp.scrollHeight, 1),
        };
      }
      return nextZoom(current, direction);
    });
  }, []);

  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const anchor = anchorRef.current;
    if (!vp || !anchor) return;
    anchorRef.current = null;
    vp.scrollLeft = anchor.x * vp.scrollWidth - vp.clientWidth / 2;
    vp.scrollTop = anchor.y * vp.scrollHeight - vp.clientHeight / 2;
  }, [zoom]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, table: SeatingTableDto) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const surface = surfaceRef.current;
      if (!surface) return;
      // Logical units per CSS pixel — the surface is responsive, so this is
      // measured per gesture rather than assumed.
      const scale = surface.getBoundingClientRect().width / HALL_W;

      onSelect(table.id);

      session.begin(
        e,
        {
          id: table.id,
          startX: e.clientX,
          startY: e.clientY,
          originX: table.x,
          originY: table.y,
          scale,
          w: table.w,
          h: table.h,
          moved: false,
        },
        {
          onMove: (state, ev) => {
            const dx = (ev.clientX - state.startX) / state.scale;
            const dy = (ev.clientY - state.startY) / state.scale;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) state.moved = true;
            const x = Math.min(Math.max(state.originX + dx, 0), HALL_W - state.w);
            const y = Math.min(Math.max(state.originY + dy, 0), HALL_H - state.h);
            onMoveLocal(state.id, Math.round(x), Math.round(y));
          },
          onEnd: (state, ev) => {
            if (!state.moved) return;
            const dx = (ev.clientX - state.startX) / state.scale;
            const dy = (ev.clientY - state.startY) / state.scale;
            const x = Math.min(Math.max(state.originX + dx, 0), HALL_W - state.w);
            const y = Math.min(Math.max(state.originY + dy, 0), HALL_H - state.h);
            onMoveCommit(state.id, Math.round(x), Math.round(y));
          },
        }
      );
    },
    [onMoveCommit, onMoveLocal, onSelect, session]
  );

  const canZoomIn = zoom < ZOOM_STEPS[ZOOM_STEPS.length - 1];
  const canZoomOut = zoom > ZOOM_STEPS[0];

  // Fixtures are the room; tables stand in it. Painting them first puts them
  // behind, so a table dragged over the dance floor stays legible.
  const ordered = useMemo(
    () =>
      [...tables].sort(
        (a, b) => Number(isHallObject(b.shape)) - Number(isHallObject(a.shape))
      ),
    [tables]
  );

  return (
    <div className="seating-hall-frame">
      <div className="seating-hall-zoom">
        <button
          type="button"
          onClick={() => changeZoom(-1)}
          disabled={!canZoomOut}
          aria-label={t('seating.zoom.out')}
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <span aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => changeZoom(1)}
          disabled={!canZoomIn}
          aria-label={t('seating.zoom.in')}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="seating-hall-viewport" ref={viewportRef}>
        <div
          ref={surfaceRef}
          className="seating-hall"
          style={{
            width: `${zoom * 100}%`,
            aspectRatio: `${HALL_W} / ${HALL_H}`,
          }}
          onPointerDown={(e) => {
            // Tapping empty floor clears the selection.
            if (e.target === surfaceRef.current) onSelect(null);
          }}
        >
          {ordered.map((table) => {
            const isSelected = table.id === selectedTableId;
            const over = table.seatsTaken > table.capacity;
            const fixture = isHallObject(table.shape);
            const seats = fixture ? [] : seatPositions(table.shape, table.capacity);
            return (
              <div
                key={table.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={table.name}
                onPointerDown={(e) => handlePointerDown(e, table)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(table.id);
                  }
                }}
                className={[
                  'seating-table',
                  fixture ? `seating-object seating-object--${table.shape}` : '',
                  table.shape === 'round' ? 'seating-table--round' : 'seating-table--rect',
                  isSelected ? 'is-selected' : '',
                  over ? 'is-over' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  left: `${(table.x / HALL_W) * 100}%`,
                  top: `${(table.y / HALL_H) * 100}%`,
                  width: `${(table.w / HALL_W) * 100}%`,
                  height: `${(table.h / HALL_H) * 100}%`,
                  backgroundColor: fixture ? undefined : table.tableColor,
                  transform: table.rotation ? `rotate(${table.rotation}deg)` : undefined,
                }}
              >
                {seats.map((seat, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className={`seating-seat${i < table.seatsTaken ? ' is-taken' : ''}`}
                    style={{ left: `${seat.left}%`, top: `${seat.top}%` }}
                  />
                ))}
                <span className="seating-table-name">{table.name}</span>
                {fixture ? null : (
                  <span className="seating-table-seats">{seatsLabel(table)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
