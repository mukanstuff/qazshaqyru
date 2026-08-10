'use client';

/**
 * HtmlEditorShell — main split-panel editor container.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────┐
 *   │ TopBar: back + save status + device toggle + save btn  │
 *   ├────────────────┬─────────────────────────────────────┤
 *   │ Settings Panel │         Live Preview (iframe)          │
 *   │ (tabbed:       │   phone frame or full desktop width   │
 *   │  Content       │                                      │
 *   │  Design        │                                      │
 *   │  Media         │                                      │
 *   │  Publish)      │                                      │
 *   └────────────────┴─────────────────────────────────────┘
 *
 * State lives in React Context (HtmlEditorStoreProvider).
 * Live preview refreshes on field changes via POST /api/html-editor/preview.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Monitor,
  Smartphone,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  HtmlEditorStoreProvider,
  useHtmlEditorStore,
  useHtmlEditorFields,
  useHtmlEditorUi,
} from '@/lib/templates/html-engine/editor/store';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { cn } from '@/lib/shared/utils';
import { saveHtmlEditorFieldsAction } from '@/lib/templates/html-engine/editor/actions';
import type { EditorTab, HtmlEditorFields } from '@/lib/templates/html-engine/editor/types';

// Panels
import { ContentPanel } from './panels/ContentPanel';
import { DesignPanel } from './panels/DesignPanel';
import { MediaPanel } from './panels/MediaPanel';
import { PublishPanel } from './panels/PublishPanel';

interface Props {
  mode: 'create' | 'edit';
  invitationId?: string;
  slug?: string;
  templateSlug: string;
  templateName: string;
  fields: HtmlEditorFields;
  isPublished?: boolean;
  backHref: string;
}

const TABS: { id: EditorTab; labelRu: string; labelKz: string }[] = [
  { id: 'content', labelRu: 'Содержание', labelKz: 'Мазмұн' },
  { id: 'design',  labelRu: 'Оформление', labelKz: 'Дизайн' },
  { id: 'media',   labelRu: 'Медиа',      labelKz: 'Медиа' },
  { id: 'publish', labelRu: 'Публикация', labelKz: 'Жариялау' },
];

// ─── Inner shell (needs provider) ─────────────────────────────────────────────

function HtmlEditorShellInner({ backHref, isPublished }: { backHref: string; isPublished: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const store = useHtmlEditorStore();
  const fields = useHtmlEditorFields();
  const { activeTab, saveStatus, isDirty, invitationId, templateSlug } = useHtmlEditorUi();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [phoneFrame, setPhoneFrame] = useState(true);

  const locale = fields.locale ?? 'ru';

  // Initialize store once on mount
  useEffect(() => {
    // Init is called by the parent — just track that it happened
  }, []);

  // Debounced live preview refresh on field changes
  useEffect(() => {
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      refreshPreview();
    }, 400);
    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, templateSlug]);

  const refreshPreview = useCallback(async () => {
    if (!iframeRef.current) return;
    try {
      const res = await fetch('/api/html-editor/preview', {
        method: 'POST',
        body: JSON.stringify({ ...fields }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = url;
      if (currentSrc.startsWith('blob:')) URL.revokeObjectURL(currentSrc);
    } catch {
      // Silently fail — don't block user
    }
  }, [fields, templateSlug, locale]);

  // Auto-refresh preview on mount
  useEffect(() => {
    setTimeout(() => refreshPreview(), 100);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    store.setSaveStatus('saving');
    try {
      const result = await saveHtmlEditorFieldsAction({
        invitationId: invitationId ?? undefined,
        templateSlug,
        fields,
      });
      if (!invitationId && result.id) {
        // After first save on create, the URL would change — inform user
        store.markSaved(fields);
        toast({ title: 'Приглашение сохранено. ID: ' + result.id });
      } else {
        store.markSaved(fields);
        toast({ title: 'Изменения сохранены' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения';
      store.setSaveStatus('error', msg);
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    }
  }, [fields, invitationId, templateSlug, store, toast]);

  const handleTabChange = useCallback(
    (tab: EditorTab) => {
      if (tab === 'publish' && isDirty) {
        handleSave();
      }
      store.setTab(tab);
    },
    [isDirty, handleSave, store],
  );

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0c] text-[#f5f5f7]">
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#1c1c1e] px-4">
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1.5 text-white/60 hover:bg-white/8 hover:text-white"
          asChild
        >
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Назад</span>
          </Link>
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-sm font-medium text-white">{useHtmlEditorUi().templateName}</p>
          {isDirty && <p className="text-xs text-white/40">Есть несохранённые изменения</p>}
        </div>

        {/* Device toggle */}
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
          <button
            type="button"
            onClick={() => setPhoneFrame(true)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              phoneFrame ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
            )}
            title="Телефон"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPhoneFrame(false)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              !phoneFrame ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
            )}
            title="Десктоп"
          >
            <Monitor className="h-4 w-4" />
          </button>
        </div>

        {/* Save button */}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 border-white/20 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
          onClick={handleSave}
          disabled={saveStatus === 'saving' || !isDirty}
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveStatus === 'saved' ? (
            <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
          ) : saveStatus === 'error' ? (
            <AlertCircle className="h-4 w-4 text-[#F97316]" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveStatus === 'saving' ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </header>

      {/* ── Body: sidebar + preview ───────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Settings sidebar ─────────────────────────────────────── */}
        <aside className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#1c1c1e]">
          {/* Tab bar */}
          <nav className="flex shrink-0 border-b border-white/10">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex-1 border-b-2 px-2 py-2.5 text-center font-body text-xs font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-[#16A34A] text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                )}
              >
                {locale === 'kz' ? tab.labelKz : tab.labelRu}
              </button>
            ))}
          </nav>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'content' && <ContentPanel />}
            {activeTab === 'design' && <DesignPanel />}
            {activeTab === 'media' && <MediaPanel />}
            {activeTab === 'publish' && (
              <PublishPanel
                isPublished={isPublished}
                slug={fields.slug}
                backHref={backHref}
              />
            )}
          </div>
        </aside>

        {/* ── Live preview ─────────────────────────────────────────── */}
        <main
          className={cn(
            'flex flex-1 items-center justify-center overflow-hidden bg-[#0a0a0c] p-4',
            !phoneFrame && 'items-start justify-start'
          )}
        >
          <div
            className={cn(
              'relative w-full overflow-hidden bg-black transition-all duration-300',
              phoneFrame
                ? 'mx-auto max-w-[390px] rounded-[2.5rem] border-4 border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_32px_80px_rgba(0,0,0,0.7)]'
                : 'h-full rounded-none border-0 shadow-none'
            )}
          >
            {phoneFrame && (
              <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2">
                <div className="h-7 w-32 rounded-b-2xl bg-black" />
              </div>
            )}

            <div
              className={cn(
                'h-full w-full overflow-hidden bg-white',
                phoneFrame ? 'rounded-[2rem]' : ''
              )}
              style={phoneFrame ? { height: 'calc(100% - 2rem)' } : {}}
            >
              <iframe
                key={previewKey}
                ref={iframeRef}
                title="Приглашение — превью"
                className="h-full w-full border-0"
                src={`/api/html-editor/preview?template=${encodeURIComponent(templateSlug)}&locale=${encodeURIComponent(locale)}`}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Outer wrapper: initializes context then renders inner ───────────────────

export function HtmlEditorShell({
  mode,
  invitationId,
  slug,
  templateSlug,
  templateName,
  fields: initialFields,
  isPublished = false,
  backHref,
}: Props) {
  return (
    <HtmlEditorStoreProvider>
      <HtmlEditorShellInit
        mode={mode}
        invitationId={invitationId}
        templateSlug={templateSlug}
        templateName={templateName}
        fields={initialFields}
        backHref={backHref}
        isPublished={isPublished}
      />
    </HtmlEditorStoreProvider>
  );
}

function HtmlEditorShellInit({
  mode,
  invitationId,
  templateSlug,
  templateName,
  fields,
  backHref,
  isPublished,
}: Props) {
  const store = useHtmlEditorStore();

  useEffect(() => {
    store.init({ mode, invitationId, templateSlug, templateName, fields });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <HtmlEditorShellInner backHref={backHref} isPublished={isPublished ?? false} />;
}
