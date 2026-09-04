// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvitationCanvasDocument, TextElement } from '@/lib/canvas/types';
import { EditableTextView } from '../elements/EditableTextView';
import { fontStack, KAZAKH_INCAPABLE_FAMILIES } from '../elements/fontStack';
import { FONT_OPTIONS } from '../inspector/shared';

Object.assign(globalThis, {
  React,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function render(node: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  return { container, root };
}

const baseText: TextElement = {
  id: 't-1',
  type: 'text',
  x: 10,
  y: 100,
  w: 80,
  h: 'auto',
  rotation: 0,
  zIndex: 1,
  locked: false,
  hidden: false,
  text: 'Hello world',
  fontFamily: 'Montserrat',
  fontSize: 16,
  fontWeight: 400,
  color: '#000000',
  textAlign: 'center',
  lineHeight: 1.4,
  letterSpacing: 0,
};

describe('EditableTextView', () => {
  let roots: Root[];

  beforeEach(() => {
    roots = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    roots.forEach((root) => act(() => root.unmount()));
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders text via TextElementView when not editing', () => {
    const { container, root } = render(
      React.createElement(EditableTextView, {
        el: baseText,
        editing: false,
        selected: false,
        onStartEdit: vi.fn(),
        onStopEdit: vi.fn(),
        onChange: vi.fn(),
        onPatch: vi.fn(),
      }),
    );
    roots.push(root);
    const p = container.querySelector('p');
    expect(p).not.toBeNull();
    expect(p?.textContent).toBe('Hello world');
    expect(p?.getAttribute('contenteditable')).toBe('false');
  });

  it('enters edit mode when editing=true and focuses the element', () => {
    const { container, root } = render(
      React.createElement(EditableTextView, {
        el: baseText,
        editing: true,
        selected: true,
        onStartEdit: vi.fn(),
        onStopEdit: vi.fn(),
        onChange: vi.fn(),
        onPatch: vi.fn(),
      }),
    );
    roots.push(root);
    const p = container.querySelector('p');
    expect(p).not.toBeNull();
    expect(p?.getAttribute('contenteditable')).toBe('true');
    expect(p?.getAttribute('data-text-editing')).toBe('true');
    expect(document.activeElement).toBe(p);
  });

  // The canvas editor mounts this with editingTrigger="double" so a single
  // click selects and drags instead of dropping a caret. The test never passed
  // the prop, so it exercised the 'single' default, where onDoubleClick is not
  // even attached — and had been failing since that default was introduced.
  it('calls onStartEdit when double-clicked', () => {
    const onStartEdit = vi.fn();
    const { container, root } = render(
      React.createElement(EditableTextView, {
        el: baseText,
        editing: false,
        selected: true,
        editingTrigger: 'double' as const,
        onStartEdit,
        onStopEdit: vi.fn(),
        onChange: vi.fn(),
        onPatch: vi.fn(),
      }),
    );
    roots.push(root);
    const p = container.querySelector('p');
    if (!p) throw new Error('missing p');
    act(() => {
      p.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    });
    expect(onStartEdit).toHaveBeenCalledTimes(1);
  });

  it('shows the floating toolbar while editing', () => {
    const { container, root } = render(
      React.createElement(EditableTextView, {
        el: baseText,
        editing: true,
        selected: true,
        onStartEdit: vi.fn(),
        onStopEdit: vi.fn(),
        onChange: vi.fn(),
        onPatch: vi.fn(),
      }),
    );
    roots.push(root);
    const toolbar = document.body.querySelector('[role="toolbar"][aria-label="Форматирование текста"]');
    expect(toolbar).not.toBeNull();
    // Bold + Italic + КАПС + size −/+ + align L/C/R + colour trigger = 9 buttons + 3 dividers
    expect(toolbar?.querySelectorAll('button').length).toBeGreaterThanOrEqual(7);
  });

  it('routes Bold / Italic / КАПС clicks through onPatch', () => {
    const onPatch = vi.fn();
    const { container, root } = render(
      React.createElement(EditableTextView, {
        el: baseText,
        editing: true,
        selected: true,
        onStartEdit: vi.fn(),
        onStopEdit: vi.fn(),
        onChange: vi.fn(),
        onPatch,
      }),
    );
    roots.push(root);
    // The toolbar is portaled into <body> so its `position: fixed` measures
    // against the viewport rather than the transformed canvas element, so it
    // is no longer a descendant of the render container.
    const bold = document.body.querySelector('[title="Жирный"]');
    const italic = document.body.querySelector('[title="Курсив"]');
    if (!bold || !italic) throw new Error('toolbar buttons missing');
    act(() => {
      (bold as HTMLButtonElement).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    act(() => {
      (italic as HTMLButtonElement).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    expect(onPatch).toHaveBeenCalledWith({ fontWeight: 700 });
    expect(onPatch).toHaveBeenCalledWith({ italic: true });
  });
});

describe('fontStack', () => {
  it('returns a stack for every FontFamily token without throwing', () => {
    const families: import('@/lib/canvas/types').FontFamily[] = [
      'Inter', 'Manrope', 'Montserrat', 'Nunito', 'Oswald',
      'Raleway', 'Tenor Sans', 'Unbounded',
      'Comfortaa', 'system', 'Alice',
      'Cormorant', 'Cormorant Garamond',
      'EB Garamond', 'Forum', 'Lora',
      'Merriweather', 'Old Standard TT', 'PT Serif', 'Philosopher',
      'Playfair Display', 'Prata', 'Spectral', 'Vollkorn', 'Yeseva One',
      'Great Vibes', 'Marck', 'Pacifico',
    ];
    for (const f of families) {
      const stack = fontStack(f);
      expect(typeof stack).toBe('string');
      expect(stack.length).toBeGreaterThan(0);
    }
  });

  it('uses the self-hosted KZ prefix for the locally available families', () => {
    expect(fontStack('Montserrat')).toContain('KZ Montserrat');
    expect(fontStack('Cormorant')).toContain('KZ Cormorant');
    expect(fontStack('Cormorant Garamond')).toContain('KZ Cormorant');
  });

  it('quotes Google-family names so the stack is safe with multi-word names', () => {
    expect(fontStack('Old Standard TT')).toContain("'Old Standard TT'");
    expect(fontStack('EB Garamond')).toContain("'EB Garamond'");
    expect(fontStack('Yeseva One')).toContain("'Yeseva One'");
  });

  // Regression guard for the 2026-08-27 Kazakh glyph bug: these six families
  // render Ә Ғ Қ Ң Ө Ұ Ү Һ in a system fallback, producing words that are
  // half script and half sans. They must never resolve to themselves.
  it('substitutes every family that cannot render Kazakh', () => {
    for (const family of KAZAKH_INCAPABLE_FAMILIES) {
      const stack = fontStack(family);
      expect(stack).not.toContain(`'${family}'`);
      expect(stack.length).toBeGreaterThan(0);
    }
    expect(fontStack('Tenor Sans')).toContain('Forum');
    expect(fontStack('Playfair Display')).toContain('Prata');
    expect(fontStack('Marck')).toContain('KZ Script');
    expect(fontStack('Great Vibes')).toContain('KZ Script');
    expect(fontStack('Unbounded')).toContain('Geologica');
    expect(fontStack('Manrope')).toContain('Golos Text');
  });

  it('keeps Kazakh-incapable families out of both font pickers', () => {
    for (const family of KAZAKH_INCAPABLE_FAMILIES) {
      expect(FONT_OPTIONS).not.toContain(family);
    }
  });
});