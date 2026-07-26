/** Shared countdown unit labels for invitation layouts. */

export function getCountdownUnits(
  diffMs: number,
  t: (key: string) => string
): Array<{ value: number; label: string }> {
  if (diffMs <= 0) return [];
  return [
    { value: Math.floor(diffMs / (1000 * 60 * 60 * 24)), label: t('public.countdown.days') },
    { value: Math.floor((diffMs / (1000 * 60 * 60)) % 24), label: t('public.countdown.hours') },
    { value: Math.floor((diffMs / (1000 * 60)) % 60), label: t('public.countdown.minutes') },
    { value: Math.floor((diffMs / 1000) % 60), label: t('public.countdown.seconds') },
  ];
}
