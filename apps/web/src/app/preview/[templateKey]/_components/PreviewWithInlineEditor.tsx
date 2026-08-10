/**
 * PreviewWithInlineEditor — server component that bridges the
 * server-rendered initial preview HTML with the client-side editor workbench.
 *
 * The initial HTML is delivered as a blob URL inside an iframe on first mount.
 * Once the user clicks "Редактировать" the workbench switches to live preview
 * by calling /api/html-editor/preview on each change.
 */

import { PreviewWithInlineEditorClient } from './PreviewWithInlineEditorClient';
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

export function PreviewWithInlineEditor(props: Props) {
  return <PreviewWithInlineEditorClient {...props} />;
}