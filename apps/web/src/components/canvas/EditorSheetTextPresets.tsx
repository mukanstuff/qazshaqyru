'use client';

import { useMemo, useState } from 'react';
import type { EventType } from '@prisma/client';
import { Sparkles, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { getTextPresets } from '@/lib/templates/text-presets';
import { applyPlaceholderFields } from '@/lib/canvas/apply-field-placeholders';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

/**
 * Ready-made invitation copy, plus the AI rewrite.
 *
 * Both halves already existed and neither had a caller:
 *
 *  - `lib/templates/text-presets.ts` — 238 lines of curated Russian/Kazakh
 *    greetings for every event type, referenced only by its own unit test.
 *  - `POST /api/ai/fill` + `lib/ai/` — an authenticated, rate-limited endpoint
 *    with a deterministic offline fallback for when AI_API_KEY is unset, also
 *    with no caller. Because of that fallback it is useful even with no key
 *    configured: it still returns sensible copy built from the names and venue.
 *
 * Applying writes through `applyPlaceholderFields`, the same binding the wizard
 * and the hub sheets use, so the text lands on whichever element the template
 * marked `placeholderKey: 'greetingText'` rather than on a guessed element.
 */
interface Props {
  document: InvitationCanvasDocument;
  onDocumentChange: (next: InvitationCanvasDocument) => void;
  eventType: EventType;
  /** Couple names, used to give the AI something concrete to work with. */
  names: string;
  venue?: string;
}

export function EditorSheetTextPresets({
  document,
  onDocumentChange,
  eventType,
  names,
  venue,
}: Props) {
  const { t, locale } = useI18n();
  const isRu = locale !== 'kz';
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const presets = useMemo(() => getTextPresets(eventType), [eventType]);

  // Only worth showing if the template actually marked a greeting slot —
  // otherwise applying would silently do nothing.
  const hasGreetingSlot = document.elements.some((el) => el.placeholderKey === 'greetingText');

  const applyGreeting = (greeting: string) => {
    onDocumentChange(applyPlaceholderFields(document, { greetingText: greeting }));
  };

  const runAiFill = async () => {
    setAiPending(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/fill', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventType,
          names: names.trim() || (isRu ? 'Гости' : 'Қонақтар'),
          tone: 'warm',
          language: isRu ? 'ru' : 'kz',
          ...(venue?.trim() ? { venue: venue.trim() } : {}),
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        data?: { bodyRu?: string; bodyKz?: string; greeting?: string };
        message?: string;
      };
      if (!res.ok) {
        setAiError(payload.message || t('errors.generic'));
        return;
      }
      const text =
        (isRu ? payload.data?.bodyRu : payload.data?.bodyKz) ?? payload.data?.greeting ?? '';
      if (!text) {
        setAiError(t('errors.generic'));
        return;
      }
      applyGreeting(text);
    } catch {
      setAiError(t('errors.generic'));
    } finally {
      setAiPending(false);
    }
  };

  if (!hasGreetingSlot) return null;

  return (
    <div className="editor-sheet-section">
      <h3 className="editor-sheet-section-title">{t('invitation.edit.canvas.presets.title')}</h3>
      <p className="mb-2 text-xs text-us-ink-muted">
        {t('invitation.edit.canvas.presets.hint')}
      </p>

      <div className="flex flex-col gap-2">
        {presets.map((preset, i) => {
          const label = isRu ? preset.labelRu : preset.labelKz;
          const greeting = isRu ? preset.greetingRu : preset.greetingKz;
          return (
            <button
              key={`${label}-${i}`}
              type="button"
              onClick={() => applyGreeting(greeting)}
              className="rounded-xl border border-us-border bg-us-surface p-3 text-left transition-colors hover:border-us-accent/40 hover:bg-us-accent/5"
            >
              <span className="block text-sm font-medium text-us-ink">{label}</span>
              <span className="mt-1 line-clamp-2 block text-xs leading-snug text-us-ink-muted">
                {greeting}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => void runAiFill()}
        disabled={aiPending}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-us-accent/40 bg-us-accent/8 px-4 text-sm font-medium text-us-accent transition-colors hover:bg-us-accent/14 disabled:opacity-60"
      >
        {aiPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden />
        )}
        {t('invitation.edit.canvas.presets.ai')}
      </button>

      {aiError ? (
        <p role="alert" className="mt-2 text-xs text-us-danger">
          {aiError}
        </p>
      ) : null}
    </div>
  );
}
