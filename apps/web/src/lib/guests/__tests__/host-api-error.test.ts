import { describe, expect, it } from 'vitest';
import { resolveHostApiError } from '@/lib/guests/host-api-error';

describe('resolveHostApiError', () => {
  const messages: Record<string, string> = {
    'dashboard.guestOps.apiErrors.plan_required': 'Стандарт керек',
    'dashboard.guestOps.apiErrors.not_published': 'Алдымен жариялаңыз',
    'dashboard.guestOps.exportError': 'Жүктеу сәтсіз',
  };
  const t = (key: string) => messages[key] ?? key;

  it('maps known error code to i18n', () => {
    expect(
      resolveHostApiError(
        { error: 'plan_required', message: 'CSV-экспорт на Standard' },
        t,
        'dashboard.guestOps.exportError'
      )
    ).toBe('Стандарт керек');
  });

  it('ignores RU server message when code is unknown', () => {
    expect(
      resolveHostApiError(
        { error: 'weird_code', message: 'Сырой русский текст' },
        t,
        'dashboard.guestOps.exportError'
      )
    ).toBe('Жүктеу сәтсіз');
  });

  it('uses fallback when payload empty', () => {
    expect(resolveHostApiError(null, t, 'dashboard.guestOps.exportError')).toBe('Жүктеу сәтсіз');
  });
});
