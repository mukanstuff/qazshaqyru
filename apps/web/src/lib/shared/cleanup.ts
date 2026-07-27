/**
 * Database + upload cleanup utilities.
 * Run via `pnpm cleanup` (scripts/cleanup.ts) or cron.
 */
import { readdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import prisma from '@/lib/shared/db';
import { loadRegistryProtectedPaths, pruneUploadRegistry } from '@/lib/uploads/upload-registry';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');
const UPLOAD_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const DEFAULT_INVITATION_RETENTION_DAYS = 365;

function getInvitationRetentionDays(): number {
  const raw = process.env.INVITATION_RETENTION_DAYS;
  if (!raw) return DEFAULT_INVITATION_RETENTION_DAYS;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INVITATION_RETENTION_DAYS;
}

export interface CleanupResult {
  expiredSessions: number;
  expiredOtps: number;
  expiredRateLimits: number;
  uploadsRemoved: number;
  protectedUploads: number;
  registryPruned: number;
  archivedInvitations: number;
  ranAt: string;
}

function extractUploadPath(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/uploads/')) return null;
  return url.split('?')[0] ?? null;
}

function collectUrlsFromJson(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    const p = extractUploadPath(value);
    if (p) out.add(p);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectUrlsFromJson(v, out));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((v) => collectUrlsFromJson(v, out));
  }
}

export async function loadProtectedUploadPaths(now = new Date()): Promise<Set<string>> {
  const protectedPaths = new Set<string>();
  const invitations = await prisma.invitation.findMany({
    where: { status: { in: ['draft', 'published'] } },
    select: { musicUrl: true, templateData: true },
  });

  for (const inv of invitations) {
    const p = extractUploadPath(inv.musicUrl);
    if (p) protectedPaths.add(p);
    collectUrlsFromJson(inv.templateData, protectedPaths);
  }

  // Registry-based protected paths are a synchronous in-memory set; kept for
  // future expansion. Currently returns an empty set (DB cross-reference covers it).
  const registryPaths = loadRegistryProtectedPaths();
  for (const p of registryPaths) {
    protectedPaths.add(p);
  }
  void now;

  return protectedPaths;
}

export async function cleanupOldUploads(
  now: Date,
  protectedPaths: Set<string>
): Promise<number> {
  if (!existsSync(UPLOAD_ROOT)) return 0;

  let removed = 0;
  const cutoff = now.getTime() - UPLOAD_MAX_AGE_MS;

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      const relative =
        '/' + path.relative(path.join(process.cwd(), 'public'), fullPath).replace(/\\/g, '/');
      if (protectedPaths.has(relative)) continue;

      const info = await stat(fullPath);
      if (info.mtimeMs < cutoff) {
        await unlink(fullPath);
        removed += 1;
      }
    }
  }

  await walk(UPLOAD_ROOT);
  return removed;
}

export async function runDatabaseCleanup(): Promise<CleanupResult> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const protectedPaths = await loadProtectedUploadPaths();

  const [sessions, otps, rateLimits, uploadsRemoved, registryPruned, archivedInvitations] = await Promise.all([
    prisma.$transaction([
      prisma.session.updateMany({
        where: { expiresAt: { lt: now }, revokedAt: null },
        data: { revokedAt: now },
      }),
      prisma.session.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: thirtyDaysAgo } }, { revokedAt: { lt: thirtyDaysAgo } }],
        },
      }),
    ]),
    prisma.oTPToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.rateLimitEntry.deleteMany({
      where: {
        resetAt: { lt: now },
        NOT: {
          blocked: true,
          blockedUntil: { gt: now },
        },
      },
    }),
    cleanupOldUploads(now, protectedPaths),
    pruneUploadRegistry((_rec) => true),
    prisma.invitation.updateMany({
      where: {
        status: 'published',
        publishedAt: {
          lt: new Date(now.getTime() - getInvitationRetentionDays() * 24 * 60 * 60 * 1000),
        },
      },
      data: { status: 'archived', archivedAt: now },
    }),
  ]);

  return {
    expiredSessions: sessions[0].count + sessions[1].count,
    expiredOtps: otps.count,
    expiredRateLimits: rateLimits.count,
    uploadsRemoved,
    protectedUploads: protectedPaths.size,
    registryPruned,
    archivedInvitations: archivedInvitations.count,
    ranAt: now.toISOString(),
  };
}
