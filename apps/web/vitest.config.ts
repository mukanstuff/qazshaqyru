import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: [path.resolve(__dirname, './src/test/setup-prisma-mock.ts')],
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: ['src/lib/**/*.ts'],
      exclude: [
        'src/lib/__tests__/**',
        'src/lib/shared/db.ts',
        'src/lib/shared/db-server.ts',
        'src/lib/invitations/actions.ts',
        'src/lib/shared/api.ts',
        'src/lib/auth/api-edge.ts',
        'src/lib/payments/checkout.ts',
        'src/lib/payments/checkout-client.ts',
        'src/lib/payments/index.ts',
        'src/lib/payments/payment-sync.ts',
        'src/lib/payments/payment-route-auth.ts',
        'src/lib/payments/invitation-payment-sync.ts',
        'src/lib/payments/order-completion.ts',
        'src/lib/invitations/draft-storage.ts',
        'src/lib/invitations/draft-sync-client.ts',
        'src/lib/uploads/upload-client.ts',
        'src/lib/uploads/upload-registry.ts',
        'src/lib/uploads/upload-validation.ts',
        'src/lib/shared/notifications.ts',
        'src/lib/shared/cleanup.ts',
        'src/lib/guests/calendar-ics.ts',
        'src/lib/shared/types.ts',
        'src/lib/shared/utils.ts',
        'src/lib/templates/program-presets.ts',
        'src/lib/shared/countdown-labels.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 78,
        functions: 76,
        branches: 74,
        statements: 78,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
