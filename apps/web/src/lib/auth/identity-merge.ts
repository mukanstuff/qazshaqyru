import 'server-only';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/shared/db';
import { generateSessionToken, getSessionExpiry, hashToken } from '@/lib/auth';
import { setSessionCookie } from '@/lib/shared/api';
import type { SessionUser } from '@/lib/shared/api';
import { NextResponse } from 'next/server';

export type IdentityProvider = 'google' | 'whatsapp' | 'phone';

export type MergeIdentityArgs = {
  provider: IdentityProvider;
  providerId: string;
  providerEmail: string | null;
  /** Best-effort display fields; only used when we create a brand-new user. */
  displayName?: string | null;
  avatarUrl?: string | null;
  /** Locale hint ('ru' | 'kz') — defaults to 'ru'. */
  language?: 'ru' | 'kz';
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Find or create a User bound to a (provider, providerId) Identity row.
 * - If an Identity already exists, return its user (and refresh lastUsedAt).
 * - Otherwise, look for a User with the same email and attach the identity to it.
 *   If no such user exists, create both.
 *
 * Returns the user id and a SessionUser shape. Does NOT issue a session — caller does that.
 */
export async function mergeIdentity(args: MergeIdentityArgs): Promise<SessionUser> {
  const existing = await prisma.identity.findUnique({
    where: { provider_providerId: { provider: args.provider, providerId: args.providerId } },
    include: { user: true },
  });

  let userId: string;
  let user: { id: string; phone: string | null; email: string | null; avatarUrl: string | null; language: 'kz' | 'ru'; name: string | null; isAdmin: boolean };

  if (existing) {
    userId = existing.userId;
    user = {
      id: existing.user.id,
      phone: existing.user.phone,
      email: existing.user.email,
      avatarUrl: existing.user.avatarUrl,
      language: existing.user.language,
      name: existing.user.name,
      isAdmin: existing.user.isAdmin,
    };
    await prisma.identity.update({
      where: { id: existing.id },
      data: { lastUsedAt: new Date() },
    });
  } else {
    let linkedUserId: string | null = null;
    if (args.providerEmail) {
      const byEmail = await prisma.user.findUnique({ where: { email: args.providerEmail } });
      if (byEmail) linkedUserId = byEmail.id;
    }

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const uid = linkedUserId ?? (await tx.user.create({
        data: {
          email: args.providerEmail,
          avatarUrl: args.avatarUrl ?? null,
          name: args.displayName ?? null,
          language: args.language ?? 'ru',
        },
        select: { id: true, phone: true, email: true, avatarUrl: true, language: true, name: true, isAdmin: true },
      })).id;

      // If linked existing user, fill in missing fields.
      if (linkedUserId) {
        const updated = await tx.user.update({
          where: { id: linkedUserId },
          data: {
            avatarUrl: args.avatarUrl ?? undefined,
            name: args.displayName ?? undefined,
          },
          select: { id: true, phone: true, email: true, avatarUrl: true, language: true, name: true, isAdmin: true },
        });
        await tx.identity.create({
          data: {
            userId: linkedUserId,
            provider: args.provider,
            providerId: args.providerId,
            providerEmail: args.providerEmail,
            lastUsedAt: new Date(),
          },
        });
        return updated;
      }

      await tx.identity.create({
        data: {
          userId: uid,
          provider: args.provider,
          providerId: args.providerId,
          providerEmail: args.providerEmail,
          lastUsedAt: new Date(),
        },
      });
      return await tx.user.findUniqueOrThrow({
        where: { id: uid },
        select: { id: true, phone: true, email: true, avatarUrl: true, language: true, name: true, isAdmin: true },
      });
    });
    user = created;
    userId = created.id;
  }

  void userId;
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    avatarUrl: user.avatarUrl,
    language: user.language,
    name: user.name,
    isAdmin: user.isAdmin,
  };
}

export type IssueSessionArgs = {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function issueSession(args: IssueSessionArgs): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = getSessionExpiry();
  const tokenHash = hashToken(token);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.session.updateMany({
      where: { userId: args.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.session.create({
      data: {
        userId: args.userId,
        tokenHash,
        expiresAt,
        deviceInfo: args.userAgent ?? null,
        ipAddress: args.ipAddress ?? null,
      },
    });
  });

  return { token, expiresAt };
}

export function buildSessionResponse(user: SessionUser, token: string, expiresAt: Date) {
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
      language: user.language,
      name: user.name,
      isAdmin: user.isAdmin,
    },
    expiresAt: expiresAt.toISOString(),
  });
  setSessionCookie(response, token, expiresAt);
  return response;
}