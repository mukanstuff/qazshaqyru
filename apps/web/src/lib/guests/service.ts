import prisma from '@/lib/shared/db';
import { generateGuestToken, normalizePhone, validatePhone } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export class GuestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuestValidationError';
  }
}

export class GuestNotFoundError extends Error {
  constructor(message = 'Гость не найден') {
    super(message);
    this.name = 'GuestNotFoundError';
  }
}

export interface AddGuestInput {
  name: string;
  phone?: string;
  side?: 'bride' | 'groom';
  hasPlusOne?: boolean;
  plusOneName?: string;
  householdLabel?: string;
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

export interface EditorGuestRow {
  id: string;
  name: string;
  phone: string | null;
  side: string | null;
  hasPlusOne: boolean;
  plusOneName: string | null;
  householdLabel: string | null;
  sentAt: Date | null;
  openedAt: Date | null;
  response: {
    status: string;
    message: string | null;
    dietaryRestrictions: string | null;
    respondedAt: Date;
  } | null;
}

/**
 * List guests for the editor — never rotates tokens.
 */
export async function listGuestsForEditor(invitationId: string): Promise<EditorGuestRow[]> {
  return prisma.guest.findMany({
    where: { invitationId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      phone: true,
      side: true,
      hasPlusOne: true,
      plusOneName: true,
      householdLabel: true,
      sentAt: true,
      openedAt: true,
      response: {
        select: {
          status: true,
          message: true,
          dietaryRestrictions: true,
          respondedAt: true,
        },
      },
    },
  });
}

export interface IssuedGuestLink {
  id: string;
  name: string;
  phone: string | null;
  token: string;
  alreadySent: boolean;
}

/**
 * Issue personal invite links for guests. Rotates token only for guests
 * that have not been sent yet (sentAt === null). Sets sentAt after issuing.
 */
export async function issueGuestInviteLinks(
  invitationId: string,
  guestIds?: string[],
  options: { reissue?: boolean } = {}
): Promise<IssuedGuestLink[]> {
  const { reissue = false } = options;
  const guests = await prisma.guest.findMany({
    where: guestIds?.length
      ? { invitationId, id: { in: guestIds } }
      : { invitationId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, phone: true, sentAt: true },
  });

  const out: IssuedGuestLink[] = [];
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const g of guests) {
      if (g.sentAt !== null && !reissue) {
        out.push({ id: g.id, name: g.name, phone: g.phone, token: '', alreadySent: true });
        continue;
      }

      const { token, tokenHash } = generateGuestToken();
      await tx.guest.update({
        where: { id: g.id },
        data: { tokenHash, sentAt: now },
      });
      out.push({ id: g.id, name: g.name, phone: g.phone, token, alreadySent: g.sentAt !== null });
    }
  });

  revalidatePath('/dashboard');
  revalidatePath(`/invitations/${invitationId}`);

  return out;
}

export async function addGuests(
  invitationId: string,
  inputs: AddGuestInput[],
  options: AddGuestsOptions = DEFAULT_OPTIONS
): Promise<AddGuestsResult> {
  const seen = new Set<string>();
  const cleaned = inputs.map((g) => {
    let phoneNormalized: string | null = null;
    if (g.phone?.trim()) {
      phoneNormalized = normalizePhone(g.phone);
      if (!validatePhone(phoneNormalized)) {
        throw new GuestValidationError(
          'Номер телефона должен быть в формате +77XXXXXXXXX (Казахстан) или +79XXXXXXXXX (Россия)'
        );
      }
    }
    return { ...g, phoneNormalized };
  });
  const unique = cleaned.filter((g) => {
    if (!g.phoneNormalized) return true;
    if (seen.has(g.phoneNormalized)) return false;
    seen.add(g.phoneNormalized);
    return true;
  });

  const phones = unique.map((g) => g.phoneNormalized).filter((p): p is string => !!p);
  const namesWithoutPhone = unique
    .filter((g) => !g.phoneNormalized)
    .map((g) => g.name.trim().toLowerCase());

  const existing = phones.length
    ? await prisma.guest.findMany({
        where: { invitationId, phone: { in: phones } },
        select: { id: true, phone: true, tokenHash: true },
      })
    : [];

  const existingByName =
    namesWithoutPhone.length > 0
      ? await prisma.guest.findMany({
          where: {
            invitationId,
            phone: null,
          },
          select: { id: true, name: true, phone: true, tokenHash: true },
        })
      : [];

  const existingByPhone = new Map(existing.map((e) => [e.phone, e]));
  const existingByNameBuckets = new Map<string, typeof existingByName>();
  for (const guest of existingByName) {
    const key = guest.name.trim().toLowerCase();
    const bucket = existingByNameBuckets.get(key) ?? [];
    bucket.push(guest);
    existingByNameBuckets.set(key, bucket);
  }

  const result: AddGuestsResult = { created: 0, reused: 0, skipped: 0, guests: [] };

  const toCreate: Array<{
    invitationId: string;
    name: string;
    side: 'bride' | 'groom' | null;
    hasPlusOne: boolean;
    plusOneName: string | null;
    householdLabel: string | null;
    phone: string | null;
    tokenHash: string;
    resultIndex: number;
  }> = [];
  const toUpdate: Array<{
    id: string;
    name: string;
    phone: string | null;
    hasPlusOne: boolean;
    plusOneName: string | null;
    householdLabel: string | null;
  }> = [];

  for (const g of unique) {
    const { token, tokenHash } = generateGuestToken();
    const data = {
      invitationId,
      name: g.name,
      side: (g.side ?? null) as 'bride' | 'groom' | null,
      hasPlusOne: g.hasPlusOne ?? false,
      plusOneName: g.plusOneName || null,
      householdLabel: g.householdLabel?.trim().slice(0, 100) || null,
      phone: g.phoneNormalized,
      tokenHash,
    };

    if (options.reuseByPhone && g.phoneNormalized && existingByPhone.has(g.phoneNormalized)) {
      const existingGuest = existingByPhone.get(g.phoneNormalized)!;
      toUpdate.push({
        id: existingGuest.id,
        name: g.name,
        phone: g.phoneNormalized,
        hasPlusOne: g.hasPlusOne ?? false,
        plusOneName: g.plusOneName || null,
        householdLabel: data.householdLabel,
      });
      result.reused += 1;
      result.guests.push({ id: existingGuest.id, name: g.name, token: '', phone: g.phoneNormalized });
    } else if (options.reuseByPhone && !g.phoneNormalized) {
      const matchingGuests = existingByNameBuckets.get(g.name.trim().toLowerCase()) ?? [];
      const existingGuest = matchingGuests.length === 1 ? matchingGuests[0] : null;
      if (!existingGuest) {
        toCreate.push({ ...data, resultIndex: result.guests.length });
        result.created += 1;
        result.guests.push({ id: '', name: g.name, token, phone: null });
        continue;
      }
      toUpdate.push({
        id: existingGuest.id,
        name: g.name,
        phone: null,
        hasPlusOne: g.hasPlusOne ?? false,
        plusOneName: g.plusOneName || null,
        householdLabel: data.householdLabel,
      });
      result.reused += 1;
      result.guests.push({ id: existingGuest.id, name: g.name, token: '', phone: null });
    } else {
      toCreate.push({ ...data, resultIndex: result.guests.length });
      result.created += 1;
      result.guests.push({ id: '', name: g.name, token, phone: g.phoneNormalized });
    }
  }

  await prisma.$transaction(async (tx) => {
    if (toCreate.length > 0) {
      const created = await tx.guest.createManyAndReturn({
        data: toCreate.map(({ resultIndex: _resultIndex, ...guestData }) => guestData),
      });
      for (const [index, c] of created.entries()) {
        const resultIndex = toCreate[index]?.resultIndex;
        if (resultIndex === undefined) continue;
        const entry = result.guests[resultIndex];
        if (entry) {
          entry.id = c.id;
        }
      }
    }

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map((u) =>
          tx.guest.update({
            where: { id: u.id },
            data: {
              name: u.name,
              phone: u.phone,
              hasPlusOne: u.hasPlusOne,
              plusOneName: u.plusOneName,
              householdLabel: u.householdLabel,
            },
          })
        )
      );
    }
  });

  return result;
}

export interface UpdateGuestInput {
  guestId: string;
  userId: string;
  name: string;
  phone?: string | null;
  side?: 'bride' | 'groom' | null;
  hasPlusOne?: boolean;
  plusOneName?: string | null;
  householdLabel?: string | null;
}

export async function updateGuestForUser(input: UpdateGuestInput) {
  let normalizedPhone: string | null | undefined;
  if (input.phone !== undefined) {
    if (!input.phone || input.phone.trim() === '') {
      normalizedPhone = null;
    } else {
      normalizedPhone = normalizePhone(input.phone);
      if (!validatePhone(normalizedPhone)) {
        throw new GuestValidationError(
          'Номер телефона должен быть в формате +77XXXXXXXXX (Казахстан) или +79XXXXXXXXX (Россия)'
        );
      }
    }
  }

  const guest = await prisma.guest.findFirst({
    where: { id: input.guestId, invitation: { userId: input.userId } },
    select: { id: true, invitationId: true },
  });

  if (!guest) {
    throw new GuestNotFoundError();
  }

  const updated = await prisma.guest.update({
    where: { id: input.guestId },
    data: {
      name: input.name,
      ...(input.phone !== undefined ? { phone: normalizedPhone ?? null } : {}),
      ...(input.side !== undefined ? { side: input.side } : {}),
      ...(input.hasPlusOne !== undefined ? { hasPlusOne: input.hasPlusOne } : {}),
      ...(input.plusOneName !== undefined ? { plusOneName: input.plusOneName || null } : {}),
      ...(input.householdLabel !== undefined
        ? { householdLabel: input.householdLabel?.trim().slice(0, 100) || null }
        : {}),
    },
  });

  return { updated, invitationId: guest.invitationId };
}

export async function deleteGuestForUser(guestId: string, userId: string) {
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, invitation: { userId } },
    select: { id: true, invitationId: true },
  });

  if (!guest) {
    throw new GuestNotFoundError();
  }

  await prisma.guest.delete({ where: { id: guestId } });
  return { invitationId: guest.invitationId };
}

export function buildWhatsAppLink(phone: string, message: string): string | null {
  const digits = formatPhoneForWhatsApp(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function formatPhoneForWhatsApp(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 11 && digits.startsWith('7')) return digits;
  if (digits.length === 10) return `7${digits}`;
  return null;
}

export async function getGuestStatsForInvitation(invitationId: string) {
  const [totalResult, respondedResult] = await Promise.all([
    prisma.guest.count({ where: { invitationId } }),
    prisma.guestResponse.count({
      where: { guest: { invitationId } },
    }),
  ]);

  const total = totalResult;
  const responded = respondedResult;
  const pending = total - responded;

  const byStatus = await prisma.guestResponse.groupBy({
    by: ['status'],
    where: { guest: { invitationId } },
    _count: { _all: true },
  });

  const statusCounts = new Map(byStatus.map((r) => [r.status, r._count._all]));
  const attending = statusCounts.get('attending') ?? 0;
  const attendingPlusOne = statusCounts.get('attending_plus_one') ?? 0;
  const attendingNoChildren = statusCounts.get('attending_no_children') ?? 0;
  const notAttending = statusCounts.get('not_attending') ?? 0;
  const expectedGuests = attending + attendingNoChildren + attendingPlusOne * 2;

  return { total, responded, pending, attending, attendingPlusOne, attendingNoChildren, notAttending, expectedGuests };
}
