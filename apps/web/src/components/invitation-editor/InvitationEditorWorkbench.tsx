'use client';

/**
 * InvitationEditorWorkbench — single-page editor.
 *
 * Architecture:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  Toolbar — title, save status, device toggle, close button   │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │                                                              │
 *   │   ┌──────────────────────┐                                  │
 *   │   │  preview stage       │    (preview always full screen)  │
 *   │   │  - phone / desktop   │                                  │
 *   │   │  - iframe live data  │                                  │
 *   │   └──────────────────────┘                                  │
 *   │                                                              │
 *   │   Floating modal — opens centered over preview              │
 *   │   (only when user clicks a dock button)                     │
 *   │                                                              │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  Dock — undo/redo, section buttons, save badge, close       │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Editor open state is local — does NOT cause a route change.
 * Save goes to server action `saveHtmlEditorFieldsAction` (auto-save).
 * Undo/redo via store history (50 steps).
 *
 * Keyboard shortcuts:
 *   - 1/2/3/4 — open content/design/media/publish modal
 *   - Esc — close current modal (or exit edit mode)
 *   - Ctrl/Cmd + S — manual save
 *   - Ctrl/Cmd + Z — undo
 *   - Ctrl/Cmd + Shift + Z / Ctrl + Y — redo
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  PenLine,
} from 'lucide-react';
import {
  HtmlEditorStoreProvider,
  useHtmlEditorStore,
  useHtmlEditorFields,
  useHtmlEditorUi,
} from '@/lib/templates/html-engine/editor/store';
import { EditorUiProvider, useEditorUi } from '@/lib/templates/html-engine/editor/editor-ui';
import type {
  HtmlEditorFields,
  HtmlEditorMode,
} from '@/lib/templates/html-engine/editor/types';
import { saveHtmlEditorFieldsAction } from '@/lib/templates/html-engine/editor/actions';
import type { RsvpFields } from '@/lib/templates/html-engine/editor/types';
import { EditorDock } from './EditorDock';
import { ModalsRoot } from './ModalsRoot';
import { cn } from '@/lib/shared/utils';

interface Props {
  mode: HtmlEditorMode;
  invitationId?: string;
  templateSlug: string;
  templateName: string;
  initialFields: Partial<HtmlEditorFields>;
  initialRsvp?: Partial<RsvpFields>;
  isPublished?: boolean;
  backHref: string;
  /** If true, the editor opens immediately on mount (when invitationId provided). */
  initialOpen?: boolean;
  /** Initial server-rendered HTML — used as the iframe src until the first live preview lands. */
  initialHtml?: string;
}

// ─── Provider wrapper ────────────────────────────────────────────────────────

export function InvitationEditorWorkbench(props: Props) {
  return (
    <HtmlEditorStoreProvider>
      <EditorUiProvider>
        <WorkbenchInner {...props} />
      </EditorUiProvider>
    </HtmlEditorStoreProvider>
  );
}

// ─── Inner ───────────────────────────────────────────────────────────────────

function WorkbenchInner({
  mode,
  invitationId: initialId,
  templateSlug,
  templateName,
  initialFields,
  initialRsvp,
  isPublished = false,
  backHref,
  initialOpen = false,
  initialHtml,
}: Props) {
  const router = useRouter();
  const store = useHtmlEditorStore();
  const fields = useHtmlEditorFields();
  const ui = useHtmlEditorUi();
  const editorUi = useEditorUi();

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [toast, setToast] = useState<{ id: number; type: 'success' | 'error'; message: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial iframe src = server-rendered HTML (as blob URL).
  // IMPORTANT: must be deferred to the client only, otherwise the first
  // client render would produce a blob URL and diverge from the server's
  // "Загрузка превью…" placeholder → React hydration mismatch.
  const [initialSrc, setInitialSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!initialHtml) return;
    const blob = new Blob([initialHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setInitialSrc(url);
    return () => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [initialHtml]);

  // Init store once
  const initedRef = useRef(false);
  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    store.init({
      mode,
      invitationId: initialId,
      templateSlug,
      templateName,
      fields: initialFields,
      rsvpFields: initialRsvp,
    });
    // Auto-enter edit mode when initialOpen=true (i.e. existing invitation)
    if (initialOpen) {
      editorUi.enterEditMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ id: Date.now(), type, message });
      toastTimerRef.current = setTimeout(() => setToast(null), 2400);
    },
    [],
  );

  // ─── Auto-save ──────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    store.setSaveStatus('saving');
    try {
      const result = await saveHtmlEditorFieldsAction({
        invitationId: ui.invitationId ?? undefined,
        templateSlug,
        fields,
      });
      store.markSaved(fields);
      if (!ui.invitationId && result.id) {
        router.replace(`/preview/${templateSlug}?invitationId=${result.id}`, { scroll: false });
        showToast('Приглашение сохранено');
      } else {
        showToast('Сохранено');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения';
      store.setSaveStatus('error', msg);
      showToast(msg, 'error');
    }
  }, [store, ui.invitationId, templateSlug, fields, router, showToast]);

  // Debounced auto-save on dirty
  useEffect(() => {
    if (!ui.isDirty) return;
    const t = setTimeout(() => {
      save().catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [ui.isDirty, fields, save]);

  // ─── Live preview ───────────────────────────────────────────────────────
  // Always fetch — even when modal is closed, because we want consistent
  // state when the user opens the editor (no flash).
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/html-editor/preview', {
          method: 'POST',
          body: JSON.stringify({ templateSlug, ...fields }),
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPreviewHtml((old) => {
          if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
          return url;
        });
        setPreviewKey((k) => k + 1);
      } catch {
        // Silent
      }
    }, 350);
    return () => clearTimeout(t);
  }, [fields, templateSlug]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (previewHtml?.startsWith('blob:')) URL.revokeObjectURL(previewHtml);
    };
  }, [previewHtml]);

  // ─── Keyboard shortcuts (global) ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;
      // Skip if user is typing in a text field
      const target = e.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target?.isContentEditable ?? false);

      if (cmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
        return;
      }
      if (cmd && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        store.undo();
        return;
      }
      if (cmd && (e.shiftKey && e.key.toLowerCase() === 'z') || cmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        store.redo();
        return;
      }
      if (!isTyping && e.key === 'Escape') {
        if (editorUi.openModal) {
          e.preventDefault();
          editorUi.closeModal();
          return;
        }
        if (editorUi.mode === 'edit') {
          e.preventDefault();
          editorUi.exitEditMode();
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save, store, editorUi]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (ui.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [ui.isDirty]);

  const previewSrc = previewHtml ?? initialSrc;
  const isEditMode = editorUi.mode === 'edit';

  return (
    <div className={cn('editor-root', isEditMode && 'editor-root--edit')}>
      {/* ── Top toolbar — only in edit mode ─────────────────────────────── */}
      {isEditMode ? (
        <div className="editor-toolbar">
          <Link
            href={backHref}
            className="editor-btn editor-btn--ghost editor-btn--icon"
            aria-label="Назад"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="editor-toolbar__title">
            <div className="editor-toolbar__name">{templateName}</div>
            <div className="editor-toolbar__subtitle">
              {ui.isDirty ? 'Не сохранено' : 'Все изменения сохранены'}
            </div>
          </div>

          <span className="editor-toolbar__divider" />

          <button
            type="button"
            onClick={save}
            disabled={ui.saveStatus === 'saving' || !ui.isDirty}
            className="editor-btn editor-btn--primary"
          >
            {ui.saveStatus === 'saving' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Сохранить
          </button>
        </div>
      ) : null}

      {/* ── Body: full-screen preview + floating modals + dock ──────────── */}
      <div className="editor-body">
        <div className="editor-stage">
          <div className="editor-stage__inner">
            {previewSrc ? (
              <PhoneFrame dimmed={isEditMode && !editorUi.openModal}>
                <iframe
                  key={previewKey}
                  src={previewSrc}
                  title="Превью приглашения"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  className="editor-device__frame"
                />
              </PhoneFrame>
            ) : (
              <div className="text-white/40">Загрузка превью…</div>
            )}

            {/* Big CTA in preview mode */}
            {editorUi.mode === 'preview' ? (
              <div className="editor-stage-cta">
                <button
                  type="button"
                  onClick={() => editorUi.enterEditMode()}
                  className="editor-cta"
                >
                  <PenLine className="h-4 w-4" />
                  <span>Редактировать</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Floating dock — only in edit mode */}
      <EditorDock />

      {/* Modals (one at a time) */}
      <ModalsRoot isPublished={isPublished} backHref={backHref} />

      {/* Toast */}
      {toast ? (
        <div className="editor-toast" aria-live="polite">
          <div
            className={cn(
              'editor-toast__item',
              toast.type === 'success' && 'editor-toast__item--success',
              toast.type === 'error' && 'editor-toast__item--error',
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-[var(--us-turquoise)]" />
            ) : (
              <AlertCircle className="h-4 w-4 text-[var(--us-berry)]" />
            )}
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Phone frame ──────────────────────────────────────────────────────────────

function PhoneFrame({
  dimmed = false,
  children,
}: {
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'editor-device editor-device--phone',
        dimmed && 'editor-device--dimmed',
      )}
    >
      <div className="editor-device__notch" />
      <div className="editor-device__screen">{children}</div>
    </div>
  );
}