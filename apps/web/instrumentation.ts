export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./src/lib/env');
    validateEnv();

    if (process.env.NODE_ENV === 'production') {
      const { logProductionStartupSummary } = await import('./src/lib/production-startup');
      logProductionStartupSummary();
    }
  }
}
