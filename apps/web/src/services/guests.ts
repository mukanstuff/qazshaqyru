/**
 * Guest service: business logic for managing guests and their tokens.
 *
 * Why a service layer: server actions and API routes both need the same
 * create/update logic, and we want a single place where the HMAC token
 * contract is enforced. Putting it in two places means we eventually
 * diverge, and the next person to touch the code will not know which
 * one is "real".
 */
import prisma from '@/lib/db';
import { generateGuestToken, normalizePhone } from '@/lib/auth';

export interface AddGuestInput {
  name: string;
  phone?: string;
  side?: 'bride' | 'groom';
  hasPlusOne?: boolean;
  plusOneName?: string;
}

export interface CreatedGuest {
  id: string;
  name: string;
  phone: string | null;
  /** Cleartext token. Returned exactly once, when the guest is created. */
  token: string;
}

export interface AddGuestsResult {
  created: number;
  reused: number;
  skipped: number;
  guests: CreatedGuest[];
}

export interface AddGuestsOptions {
  /** If false, do not throw when a guest with the same phone exists; just reuse. */
  reuseByPhone?: boolean;
}

const DEFAULT_OPTIONS: AddGuestsOptions = { reuseByPhone: true };

/**
 * Generate fresh tokens for every guest of an invitation and rotate the
 * stored hash. This is what the editor uses to display per-guest share
 * links in the dashboard.
 *
 * Why rotate: the host needs a working shareable URL whenever they look
 * at the guest list. Because we never store the cleartext token (only
 * its hash), the only way to "show" them the URL is to mint a new one.
 * The old token becomes invalid, which is acceptable: an attacker who
 * somehow saw the old token can no longer use it.
 *
 * To avoid an unbounded number of token rotations in a single request
 * (e.g. if the host opens the editor in 10 tabs), we accept an optional
 * `reissue` flag. When false (default), we only issue a token for guests
 * that don't have one yet — which is the common case for freshly added
 * guests. When true, every guest gets a fresh token.
 */
export async function getOrCreateGuestLinks(
  invitationId: string,
  options: { reissue?: boolean } = {}
): Promise<Array<{ id: string; name: string; phone: string | null; token: string; sentAt: Date | null }>> {
  const guests = await prisma.guest.findMany({
    where: { invitationId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, phone: true, sentAt: true, tokenHash: true },
  });

  // Track which guests we need to write back. We issue one token per
  // guest that doesn't already have a "current" token, plus all guests
  // when reissue is requested.
  const out: Array<{ id: string; name: string; phone: string | null; token: string; sentAt: Date | null }> = [];
  const updates: Array<{ id: string; tokenHash: string }> = [];

  for (const g of guests) {
    // Heuristic: a guest that has been sent at least once is considered
    // "current" and we don't touch their token. This keeps existing
    // WhatsApp shares working when the host reopens the editor.
    const alreadyIssued = g.sentAt !== null;
    if (alreadyIssued && !options.reissue) {
      // We cannot return a valid token (we never stored it), so we
      // return an empty string. The UI treats this as "already sent".
      out.push({ id: g.id, name: g.name, phone: g.phone, token: '', sentAt: g.sentAt });
      continue;
    }
    const { token, tokenHash } = generateGuestToken();
    updates.push({ id: g.id, tokenHash });
    out.push({ id: g.id, name: g.name, phone: g.phone, token, sentAt: g.sentAt });
  }

  if (updates.length) {
    await Promise.all(
      updates.map((u) =>
        prisma.guest.update({
          where: { id: u.id },
          data: { tokenHash: u.tokenHash },
        })
      )
    );
  }

  return out;
}

export interface AddGuestInput {
  name: string;
  phone?: string;
  side?: 'bride' | 'groom';
  hasPlusOne?: boolean;
  plusOneName?: string;
}

export interface CreatedGuest {
  id: string;
  name: string;
  phone: string | null;
  /** Cleartext token. Returned exactly once, when the guest is created. */
  token: string;
}

export interface AddGuestsResult {
  created: number;
  reused: number;
  skipped: number;
  guests: CreatedGuest[];
}

export interface AddGuestsOptions {
  /** If false, do not throw when a guest with the same phone exists; just reuse. */
  reuseByPhone?: boolean;
}

export async function addGuests(
  invitationId: string,
  inputs: AddGuestInput[],
  options: AddGuestsOptions = DEFAULT_OPTIONS
): Promise<AddGuestsResult> {
  // Normalise and dedupe within the batch.
  const seen = new Set<string>();
  const cleaned = inputs.map((g) => {
    const phoneNormalized = g.phone ? normalizePhone(g.phone) : null;
    return { ...g, phoneNormalized };
  });
  const unique = cleaned.filter((g) => {
    if (!g.phoneNormalized) return true;
    if (seen.has(g.phoneNormalized)) return false;
    seen.add(g.phoneNormalized);
    return true;
  });

  const phones = unique.map((g) => g.phoneNormalized).filter((p): p is string => !!p);
  const existing = phones.length
    ? await prisma.guest.findMany({
        where: { invitationId, phone: { in: phones } },
        select: { id: true, phone: true },
      })
    : [];
  const existingByPhone = new Map(existing.map((e) => [e.phone, e.id]));

  const result: AddGuestsResult = { created: 0, reused: 0, skipped: 0, guests: [] };

  for (const g of unique) {
    const { token, tokenHash } = generateGuestToken();
    const data = {
      name: g.name,
      side: g.side ?? null,
      hasPlusOne: g.hasPlusOne ?? false,
      plusOneName: g.plusOneName || null,
      phone: g.phoneNormalized,
      tokenHash,
    };
    try {
      if (options.reuseByPhone && g.phoneNormalized && existingByPhone.has(g.phoneNormalized)) {
        const id = existingByPhone.get(g.phoneNormalized)!;
        await prisma.guest.update({ where: { id }, data });
        result.reused += 1;
        result.guests.push({ id, name: g.name, token, phone: g.phoneNormalized });
      } else {
        const created = await prisma.guest.create({
          data: { invitationId, ...data },
        });
        result.created += 1;
        result.guests.push({
          id: created.id,
          name: g.name,
          token,
          phone: g.phoneNormalized,
        });
      }
    } catch {
      // Race on the partial unique index - skip and move on.
      result.skipped += 1;
    }
  }

  return result;
}

export async function getGuestStatsForInvitation(invitationId: string) {
  const [total, responded, attending, attendingPlusOne, notAttending] = await Promise.all([
    prisma.guest.count({ where: { invitationId } }),
    prisma.guestResponse.count({ where: { guest: { invitationId } } }),
    prisma.guestResponse.count({
      where: { guest: { invitationId }, status: 'attending' },
    }),
    prisma.guestResponse.count({
      where: { guest: { invitationId }, status: 'attending_plus_one' },
    }),
    prisma.guestResponse.count({
      where: { guest: { invitationId }, status: 'not_attending' },
    }),
  ]);

  const pending = total - responded;
  const expectedGuests = attending + attendingPlusOne * 2;

  return {
    total,
    responded,
    pending,
    attending,
    attendingPlusOne,
    notAttending,
    expectedGuests,
  };
}
