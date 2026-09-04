import { z } from 'zod';

/**
 * Shared geometry + vocabulary for the seating plan.
 *
 * This module exists because the three places that touched seating each
 * invented their own rules: the (now removed) editor created tables with
 * `shape: 'rect'`, the guest-facing view tested for `shape === 'square'` and
 * therefore drew every rectangular table as a circle, and the hall's
 * coordinate space (800×520) was hardcoded in the view with nothing on the
 * write side agreeing to it. Owner editor, guest view and API now all import
 * these constants.
 */

/**
 * Logical hall coordinate space. Table x/y/w/h are stored in these units and
 * rendered scaled-to-fit, so a plan laid out on a laptop looks identical on a
 * phone and never depends on the device the owner happened to use.
 */
export const HALL_W = 1200;
export const HALL_H = 800;

/** Shapes that seat guests. */
export const TABLE_SHAPES = ['round', 'rect'] as const;
export type SeatableShape = (typeof TABLE_SHAPES)[number];

/**
 * Fixtures of the hall that are not tables.
 *
 * A plan of nothing but circles tells a guest which table they are at and
 * nothing about where that is — the competitor draws the stage, the dance
 * floor and the entrance, and that is what turns a diagram into directions.
 *
 * They are stored as ordinary SeatingTable rows with capacity 0 rather than in
 * a table of their own: everything a fixture needs — a name, a position, a
 * size, drag, persistence, ownership checks — already exists here, and a
 * parallel model would have duplicated all of it to hold four extra words.
 */
export const HALL_OBJECT_SHAPES = ['stage', 'dancefloor', 'bar', 'entrance'] as const;
export type HallObjectShape = (typeof HALL_OBJECT_SHAPES)[number];

export const SEATING_SHAPES = [...TABLE_SHAPES, ...HALL_OBJECT_SHAPES] as const;
export type TableShape = (typeof SEATING_SHAPES)[number];
export const tableShapeSchema = z.enum(SEATING_SHAPES);

export function isHallObject(shape: TableShape): shape is HallObjectShape {
  return (HALL_OBJECT_SHAPES as readonly string[]).includes(shape);
}

/** Legacy rows may carry 'square' (guest view) or anything else (unvalidated column). */
export function normalizeTableShape(value: string | null | undefined): TableShape {
  if (value === 'rect' || value === 'square') return 'rect';
  if (value && (HALL_OBJECT_SHAPES as readonly string[]).includes(value)) {
    return value as HallObjectShape;
  }
  return 'round';
}

/**
 * Default footprint per fixture, in hall units. A stage is wide and shallow, a
 * dance floor is a square in the middle of the room, an entrance is a doorway.
 */
export const HALL_OBJECT_SIZE: Record<HallObjectShape, { w: number; h: number }> = {
  stage: { w: 380, h: 130 },
  dancefloor: { w: 300, h: 240 },
  bar: { w: 240, h: 90 },
  // TABLE_MIN_SIZE is the floor for every row, so a doorway is 80 deep rather
  // than the 70 it would like to be.
  entrance: { w: 150, h: 80 },
};

export const TABLE_MIN_SIZE = 80;
export const TABLE_MAX_SIZE = 320;
export const TABLE_MIN_CAPACITY = 1;
export const TABLE_MAX_CAPACITY = 50;

export const DEFAULT_TABLE = {
  w: 140,
  h: 140,
  capacity: 10,
  shape: 'round' as TableShape,
  color: '#16a34a',
};

/** A stage spans a wall; a table never should. */
export const HALL_OBJECT_MAX_SIZE = 700;

export function clampTableSize(
  value: number | null | undefined,
  fallback: number,
  max: number = TABLE_MAX_SIZE
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(TABLE_MIN_SIZE, Math.round(value)));
}

/** Keep a table fully inside the hall, whatever the client sent. */
export function clampTablePosition(
  x: number | null | undefined,
  y: number | null | undefined,
  w: number,
  h: number
): { x: number; y: number } {
  const safeX = typeof x === 'number' && Number.isFinite(x) ? x : 0;
  const safeY = typeof y === 'number' && Number.isFinite(y) ? y : 0;
  return {
    x: Math.round(Math.min(Math.max(safeX, 0), Math.max(HALL_W - w, 0))),
    y: Math.round(Math.min(Math.max(safeY, 0), Math.max(HALL_H - h, 0))),
  };
}

/**
 * Where to drop a newly created table so it doesn't land on top of an
 * existing one. Walks a grid and returns the first free-ish slot.
 */
export function nextFreeTableSlot(
  existing: Array<{ x?: number | null; y?: number | null; w?: number | null; h?: number | null }>,
  w = DEFAULT_TABLE.w,
  h = DEFAULT_TABLE.h
): { x: number; y: number } {
  const gapX = w + 60;
  const gapY = h + 70;
  const cols = Math.max(1, Math.floor((HALL_W - 60) / gapX));
  const rows = Math.max(1, Math.floor((HALL_H - 60) / gapY));

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = 60 + col * gapX;
      const y = 60 + row * gapY;
      const taken = existing.some((t) => {
        const tx = t.x ?? 0;
        const ty = t.y ?? 0;
        const tw = t.w ?? DEFAULT_TABLE.w;
        const th = t.h ?? DEFAULT_TABLE.h;
        return Math.abs(tx - x) < tw * 0.9 && Math.abs(ty - y) < th * 0.9;
      });
      if (!taken) return clampTablePosition(x, y, w, h);
    }
  }

  // Hall is dense — stagger slightly so the new table is still grabbable.
  const offset = (existing.length % 8) * 18;
  return clampTablePosition(60 + offset, 60 + offset, w, h);
}
