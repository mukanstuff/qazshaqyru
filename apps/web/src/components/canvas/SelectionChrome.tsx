import type { CSSProperties, ReactNode } from 'react';
import type { CanvasElement } from '@/lib/canvas/types';

interface Props {
  el: CanvasElement;
  selected: boolean;
  children: ReactNode;
  /** Called when user taps the trash button. */
  onDelete?: () => void;
  /**
   * 2026-08-17 (pilot-2): highlight pulse mode (sections island active).
   * When true, the outline becomes an emerald pulse regardless of selection.
   */
  highlighted?: boolean;
  /** When the user taps the element itself (not the chrome controls). */
  onTap?: () => void;
}

/**
 * 2026-08-17 (pilot-2): minimal selection chrome.
 *
 *  - Outline + delete only.
 *  - NO drag handles (per scope: editing pre-made templates, no drag).
 *  - NO resize/rotate handles (same reason).
 *  - Highlight mode pulses the outline when this element matches the
 *    active bottom-island section.
 *
 * Selection outline uses the landing-page brand accent (`#16a34a`,
 * emerald-600) so the editor chrome shares its visual identity with
 * the marketing surface — see --ed-accent in canvas-editor.css.
 */
export function SelectionChrome({ el, selected, children, onDelete, highlighted, onTap }: Props) {
  const isActive = selected || highlighted;

  const outlineStyle: CSSProperties = isActive
    ? {
        outline: `2px solid var(--ed-accent)`,
        outlineOffset: 2,
      }
    : {};

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', ...outlineStyle }}
      data-selected-id={el.id}
      data-element-type={el.type}
      data-highlighted={highlighted ? 'on' : 'off'}
      data-selected={selected ? 'on' : 'off'}
      onClick={(e) => {
        // Don't double-fire when the click is on the trash button.
        const target = e.target as HTMLElement;
        if (target.closest('[data-element-delete]')) return;
        onTap?.();
      }}
    >
      {children}

      {selected && onDelete && (
        <button
          type="button"
          data-element-delete
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="canvas-selection-delete"
          title="Удалить"
          aria-label="Удалить"
        >
          🗑
        </button>
      )}

      {el.locked && (
        <span
          className="canvas-selection-lock"
          aria-label="Заблокировано"
        >
          🔒
        </span>
      )}
    </div>
  );
}
