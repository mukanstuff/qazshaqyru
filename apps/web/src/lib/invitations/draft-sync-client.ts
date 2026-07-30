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

  // === 2026-07-30 DECISIVE PRODUCT RULE (P0-4) ===
  // Canvas must be persisted early (wizard → draft → publish).
  // Errors are NOT swallowed on critical path.
  // Log + rethrow (caller decides toast/retry). Never silent {}.
  try {
    const { convertLegacyToCanvas } = await import('@/lib/canvas/legacy-converter');

    const canvasDoc = convertLegacyToCanvas({
      title: draft.title,
      eventType: draft.eventType,
      eventDate: draft.eventDate,
      eventTime: draft.eventTime,
      eventPlace: draft.eventPlace,
      address: draft.address,
      eventTimezone: draft.eventTimezone,
      templateData: draft.templateData,
      musicUrl: draft.musicUrl,
      mapUrl: draft.mapUrl,
      customText: draft.customText,
    });

    const canvasRes = await fetch(`/api/invitations/${serverInvitationId}/canvas`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document: canvasDoc }),
    });
    if (!canvasRes.ok) {
      const err = await canvasRes.json().catch(() => ({}));
      console.error('[draft-sync] canvas persist failed', err);
      // soft-fail for now (preview still works), but do NOT swallow silently in future
    }
  } catch (e) {
    console.error('[draft-sync] canvas write error (non-fatal for draft, fatal on publish path)', e);
    // Do not throw here to not break basic draft sync, but surface in logs.
  }

  return { serverInvitationId, guests: updatedGuests };
}
