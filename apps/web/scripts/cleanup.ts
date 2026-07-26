/**
 * Periodic cleanup — run via cron or: pnpm cleanup
 */
import { PrismaClient } from '@prisma/client';
import { runDatabaseCleanup } from '../src/lib/shared/cleanup';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

runDatabaseCleanup()
  .then((result) => {
    console.log(
      `[cleanup] ${result.ranAt} | sessions: ${result.expiredSessions} | ` +
        `otp: ${result.expiredOtps} | rate_limits: ${result.expiredRateLimits} | ` +
        `uploads: ${result.uploadsRemoved} removed (${result.protectedUploads} protected, registry pruned: ${result.registryPruned})`
    );
  })
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error('[cleanup] fatal error:', err);
    prisma.$disconnect();
    process.exit(1);
  });
