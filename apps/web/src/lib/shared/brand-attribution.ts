/** Brand line under invitation footers — dynamic year. */
export function brandAttributionLine(year = new Date().getFullYear()): string {
  return `QazShaqyru · ${year}`;
}
