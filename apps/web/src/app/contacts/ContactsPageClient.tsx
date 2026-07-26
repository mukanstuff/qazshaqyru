'use client';

import { Mail, MessageCircle, Phone } from 'lucide-react';

import { PublicShell } from '@/components/shared/PublicShell';
import { useI18n } from '@/i18n';
import {
  SITE_LEGAL,
  getPublicPhoneDisplay,
  getPublicPhoneDigits,
  getPublicWhatsappNumber,
  getSupportMailto,
  getSupportTelHref,
  getWhatsappHref,
} from '@/lib/site/legal-config';

export function ContactsPageClient({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const { t, locale } = useI18n();
  const whatsapp = getPublicWhatsappNumber();
  const whatsappHref = getWhatsappHref(t('site.contacts.whatsappPrefill'));
  const phoneDisplay = getPublicPhoneDisplay();
  const hasPhone = Boolean(getPublicPhoneDigits() && phoneDisplay);
  const address =
    locale === 'kz' ? t('landing.v2.footer.location') : SITE_LEGAL.address;

  const cardClass =
    'flex items-start gap-4 rounded-[1.5rem] border border-black/[0.06] bg-white p-5 shadow-[0_12px_36px_-24px_rgba(44,24,16,0.35)] transition hover:-translate-y-0.5 hover:border-us-accent/20';

  return (
    <PublicShell isLoggedIn={isLoggedIn}>
      <section className="mx-auto max-w-3xl px-6 py-14 md:py-20">
        <p className="us-overline">{t('site.contacts.overline')}</p>
        <h1 className="mt-3 font-display text-4xl text-us-ink md:text-5xl">
          {t('site.contacts.title')}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-us-ink-muted">
          {t('site.contacts.subtitle')}
        </p>

        <ul className="mt-10 space-y-4">
          {whatsapp ? (
            <li>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-us-accent/8 text-us-accent">
                  <MessageCircle className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-lg text-us-ink">{t('site.contacts.whatsapp')}</p>
                  <p className="mt-1 text-sm text-us-ink-muted">WhatsApp</p>
                </div>
              </a>
            </li>
          ) : (
            <li>
              <a href={getSupportMailto()} className={cardClass}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-us-accent/8 text-us-accent">
                  <MessageCircle className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-lg text-us-ink">{t('site.contacts.whatsapp')}</p>
                  <p className="mt-1 text-sm text-us-ink-muted">{SITE_LEGAL.email}</p>
                </div>
              </a>
            </li>
          )}
          <li>
            <a href={getSupportMailto()} className={cardClass}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-us-accent/8 text-us-accent">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-lg text-us-ink">{t('site.contacts.email')}</p>
                <p className="mt-1 text-sm text-us-ink-muted">{SITE_LEGAL.email}</p>
              </div>
            </a>
          </li>
          {hasPhone ? (
            <li>
              <a href={getSupportTelHref()} className={cardClass}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-us-accent/8 text-us-accent">
                  <Phone className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-lg text-us-ink">{t('site.contacts.phone')}</p>
                  <p className="mt-1 text-sm text-us-ink-muted">{phoneDisplay}</p>
                </div>
              </a>
            </li>
          ) : null}
        </ul>

        <p className="mt-10 text-sm text-us-ink-muted">{address}</p>
      </section>
    </PublicShell>
  );
}
