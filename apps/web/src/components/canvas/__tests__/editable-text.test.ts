// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvitationCanvasDocument, TextElement } from '@/lib/canvas/types';
import { EditableTextView } from '../elements/EditableTextView';
import { fontStack } from '../elements/fontStack';

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

  it('calls onStartEdit when double-clicked', () => {
    const onStartEdit = vi.fn();
    const { container, root } = render(
      React.createElement(EditableTextView, {
        el: baseText,
        editing: false,
        selected: true,
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
    const toolbar = container.querySelector('[role="toolbar"][aria-label="Форматирование текста"]');
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
    const bold = container.querySelector('[title="Жирный"]');
    const italic = container.querySelector('[title="Курсив"]');
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
      'Inter', 'Josefin Sans', 'Manrope', 'Montserrat', 'Nunito', 'Oswald',
      'Poppins', 'Quicksand', 'Raleway', 'Tenor Sans', 'Unbounded', 'Work Sans',
      'Bebas Neue', 'Comfortaa', 'system', 'Alice', 'Bodoni Moda', 'Cardo',
      'Cinzel', 'Cormorant', 'Cormorant Garamond', 'DM Serif Display',
      'EB Garamond', 'Forum', 'Italiana', 'Libre Baskerville', 'Lora', 'Marcellus',
      'Merriweather', 'Old Standard TT', 'PT Serif', 'Philosopher',
      'Playfair Display', 'Prata', 'Spectral', 'Vollkorn', 'Yeseva One',
      'Dancing Script', 'Great Vibes', 'Marck', 'Pacifico', 'Parisienne',
      'Sacramento', 'Tangerine',
    ];
    for (const f of families) {
      const stack = fontStack(f);
      expect(typeof stack).toBe('string');
      expect(stack.length).toBeGreaterThan(0);
    }
  });

  it('uses the self-hosted KZ prefix for the 5 locally available families', () => {
    expect(fontStack('Montserrat')).toContain('KZ Montserrat');
    expect(fontStack('Cormorant')).toContain('KZ Cormorant');
    expect(fontStack('Cormorant Garamond')).toContain('KZ Cormorant');
    expect(fontStack('Marck')).toContain('KZ Marck');
    expect(fontStack('Unbounded')).toContain('KZ Unbounded');
  });

  it('quotes Google-family names so the stack is safe with multi-word names', () => {
    expect(fontStack('Playfair Display')).toContain("'Playfair Display'");
    expect(fontStack('Dancing Script')).toContain("'Dancing Script'");
    expect(fontStack('Tenor Sans')).toContain("'Tenor Sans'");
  });
});