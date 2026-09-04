'use client';

import { useCallback, useState } from 'react';

/**
 * Personal per-guest invite links.
 *
 * `POST /api/invitations/[id]/send` has been complete since the start — it mints
 * a fresh token per guest, stamps `sentAt`, and returns a ready WhatsApp deep
 * link with the invitation title. Nothing in the app ever called it: the only
 * UI that did (`SendInvitesModal`) was deleted after it was found stripped of
 * every style attribute.
 *
 * The consequence was not cosmetic. Open RSVP defaults to OFF for weddings,
 * той, беташар and қыз ұзату (see lib/guests/open-rsvp-config.ts) because those
 * are supposed to use personal links — so with no way to issue those links, a
 * guest at a wedding had no working way to respond at all: the public page's
 * RSVP form answered 403 `open_rsvp_disabled`.
 */
export interface GuestInviteLink {
  id: string;
  name: string;
  phone: string | null;
  inviteUrl: string;
  alreadySent: boolean;
  whatsappLink: string | null;
  /** False when the link came back without a ?guest= token (already issued). */
  hasToken: boolean;
}

/** The route returns the array under `guests` (see /api/invitations/[id]/send). */
type SendResponse = {
  success?: boolean;
  guests?: Omit<GuestInviteLink, 'hasToken'>[];
  error?: string;
  message?: string;
};

export function useGuestInviteLinks(invitationId: string) {
  const [links, setLinks] = useState<Record<string, GuestInviteLink>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Tokens are stored only as HMACs, so a link can be *shown* exactly once —
   * at the moment it is issued. A guest whose link was issued in an earlier
   * session comes back with an empty token, and the only way to see a working
   * URL for them again is to reissue, which invalidates the link they may
   * already have received.
   *
   * That is why `guestIds` matters: reissuing for ONE guest leaves everyone
   * else's links intact. Reissuing for all of them (the bulk button) is a
   * deliberate, separately labelled action.
   */
  const issue = useCallback(
    async (options: { reissue?: boolean; guestIds?: string[] } = {}) => {
      setPending(true);
      setError(null);
      try {
        const res = await fetch(`/api/invitations/${invitationId}/send`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            reissue: options.reissue ?? false,
            ...(options.guestIds?.length ? { guestIds: options.guestIds } : {}),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as SendResponse;
        if (!res.ok) {
          setError(data.error === 'not_published' ? 'linksNotPublished' : 'linksError');
          return;
        }
        setLinks((prev) => {
          const next = { ...prev };
          for (const link of data.guests ?? []) {
            const usable = link.inviteUrl.includes('?guest=');
            // Never overwrite a URL we can still use with a token-less one.
            if (!usable && next[link.id]?.hasToken) continue;
            next[link.id] = { ...link, hasToken: usable };
          }
          return next;
        });
      } catch {
        setError('linksError');
      } finally {
        setPending(false);
      }
    },
    [invitationId]
  );

  return { links, issue, pending, error };
}
