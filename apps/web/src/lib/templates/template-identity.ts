export type TemplateFeature = 'rsvp' | 'music' | 'map' | 'countdown' | 'wishes';

export interface TemplateIdentityProfile {
  features: TemplateFeature[];
  signatureRu: string;
  signatureKz: string;
}

const DEFAULT_PROFILE: TemplateIdentityProfile = {
  features: [],
  signatureRu: '',
  signatureKz: '',
};

const FEATURE_LABELS: Record<TemplateFeature, { ru: string; kz: string }> = {
  rsvp: { ru: 'Ответ гостей', kz: 'Қонақ жауабы' },
  music: { ru: 'Музыка', kz: 'Музыка' },
  map: { ru: 'Карта', kz: 'Карта' },
  countdown: { ru: 'Таймер', kz: 'Таймер' },
  wishes: { ru: 'Пожелания', kz: 'Тілектер' },
};

const TEMPLATE_IDENTITY_PROFILES: Record<string, TemplateIdentityProfile> = {
  'luxe-gold': {
    features: ['rsvp', 'music', 'map', 'countdown', 'wishes'],
    signatureRu: 'Свадебное приглашение в золотой палитре с кинематографичным конвертом',
    signatureKz: 'Алтын түсті үйлену той шақыруы — конверт анимациясымен',
  },
};

export function getTemplateIdentityProfile(templateSlug: string): TemplateIdentityProfile {
  return TEMPLATE_IDENTITY_PROFILES[templateSlug] ?? DEFAULT_PROFILE;
}

export function getTemplateSignature(
  templateSlug: string,
  locale: 'kz' | 'ru' = 'ru',
): string {
  const profile = getTemplateIdentityProfile(templateSlug);
  return locale === 'kz' ? profile.signatureKz || profile.signatureRu : profile.signatureRu;
}

export function getTemplateFeatureLabel(
  feature: TemplateFeature,
  locale: 'kz' | 'ru' = 'ru',
): string {
  const labels = FEATURE_LABELS[feature];
  return locale === 'kz' ? labels.kz : labels.ru;
}
