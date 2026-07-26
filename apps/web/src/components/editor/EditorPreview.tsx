'use client';

import type { ComponentProps } from 'react';

import { InvitationLayoutRouter } from '@/components/invitation-layouts/LayoutRouter';

type EditorPreviewProps = ComponentProps<typeof InvitationLayoutRouter>;

/**
 * Thin preview shell for editor mode.
 * Keeps EditorLayout/DraftEditorLayout from depending directly on the full
 * public-page router semantics and gives the next refactor a single preview seam.
 */
export function EditorPreview(props: EditorPreviewProps) {
  return <InvitationLayoutRouter {...props} isEditing />;
}

