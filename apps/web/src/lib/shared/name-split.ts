/**
 * Splits a free-form "names" string into [first, second].
 *
 * Recognised separators: "&", "и", "және" (the conjunction used by the
 * QuickWizard). The Cyrillic word-form connectors are matched only when
 * flanked by whitespace / non-letter chars — otherwise `И` inside a name
 * (Иван, Айгерим) would split on every match.
 */
export function splitCoupleNames(names: string): string[] {
  const trimmed = (names || '').trim();
  if (!trimmed) return [];
  const SEPARATOR_CORE =
    /&|(?<![а-яёА-ЯЁa-zA-Z])и(?![а-яёА-ЯЁa-zA-Z])|(?<![а-яёА-ЯЁa-zA-Z])және(?![а-яёА-ЯЁa-zA-Z])/i;
  return trimmed
    .split(new RegExp(`\\s*(?:${SEPARATOR_CORE.source})\\s*`, 'i'))
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Splits a "names" string into groomName + brideName halves for customText.
 * If only one name is given, it goes to groomName.
 */
export function namesToGroomBride(names: string): {
  groomName?: string;
  brideName?: string;
} {
  const parts = splitCoupleNames(names);
  if (parts.length === 0) return {};
  if (parts.length === 1) {
    const first = parts[0].trim();
    return first ? { groomName: first } : {};
  }
  const groomName = parts[0].trim();
  const brideName = parts[1].trim();
  return {
    ...(groomName ? { groomName } : {}),
    ...(brideName ? { brideName } : {}),
  };
}