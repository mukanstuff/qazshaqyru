// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';
import { CanvasEditor } from '../CanvasEditor';
import { EditorToolbar } from '../EditorToolbar';
import { ElementContextMenu } from '../ElementContextMenu';

Object.assign(globalThis, {
  React,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const documentFixture: InvitationCanvasDocument = {
  version: 1,
  width: 390,
  height: 844,
  background: { type: 'solid', color: '#ffffff' },
  elements: [],
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
    saveState: 'idle' as const,
    lastSaved: null,
    onSaveNow: vi.fn(),
    mode: 'user' as const,
    previewMode: false,
    onTogglePreview: vi.fn(),
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

  it('starts a keepalive save synchronously before unload', () => {
    const onSaveRequest = vi.fn(() => Promise.resolve());
    const rendered = render(
      React.createElement(CanvasEditor, {
        initialDocument: documentFixture,
        onSaveRequest,
      }),
    );
    roots.push(rendered.root);

    act(() => window.dispatchEvent(new Event('beforeunload')));

    expect(onSaveRequest).toHaveBeenCalledWith(documentFixture, { keepalive: true });
  });

  it('flushes a pending save when a mobile tab becomes hidden', () => {
    const onSaveRequest = vi.fn(() => Promise.resolve());
    const rendered = render(
      React.createElement(CanvasEditor, {
        initialDocument: documentFixture,
        onSaveRequest,
      }),
    );
    roots.push(rendered.root);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });

    act(() => document.dispatchEvent(new Event('visibilitychange')));

    expect(onSaveRequest).toHaveBeenCalledWith(documentFixture, { keepalive: true });
  });
});

describe('canvas editor translations', () => {
  it('gets toolbar labels from the active i18n provider', () => {
    const rendered = renderWithChildren(I18nProvider, React.createElement(EditorToolbar, toolbarProps()));
    rootsForCleanup.push(rendered.root);

    expect(rendered.container.textContent).toContain('Қайтару');
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
