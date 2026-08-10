'use client';

/**
 * PreviewWithInlineEditorClient — client bridge.
 *
 * Receives the server-rendered initial HTML and hands it to the workbench.
 * The workbench handles its own live preview from /api/html-editor/preview.
 */

import { useMemo } from 'react';
import { InvitationEditorWorkbench } from '@/components/invitation-editor/InvitationEditorWorkbench';
import type { Locale } from '@/lib/templates/html-engine/types';
import type { HtmlEditorFields, RsvpFields } from '@/lib/templates/html-engine/editor/types';

interface Props {
  templateSlug: string;
  templateName: string;
  backHref: string;
  locale: Locale;
  initialHtml: string;
  initialFields?: Partial<HtmlEditorFields>;
  initialRsvp?: Partial<RsvpFields>;
  invitationId?: string;
  isPublished?: boolean;
}

export function PreviewWithInlineEditorClient({
  templateSlug,
  templateName,
  backHref,
  locale,
  initialHtml,
  initialFields,
  initialRsvp,
  invitationId,
  isPublished,
}: Props) {
  // Pre-fill locale if no fields override it.
  const fields = useMemo<Partial<HtmlEditorFields>>(
    () => ({ locale, ...initialFields }),
    [locale, initialFields],
  );

  return (
    <InvitationEditorWorkbench
      mode={invitationId ? 'edit' : 'create'}
      invitationId={invitationId}
      templateSlug={templateSlug}
      templateName={templateName}
      initialFields={fields}
      initialRsvp={initialRsvp}
      isPublished={isPublished ?? false}
      backHref={backHref}
      initialOpen={Boolean(invitationId)}
      initialHtml={initialHtml}
    />
  );
}