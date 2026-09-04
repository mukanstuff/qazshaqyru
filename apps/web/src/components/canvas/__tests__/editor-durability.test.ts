// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';
import { CanvasEditor } from '../CanvasEditor';
import { EditorToolbar } from '../EditorToolbar';
import { ElementContextMenu } from '../ElementContextMenu';

// CanvasEditor calls useRouter() (publish navigates to the hub). Outside the
// App Router, Next's useRouter throws "invariant expected app router to be
// mounted" during render, so both durability cases below crashed on mount
// instead of testing anything.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/editor/test',
}));

Object.assign(globalThis, {
  React,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// jsdom has no ResizeObserver; CanvasEditor measures the unscaled stage with
// one to reserve height for the CSS transform that fits the canvas to a phone.
class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (StubResizeObserver as unknown as typeof ResizeObserver);

const documentFixture: InvitationCanvasDocument = {
  version: 1,
  width: 390,
  height: 844,
  background: { type: 'solid', color: '#ffffff' },
  elements: [],
};

/** One element, so there is something to edit and therefore something to flush. */
const editedDocumentFixture: InvitationCanvasDocument = {
  ...documentFixture,
  elements: [
    {
      id: 't1',
      type: 'text',
      x: 10,
      y: 20,
      w: 80,
      h: 40,
      rotation: 0,
      zIndex: 1,
      locked: false,
      hidden: false,
      text: 'Той',
      fontFamily: 'Cormorant',
      fontSize: 18,
      fontWeight: 400,
      color: '#000000',
      textAlign: 'center',
      lineHeight: 1.3,
      letterSpacing: 0,
    },
  ],
};

function render(node: React.ReactNode): { container: HTMLDivElement; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  return { container, root };
}

function renderWithChildren(
  Component: React.ComponentType<{ children: React.ReactNode; initialLocale?: 'ru' | 'kz' }>,
  children: React.ReactNode,
) {
  const props: { children: React.ReactNode; initialLocale?: 'ru' | 'kz' } = { children };
  props.initialLocale = 'kz';
  return render(React.createElement(Component, props));
}

function toolbarProps() {
  return {
    canUndo: false,
    canRedo: false,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onBack: vi.fn(),
    onPublish: vi.fn(),
  };
}

describe('canvas editor durability', () => {
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

  /**
   * Both cases used to mount the editor and immediately fire the event, with
   * nothing edited in between — and the flush deliberately does nothing when
   * no save is pending, so they asserted a call that must never happen. Make a
   * real edit first (select an element, press Delete), which is what puts a
   * payload in the pending ref.
   */
  function renderEditorWithPendingEdit(onSaveRequest: ReturnType<typeof vi.fn>) {
    const rendered = render(
      React.createElement(CanvasEditor, {
        initialDocument: editedDocumentFixture,
        onSaveRequest,
      }),
    );
    roots.push(rendered.root);

    const el = rendered.container.querySelector('[data-selected-id="t1"]');
    if (!el) throw new Error('element not rendered');
    act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    });
    // The debounced save must not have fired yet, or there is nothing to flush.
    expect(onSaveRequest).not.toHaveBeenCalled();
    return rendered;
  }

  it('starts a keepalive save synchronously before unload', () => {
    const onSaveRequest = vi.fn(() => Promise.resolve());
    renderEditorWithPendingEdit(onSaveRequest);

    act(() => window.dispatchEvent(new Event('beforeunload')));

    expect(onSaveRequest).toHaveBeenCalledTimes(1);
    expect(onSaveRequest).toHaveBeenCalledWith(
      expect.objectContaining({ elements: [] }),
      { keepalive: true },
    );
  });

  it('flushes a pending save when a mobile tab becomes hidden', () => {
    const onSaveRequest = vi.fn(() => Promise.resolve());
    renderEditorWithPendingEdit(onSaveRequest);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });

    act(() => document.dispatchEvent(new Event('visibilitychange')));

    expect(onSaveRequest).toHaveBeenCalledTimes(1);
    expect(onSaveRequest).toHaveBeenCalledWith(
      expect.objectContaining({ elements: [] }),
      { keepalive: true },
    );
  });
});

describe('canvas editor translations', () => {
  it('gets toolbar labels from the active i18n provider', () => {
    const rendered = renderWithChildren(I18nProvider, React.createElement(EditorToolbar, toolbarProps()));
    rootsForCleanup.push(rendered.root);

    expect(rendered.container.textContent).toContain('Дайын');
  });

  it('gets context-menu state labels from the active i18n provider', () => {
    const rendered = renderWithChildren(I18nProvider, React.createElement(ElementContextMenu, {
          x: 0,
          y: 0,
          element: {
            id: 'heading-1',
            type: 'heading',
            x: 0,
            y: 0,
            w: 100,
            h: 60,
            rotation: 0,
            zIndex: 1,
            locked: true,
            hidden: true,
            text: 'Той',
            fontSize: 32,
            color: '#000000',
            fontFamily: 'system',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: 0,
          },
          onDuplicate: vi.fn(),
          onDelete: vi.fn(),
          onBringToFront: vi.fn(),
          onSendToBack: vi.fn(),
          onToggleLock: vi.fn(),
          onToggleHide: vi.fn(),
          onClose: vi.fn(),
        }));
    rootsForCleanup.push(rendered.root);

    expect(rendered.container.textContent).toContain('Құлпын ашу');
    expect(rendered.container.textContent).toContain('Көрсету');
  });
});

const rootsForCleanup: Root[] = [];
afterEach(() => {
  rootsForCleanup.splice(0).forEach((root) => act(() => root.unmount()));
  document.body.innerHTML = '';
});
