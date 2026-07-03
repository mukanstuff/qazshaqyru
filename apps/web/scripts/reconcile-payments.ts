/**
 * Poll Kaspi/Freedom for stale pending orders — run via scheduler or: pnpm reconcile-payments
 */
import { PrismaClient } from '@prisma/client';
import { reconcilePendingPayments } from '../src/lib/payment-sync';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const limit = Math.max(1, Math.min(parseInt(process.env.RECONCILE_BATCH_LIMIT || '100', 10), 500));

reconcilePendingPayments(limit)
  .then((result) => {
    console.log(
      `[reconcile] scanned: ${result.scanned} | paid: ${result.paid} | still pending: ${result.stillPending}`
    );
  })
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error('[reconcile] fatal error:', err);
    prisma.$disconnect();
    process.exit(1);
  });
