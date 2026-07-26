'use client';

import {
  CreditCard,
  LayoutTemplate,
  MessageCircle,
  Pencil,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { useI18n } from '@/i18n';

const FEATURE_ICONS: LucideIcon[] = [
  LayoutTemplate,
  Pencil,
  UserCheck,
  MessageCircle,
  CreditCard,
  Users,
];

const FEATURE_KEYS = ['templates', 'editor', 'rsvp', 'whatsapp', 'payment', 'guests'] as const;

export function LandingFeatures() {
  const { t } = useI18n();

  return (
    <section className="landing-section">
      <div className="us-container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="us-overline mb-4 text-[var(--us-sage)]">
            {t('landing.features.overline')}
          </p>
          <h2 className="us-display-l text-[var(--us-forest)]">
            {t('landing.features.title')}
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_KEYS.map((key, index) => {
            const Icon = FEATURE_ICONS[index]!;
            return (
              <article
                key={key}
                className="rounded-2xl border border-[var(--us-sage)]/20 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--us-sage)]/15 text-[var(--us-forest)]">
                  <Icon size={22} strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="mb-2 font-display text-xl text-[var(--us-forest)]">
                  {t(`landing.features.${key}Title`)}
                </h3>
                <p className="font-body text-sm leading-relaxed text-[var(--us-forest)]/70">
                  {t(`landing.features.${key}Desc`)}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
