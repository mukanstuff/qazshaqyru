/**
 * Formats a tenge amount as a group-separated string — deterministically.
 *
 * Prices were formatted with `Number.toLocaleString('ru-RU' | 'kk-KZ')`, which
 * depends on the ICU data of whoever runs it. Node and the browser do not
 * always agree on the group separator for these locales (narrow no-break space
 * vs. plain space vs. comma), so a price rendered on the server and re-rendered
 * on the client could differ character-for-character — which React reports as
 * "Text content does not match server-rendered HTML" and treats as a failed
 * hydration for that subtree. It was reproducible on the template preview page.
 *
 * The separator is fixed here instead: a regular space, which is how prices are
 * written in Kazakhstan in both languages ("3 990 ₸"). Same input, same output,
 * on every runtime.
 */
export function formatKzt(amount: number): string {
  const rounded = Math.round(Number.isFinite(amount) ? amount : 0);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();
  // Group from the right in threes.
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${grouped}`;
}

/** Same, with the currency sign appended. */
export function formatKztWithSign(amount: number): string {
  return `${formatKzt(amount)} ₸`;
}
