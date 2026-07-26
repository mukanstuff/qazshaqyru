import type { InvitationData } from '@/components/invitation-layouts/types';
import type { TemplateManifest } from './manifest-types';

export const DEFAULT_BODY_KZ =
  'Құрметті ағайын-туыс, бауырлар, құда-жекжат, нағашы-жиен, бөлелер, құрбы-құрдас, әпке-жезделер, дос-жарандар, әріптестер, көршілер!\n\n' +
  'Сіз(дер)ді ұлымыз {groomName} пен келініміз {brideName}тың үйлену тойына арналған салтанатты ақ дастарханымыздың қадірлі қонағы болуға шақырамыз.';

export const DEFAULT_BODY_RU =
  'Дорогие родные, друзья и близкие!\n\n' +
  'Приглашаем вас на торжественный свадебный банкет {groomName} и {brideName}. Будем рады видеть вас за нашим праздничным дастарханом!';

function parseNamesFromTitle(title: string): { bride: string; groom: string } {
  const raw = title.trim();
  if (!raw) {
    return { bride: '', groom: '' };
  }

  const separators = ['&', ' и ', ' және ', ' – ', ' — ', ' - '];
  for (const sep of separators) {
    const parts = raw.split(sep).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      // Title convention: bride & groom (see buildInvitationTitle)
      return { bride: parts[0], groom: parts[1] };
    }
  }

  // Single event title / one name — never invent placeholder «Жігіт»
  return { bride: raw, groom: '' };
}

function pickName(
  custom: unknown,
  fallback: string
): string {
  if (typeof custom === 'string' && custom.trim()) return custom.trim();
  return fallback.trim();
}

/** Map invitation DB fields → manifest field keys for section rendering. */
export function resolveManifestFields(invitation: InvitationData): Record<string, string> {
  const ct = invitation.customText ?? {};
  const td = invitation.templateData ?? {};
  const { bride, groom } = parseNamesFromTitle(invitation.title);
  const isKz = invitation.language === 'kz';

  const groomName = pickName(ct.groomName, groom);
  const brideName = pickName(ct.brideName, bride);

  return {
    groomName,
    brideName,
    hostsLine: String(
      ct.hostsLine ??
        (isKz ? 'Құрметпен, той иелері:' : 'С уважением, семья молодых:'),
    ),
    eventDate: invitation.eventDate,
    eventTime: invitation.eventTime ?? '17:00',
    venueName: invitation.eventPlace ?? '',
    venueAddress: invitation.address ?? '',
    mapUrl: invitation.mapUrl ?? '',
    bodyTextKz: String(ct.bodyTextKz ?? ct.greeting ?? DEFAULT_BODY_KZ),
    bodyTextRu: String(ct.bodyTextRu ?? ct.greeting ?? DEFAULT_BODY_RU),
    coverPhoto: String(td.coverPhoto ?? td.backgroundImage ?? ''),
    dressCodeTitle: String(ct.dressCodeTitle ?? ''),
    dressCodeNote: String(ct.dressCodeNote ?? ''),
    galleryPhoto1: String(td.galleryPhoto1 ?? ''),
    galleryPhoto2: String(td.galleryPhoto2 ?? ''),
    galleryPhoto3: String(td.galleryPhoto3 ?? ''),
    galleryPhoto4: String(td.galleryPhoto4 ?? ''),
    finalText: String(ct.finalText ?? ''),
    language: invitation.language,
  };
}

export function interpolateFieldTemplate(
  template: string,
  fields: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => fields[key] ?? '');
}

export function getFieldDefault(
  manifest: TemplateManifest,
  key: string,
  locale: 'kz' | 'ru',
): string | undefined {
  const def = manifest.fields.find((f) => f.key === key);
  if (!def) return undefined;
  return locale === 'kz' ? def.defaultKz : def.defaultRu;
}
