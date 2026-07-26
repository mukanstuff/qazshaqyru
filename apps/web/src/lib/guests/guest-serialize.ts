import type { Guest, GuestResponse } from '@prisma/client';

type GuestWithResponse = Guest & { response: GuestResponse | null };

/** Strip sensitive fields (tokenHash) before sending guests to the client. */
export function serializeGuestForApi(guest: GuestWithResponse) {
  const { tokenHash: _tokenHash, ...safe } = guest;
  return safe;
}

export function serializeGuestsForApi(guests: GuestWithResponse[]) {
  return guests.map(serializeGuestForApi);
}
