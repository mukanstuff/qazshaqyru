'use client';

/**
 * Hub sheets (Dates / Texts / Music) used to write to `customText` /
 * `eventDate` / `musicUrl` columns directly — fields the canvas renderer,
 * the thing guests actually see, never reads. This is the one client-side
 * path for a hub sheet to edit the invitation: load the canvas document,
 * mutate the bound elements, save it back through the same
 * PATCH /api/invitations/[id]/canvas the editor uses.
 */
import type { InvitationCanvasDocument } from './types';

export interface CanvasFetchResult {
  document: InvitationCanvasDocument;
  updatedAt: string;
}

async function readJsonOrThrow(res: Response, fallback: string): Promise<CanvasFetchResult> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.document) {
    const message = typeof data?.message === 'string' ? data.message : fallback;
    throw new Error(message);
  }
  return { document: data.document as InvitationCanvasDocument, updatedAt: data.updatedAt as string };
}

export async function fetchInvitationCanvas(invitationId: string): Promise<CanvasFetchResult> {
  const res = await fetch(`/api/invitations/${invitationId}/canvas`, { credentials: 'include' });
  return readJsonOrThrow(res, 'Не удалось загрузить документ приглашения');
}

export async function saveInvitationCanvas(
  invitationId: string,
  document: InvitationCanvasDocument,
  baseVersion?: string
): Promise<CanvasFetchResult> {
  const res = await fetch(`/api/invitations/${invitationId}/canvas`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document, baseVersion }),
  });
  return readJsonOrThrow(res, 'Не удалось сохранить приглашение');
}
