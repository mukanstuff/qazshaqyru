// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import html2canvas from 'html2canvas';
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

vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

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
    viewport: 'mobile' as const,
    onViewportChange: vi.fn(),
    zoom: 1,
    onZoomChange: vi.fn(),
    showGrid: false,
    onToggleGrid: vi.fn(),
    canUndo: false,
    canRedo: false,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onPreviewGuest: vi.fn(),
    onPreviewAnimations: vi.fn(),
    onOpenPresets: vi.fn(),
    onExportPNG: vi.fn(),
    saveState: 'idle' as const,
    lastSaved: null,
    onSaveNow: vi.fn(),
    mode: 'user' as const,
  };
}

describe('canvas editor durability and export', () => {
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

  it('captures only the invitation preview and downloads a named PNG', async () => {
    const blob = new Blob(['png'], { type: 'image/png' });
    const capture = vi.mocked(html2canvas);
    capture.mockResolvedValue({
      toBlob: (callback: BlobCallback) => callback(blob),
    } as HTMLCanvasElement);
    const createObjectURL = vi.fn(() => 'blob:invitation');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const rendered = render(
      React.createElement(CanvasEditor, {
        initialDocument: documentFixture,
        invitationId: 'invite-42',
      }),
    );
    roots.push(rendered.root);

    const exportButton = Array.from(rendered.container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('PNG'),
    );
    expect(exportButton).toBeDefined();

    await act(async () => exportButton?.click());

    const preview = rendered.container.querySelector('[data-canvas-export-preview]');
    expect(preview).not.toBeNull();
    expect(capture).toHaveBeenCalledWith(
      preview,
      expect.objectContaining({ useCORS: true, scale: 2 }),
    );
    expect(anchorClick).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:invitation');
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

    expect(rendered.container.textContent).toContain('PNG жүктеу');
    expect(rendered.container.textContent).toContain('Пресеттер');
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
