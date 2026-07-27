/**
 * Mock prisma client for unit tests.
 *
 * Tests that hit the DB should construct their own mocks via vi.hoisted
 * and call vi.mock('@/lib/shared/db', () => ({ default: {...} })) before
 * importing the module under test. This default mock is a minimal proxy
 * so that modules importing prisma at module scope (without calling it)
 * don't crash during test collection.
 */
import { vi } from 'vitest';

function makeStub() {
  return new Proxy({} as any, {
    get: (_t, prop) => {
      if (prop === '__isMockObject') return true;
      if (prop === '$transaction') {
        return async (fn: any) => fn(makeStub());
      }
      if (prop === '$queryRaw' || prop === '$executeRaw') {
        return async () => [];
      }
      if (prop === '$disconnect') return async () => {};
      return vi.fn().mockResolvedValue([]);
    },
  });
}

const prisma = makeStub();
export default prisma;
export { prisma };
