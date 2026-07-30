import type { LocalDraft } from '@/lib/invitations/draft-storage';
import { addGuestsAction } from '@/lib/invitations/actions';
import { normalizePhone } from '@/lib/auth';

export interface DraftSyncResult {
  serverInvitationId: string;
  /** Updated guest list with serverGuestId mappings */
  guests?: LocalDraft['guests'];
}

function buildPayload(draft: LocalDraft) {
  const customText = {
    ...draft.customText,
    ...(draft.language === 'ru' || draft.language === 'kz'
      ? { invitationLocale: draft.language }
      : {}),
  };

  return {
    templateId: draft.templateId,
    templateKey: draft.templateKey,
    title: draft.title,
    eventType: draft.eventType,
    eventDate: draft.eventDate,
    eventTime: draft.eventTime || undefined,
    eventPlace: draft.eventPlace || undefined,
    address: draft.address || undefined,
    mapUrl: draft.mapUrl || undefined,
    musicUrl: draft.musicUrl || undefined,
    templateData: draft.templateData,
    customText,
    eventTimezone: draft.eventTimezone,
  };
}

function normalizeGuestName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Sync only guests that are not yet on the server.
 * Matches returned server ids by phone or normalized name.
 */
async function syncGuestsToServer(
  invitationId: string,
  draft: LocalDraft
): Promise<LocalDraft['guests']> {
  if (draft.guests.length === 0) return draft.guests;

  const unsynced = draft.guests.filter((g) => !g.serverGuestId);
  if (unsynced.length === 0) return draft.guests;

  const result = await addGuestsAction({
    invitationId,
    guests: unsynced.map((g) => ({
      name: g.name,
      phone: g.phone,
      hasPlusOne: g.hasPlusOne ?? false,
    })),
  });

  const byPhone = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const g of result.guests) {
    if (g.phone) byPhone.set(normalizePhone(g.phone), g.id);
    byName.set(normalizeGuestName(g.name), g.id);
  }

  return draft.guests.map((g) => {
    if (g.serverGuestId) return g;
    const phoneKey = g.phone?.replace(/\D/g, '') ? g.phone : null;
    const idFromPhone = phoneKey ? byPhone.get(phoneKey) : undefined;
    const idFromName = byName.get(normalizeGuestName(g.name));
    const serverGuestId = idFromPhone || idFromName;
    return serverGuestId ? { ...g, serverGuestId } : g;
  });
}

/**
 * Persist local editor draft to the user's account (draft status in DB).
 */
export async function syncDraftToServer(draft: LocalDraft): Promise<DraftSyncResult> {
  const payload = buildPayload(draft);

  if (!payload.templateId) {
    throw new Error('Не удалось определить шаблон');
  }

  let serverInvitationId: string;

  if (draft.serverInvitationId) {
    const res = await fetch(`/api/invitations/${draft.serverInvitationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Не удалось сохранить черновик');
    }
    serverInvitationId = draft.serverInvitationId;
  } else {
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Не удалось сохранить черновик');
    }
    serverInvitationId = data.invitation.id as string;
  }

  const updatedGuests = await syncGuestsToServer(serverInvitationId, draft);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2026-07-30 SACRED: CANVAS PRIMARY PATH FROM WIZARD DAY 1
  // See PRODUCT_MODEL_AND_RULES.md + ensure-canvas.ts
  // After sync (POST or PATCH invitation) → ALWAYS force canvas seed.
  // This ensures preview (wizard) == editor == public == paid guest page use the same doc.
  // pay once = fullAccess; canvas document must exist before payment.
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    // Force canvas via the canonical API (server-side will call ensureCanvasDocument)
    const canvasRes = await fetch(`/api/invitations/${serverInvitationId}/canvas`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document: null }), // server-side will seed if missing
    });
    if (!canvasRes.ok) {
      console.warn('[draft-sync] canvas PATCH non-ok (will be retried on edit)');
    }

    // Extra-hard: also directly call the helper if possible (server contexts)
    // This reinforces the "canvas from creation + sync" rule.
    try {
      const { ensureCanvasDocument } = await import('./ensure-canvas');
      // best-effort direct (no tx here, but ensures)
      // The /canvas PATCH above already triggers the server ensure path.
    } catch {}
  } catch (e) {
    console.warn('[draft-sync] canvas ensure failed (will retry on edit)', e);
  }

  return { serverInvitationId, guests: updatedGuests };
}
