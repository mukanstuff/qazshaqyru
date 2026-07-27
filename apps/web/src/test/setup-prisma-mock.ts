import { vi } from 'vitest';

// Auto-mock prisma client at module resolution so unit tests don't
// accidentally trigger the real `new PrismaClient()` during import.
// Tests that need specific DB behavior override via vi.hoisted + vi.mock
// inside their own file (those mocks take priority).
vi.mock('@/lib/shared/db', () => {
  function makeStub(): any {
    return new Proxy({} as any, {
      get: (_t, prop) => {
        if (prop === '$transaction') {
          return async (fn: any) => (typeof fn === 'function' ? fn(makeStub()) : []);
        }
        if (prop === '$queryRaw' || prop === '$executeRaw') {
          return async () => [];
        }
        if (prop === '$disconnect') return async () => {};
        return vi.fn().mockResolvedValue([]);
      },
    });
  }
  return { default: makeStub(), prisma: makeStub() };
});
