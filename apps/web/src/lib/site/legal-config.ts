/**
 * Единый источник реквизитов для legal/контактных страниц.
 *
 * Перед продом OWNER обязан заполнить (см. docs/LAUNCH-OWNER-CHECKLIST.md):
 * - operatorName (ФИО ИП / название ТОО)
 * - binOrIin (БИН или ИИН)
 * - address (точный юр.адрес)
 * - подтвердить email / телефон
 *
 * Публичные поверхности не показывают плейсхолдеры «[УКАЗАТЬ…]»
 * и фейковый телефон — см. hasPublicLegalOperator / getPublicPhoneDisplay.
 * Не коммитьте реальные паспортные данные в публичный git без необходимости —
 * можно передать агенту в чат для вставки перед go-live.
 */

const PLACEHOLDER_MARKERS = ['УКАЗАТЬ', '[', ']'] as const;

export const SITE_LEGAL = {
  brandName: 'QazShaqyru',
  /** Заполнить перед продом — ФИО ИП / название ТОО */
  operatorName: 'ИП [УКАЗАТЬ ФИО]',
  /** БИН или ИИН — заполнить перед продом */
  binOrIin: '[УКАЗАТЬ БИН/ИИН]',
  address: 'Алматы, Республика Казахстан',
  email: 'hello@qazshaqyru.kz',
  /** Legacy fallback if env empty — sync with WHATSAPP_NUMBER */
  phoneDisplay: '+7 (706) 609-50-44',
  phoneTel: '77066095044',
  /** Effective date shown on legal pages */
  effectiveDateRu: '1 января 2026 года',
  effectiveDateKz: '2026 жылғы 1 қаңтар',
} as const;

export type SiteLegal = typeof SITE_LEGAL;

function looksLikePlaceholder(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_MARKERS.some((m) => trimmed.includes(m));
}

/** True when founder filled real ИП/БИН (no placeholders). */
export function hasPublicLegalOperator(): boolean {
  return (
    !looksLikePlaceholder(SITE_LEGAL.operatorName) && !looksLikePlaceholder(SITE_LEGAL.binOrIin)
  );
}

/** Public Instagram URL from env; empty = hide link (no stub `#`). */
export function getPublicInstagramUrl(): string {
  const raw = process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() ?? '';
  if (!raw || raw === '#') return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw.replace(/^\/+/, '')}`;
}

const STUB_WHATSAPP_DIGITS = new Set(['77001234567', '7001234567']);

export function getPublicWhatsappNumber(): string {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') ||
    process.env.WHATSAPP_NUMBER?.replace(/\D/g, '') ||
    '';
  if (raw && !STUB_WHATSAPP_DIGITS.has(raw)) return raw;
  const fallback = SITE_LEGAL.phoneTel.replace(/\D/g, '');
  if (fallback && !STUB_WHATSAPP_DIGITS.has(fallback)) return fallback;
  return '';
}

/** Digits-only phone for tel:/display when real; empty if only stubs. */
export function getPublicPhoneDigits(): string {
  const fromEnv = getPublicWhatsappNumber();
  if (fromEnv) return fromEnv;
  const configured = SITE_LEGAL.phoneTel.replace(/\D/g, '');
  if (!configured || STUB_WHATSAPP_DIGITS.has(configured)) return '';
  return configured;
}

/** Human display like +7 (700) … or empty to hide. */
export function getPublicPhoneDisplay(): string {
  const digits = getPublicPhoneDigits();
  if (!digits) return '';
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
  }
  return `+${digits}`;
}

export function getSupportMailto(): string {
  return `mailto:${SITE_LEGAL.email}`;
}

export function getSupportTelHref(): string {
  const digits = getPublicPhoneDigits();
  if (!digits) return getSupportMailto();
  return `tel:+${digits}`;
}

export function getWhatsappHref(prefill?: string): string {
  const n = getPublicWhatsappNumber() || getPublicPhoneDigits();
  if (!n) return getSupportMailto();
  const q = prefill ? `?text=${encodeURIComponent(prefill)}` : '';
  return `https://wa.me/${n}${q}`;
}
