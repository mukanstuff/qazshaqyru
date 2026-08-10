'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';
import { SITE_FOOTER_LINK_KEYS, SITE_FOOTER_SEO_LINKS } from '@/lib/site/footer-links';
import {
  SITE_LEGAL,
  getPublicInstagramUrl,
  getPublicPhoneDisplay,
  getPublicPhoneDigits,
  getSupportTelHref,
  getWhatsappHref,
  getPublicWhatsappNumber,
} from '@/lib/site/legal-config';

const SERVICE_HREFS = new Set([
  '/templates',
  '/pricing',
  '/faq',
  '/blog',
  '/about',
  '/contacts',
]);

const LEGAL_HREFS = new Set(['/offer', '/terms', '/privacy', '/refund']);

export function SiteCompactFooter() {
  const { t, locale } = useI18n();
  const year = new Date().getFullYear();
  const instagramUrl = getPublicInstagramUrl();
  const phoneDisplay = getPublicPhoneDisplay();
  const whatsapp = getPublicWhatsappNumber();
  const address =
    locale === 'kz' ? t('landing.v2.footer.location') : SITE_LEGAL.address;

  const serviceLinks = SITE_FOOTER_LINK_KEYS.filter((l) => SERVICE_HREFS.has(l.href));
  const legalLinks = SITE_FOOTER_LINK_KEYS.filter((l) => LEGAL_HREFS.has(l.href));
  const seoTitle = locale === 'kz' ? 'Той және қалалар' : 'Тои и города';

  return (
    <footer data-nav-theme="dark" className="relative overflow-hidden bg-[#1F3A2E] text-[#FFFBEB]">
      {/* Subtle meadow glow, no harsh gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#F59E0B]/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#16A34A]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div className="mb-10 grid gap-10 md:grid-cols-4">
          <div>
            <LocaleLink
              href="/"
              className="font-display text-xl tracking-wide text-[#FFFBEB] transition-opacity hover:opacity-90"
            >
              <span style={{ color: '#BBF7D0' }}>Qaz</span>Shaqyru
            </LocaleLink>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#FFFBEB]/75">
              {t('landing.v2.footer.about')}
            </p>
            <p className="mt-4 text-sm text-[#FFFBEB]/60">{address}</p>
            {instagramUrl ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-[#FFFBEB]/80 transition-colors hover:text-[#FFFBEB]"
              >
                Instagram
              </a>
            ) : null}
          </div>

          <div>
            <h4 className="mb-4 text-sm font-medium text-[#FFFBEB]">
              {t('landing.v2.footer.serviceTitle')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {serviceLinks.map(({ href, labelKey }) => (
                <li key={href}>
                  <LocaleLink href={href} className="text-[#FFFBEB]/80 transition-colors hover:text-[#FFFBEB]">
                    {t(labelKey)}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-medium text-[#FFFBEB]">{seoTitle}</h4>
            <ul className="space-y-2.5 text-sm">
              {SITE_FOOTER_SEO_LINKS.map(({ href, labelRu, labelKz }) => (
                <li key={href}>
                  <LocaleLink href={href} className="text-[#FFFBEB]/80 transition-colors hover:text-[#FFFBEB]">
                    {locale === 'kz' ? labelKz : labelRu}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-medium text-[#FFFBEB]">
              {t('landing.v2.footer.contactsTitle')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={`mailto:${SITE_LEGAL.email}`}
                  className="text-[#FFFBEB]/80 transition-colors hover:text-[#FFFBEB]"
                >
                  {SITE_LEGAL.email}
                </a>
              </li>
              {whatsapp ? (
                <li>
                  <a
                    href={getWhatsappHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FFFBEB]/80 transition-colors hover:text-[#FFFBEB]"
                  >
                    WhatsApp
                  </a>
                </li>
              ) : null}
              {phoneDisplay && getPublicPhoneDigits() ? (
                <li>
                  <a
                    href={getSupportTelHref()}
                    className="text-[#FFFBEB]/80 transition-colors hover:text-[#FFFBEB]"
                  >
                    {phoneDisplay}
                  </a>
                </li>
              ) : null}
            </ul>
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#FFFBEB]/55">
              {legalLinks.map(({ href, labelKey }) => (
                <li key={href}>
                  <LocaleLink href={href} className="transition-colors hover:text-[#FFFBEB]">
                    {t(labelKey)}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#FFFBEB]/10 pt-6 text-xs text-[#FFFBEB]/55">
          © {year} QazShaqyru. {t('landing.v2.footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
