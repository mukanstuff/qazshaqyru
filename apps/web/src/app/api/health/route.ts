import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Liveness/readiness probe.
 *
 * Returns 200 if the app and the database are reachable. Returns 503
 * otherwise. Used by Docker healthcheck, Caddy, and uptime monitors.
 *
 * NOTE: This endpoint is intentionally cheap - we just run `SELECT 1`.
 * Avoid putting any expensive check here, it can become a self-DoS
 * vector when called every few seconds by multiple monitors.
 */
export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: 'ok',
        database: 'up',
        latencyMs: Date.now() - start,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: 'degraded',
        database: 'down',
        error: err instanceof Error ? err.message : 'unknown',
        latencyMs: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
