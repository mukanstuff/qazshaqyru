/**
 * Snap-to-grid and snap-to-guides utility for CanvasEditor.
 * Calculates nearest edge/center alignments with other elements.
 */
import type { CanvasElement } from './types';

export interface GuideLine {
  type: 'vertical' | 'horizontal';
  pos: number; // percent for vertical, px for horizontal
}

export interface SnapResult {
  x: number;
  y: number;
  guides: GuideLine[];
}

export function snapElementPosition(
  id: string,
  targetX: number,
  targetY: number,
  targetW: number,
  targetH: number,
  elements: CanvasElement[],
  options: {
    snapGrid?: boolean;
    gridStepX?: number; // percent
    gridStepY?: number; // px
    thresholdX?: number; // percent
    thresholdY?: number; // px
  } = {}
): SnapResult {
  const thresholdX = options.thresholdX ?? 1.5;
  const thresholdY = options.thresholdY ?? 6;
  const guides: GuideLine[] = [];

  let newX = targetX;
  let newY = targetY;

  // 1. Grid snap first if enabled
  if (options.snapGrid) {
    const stepX = options.gridStepX ?? 5;
    const stepY = options.gridStepY ?? 20;
    newX = Math.round(targetX / stepX) * stepX;
    newY = Math.round(targetY / stepY) * stepY;
  }

  // 2. Element alignment guides
  const targetCenterX = targetX + targetW / 2;
  const targetRightX = targetX + targetW;

  for (const el of elements) {
    if (el.id === id || el.hidden) continue;

    const elCenterX = el.x + el.w / 2;
    const elRightX = el.x + el.w;
    const elHeight = typeof el.h === 'number' ? el.h : 40;
    const elCenterY = el.y + elHeight / 2;

    // Check vertical alignment (x coordinate percent)
    // Left edge alignment
    if (Math.abs(targetX - el.x) < thresholdX) {
      newX = el.x;
      guides.push({ type: 'vertical', pos: el.x });
    }
    // Center alignment
    else if (Math.abs(targetCenterX - elCenterX) < thresholdX) {
      newX = elCenterX - targetW / 2;
      guides.push({ type: 'vertical', pos: elCenterX });
    }
    // Right edge alignment
    else if (Math.abs(targetRightX - elRightX) < thresholdX) {
      newX = elRightX - targetW;
      guides.push({ type: 'vertical', pos: elRightX });
    }

    // Check horizontal alignment (y coordinate px)
    if (Math.abs(targetY - el.y) < thresholdY) {
      newY = el.y;
      guides.push({ type: 'horizontal', pos: el.y });
    } else if (Math.abs(targetY - elCenterY) < thresholdY) {
      newY = elCenterY;
      guides.push({ type: 'horizontal', pos: elCenterY });
    }
  }

  return {
    x: Math.max(0, Math.min(100 - targetW, newX)),
    y: Math.max(-200, newY),
    guides,
  };
}
