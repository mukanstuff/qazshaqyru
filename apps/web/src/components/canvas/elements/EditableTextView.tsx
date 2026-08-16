'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import type { TextElement, HeadingElement, TextProps } from '@/lib/canvas/types';
import { textStyle, loadAndResolveFont } from './TextElementView';
import { TextInlineToolbar } from './TextInlineToolbar';

interface CommonProps {
  el: TextElement | HeadingElement;
  editing: boolean;
  selected: boolean;
  /**
   * 2026-08-14: how the user enters text-edit mode.
   *   'single' (default) — one tap/click → edit (guest-friendly, no selection step).
   *   'double'            — double-click required (admin / power user).
   * Both modes still rely on blur / Esc / Enter to commit.
   */
  editingTrigger?: 'single' | 'double';
  onStartEdit: () => void;
  onStopEdit: () => void;
  onChange: (patch: { text: string }) => void;
  /** Patch non-text properties (font, color, weight, alignment, etc.). */
  onPatch: (patch: Partial<TextProps>) => void;
}

type Props = CommonProps;

/**
 * EditableTextView — the in-place editable surface used in editor mode.
 *
 * Behavior:
 *  - Single click while selected: no-op (parent handles selection).
 *  - Double click on the text: enter edit mode, focus the contenteditable
 *    element, place caret at end.
 *  - While editing: typed text updates the underlying element live. Enter
 *    inserts <br> for multiline (`h === 'auto'`); otherwise Enter commits.
 *    Escape always commits. Blur commits.
 *  - While focused: floating toolbar (TextInlineToolbar) appears above the
 *    element with B / I / КАПС / size ± / alignment / colour controls.
 */
export function EditableTextView(props: Props) {
  const { el, editing, selected, editingTrigger = 'single', onStartEdit, onStopEdit, onChange, onPatch } = props;
  const ref = useRef<HTMLElement | null>(null);
  const isHeading = el.type === 'heading';
  const Tag = (isHeading ? (el.as || 'h1') : 'p') as 'p' | 'h1' | 'h2' | 'h3';

  // Trigger lazy-load of the chosen Google Font when this element mounts
  // or when the family changes.
  loadAndResolveFont(el.fontFamily);

  // Sync external text into DOM only when NOT focused (typing is the
  // source of truth while editing).
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (document.activeElement === node) return;
    if (node.innerText !== el.text) {
      node.innerText = el.text;
    }
  }, [el.text]);

  // Focus + caret-to-end on entering edit mode.
  useEffect(() => {
    if (!editing) return;
    const node = ref.current;
    if (!node) return;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editing]);

  const commit = useCallback(() => {
    const node = ref.current;
    if (!node) {
      onStopEdit();
      return;
    }
    const next = node.innerText.replace(/\u00A0/g, ' ');
    if (next !== el.text) onChange({ text: next });
    onStopEdit();
  }, [el.text, onChange, onStopEdit]);

  const isMultiline = el.h === 'auto' || el.h === undefined;
  const baseStyle = useMemo<CSSProperties>(() => textStyle(el), [el]);

  // Hover affordance: text-cursor on hover in editor mode (unless the
  // SelectionChrome already shows a move cursor via the chrome wrapper).
  const hoverCursor: CSSProperties = {
    cursor: editing ? 'text' : selected ? undefined : 'text',
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (editing) return;
    e.stopPropagation();
    e.preventDefault();
    onStartEdit();
  };

  // 2026-08-14: in single-trigger mode, one tap/click enters edit mode.
  // Stop the click from also driving SelectionChrome's drag-start in admin mode.
  const handleSingleClickForEdit = (e: React.MouseEvent) => {
    if (editing) return;
    if (editingTrigger !== 'single') return;
    e.stopPropagation();
    e.preventDefault();
    onStartEdit();
  };

  const handleBlur = () => {
    if (!editing) return;
    commit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      commit();
      return;
    }
    if (e.key === 'Enter') {
      // Multiline: Enter = newline. Shift+Enter / Ctrl+Enter = commit.
      // Single-line: Enter = commit.
      const shouldCommit = !isMultiline || e.shiftKey || e.ctrlKey || e.metaKey;
      if (shouldCommit) {
        e.preventDefault();
        commit();
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const node = e.currentTarget;
    onChange({ text: node.innerText.replace(/\u00A0/g, ' ') });
  };

  return (
    <>
      <Tag
        ref={ref as React.RefObject<HTMLParagraphElement & HTMLHeadingElement>}
        style={{ ...baseStyle, ...hoverCursor, outline: 'none' }}
        contentEditable={editing}
        suppressContentEditableWarning
        spellCheck={false}
        data-text-element={el.id}
        data-text-editing={editing ? 'true' : undefined}
        onDoubleClick={editingTrigger === 'double' ? handleDoubleClick : undefined}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onClick={(e) => {
          // Always stop click bubble when in edit-mode (would otherwise start a drag).
          if (editing) {
            e.stopPropagation();
            return;
          }
          // In single-trigger mode, a single tap on the text is what enters edit.
          handleSingleClickForEdit(e);
        }}
        onMouseDown={(e) => {
          if (editing) e.stopPropagation();
        }}
      >
        {el.text}
      </Tag>
      {editing && <TextInlineToolbar anchorRef={ref} el={el} onUpdate={onPatch} />}
    </>
  );
}
