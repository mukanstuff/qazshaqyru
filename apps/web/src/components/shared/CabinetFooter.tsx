'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';
import { SITE_FOOTER_LINK_KEYS } from '@/lib/site/footer-links';
import {
  SITE_LEGAL,
  getWhatsappHref,
  getPublicWhatsappNumber,
} from '@/lib/site/legal-config';

const LEGAL_HREFS = new Set(['/offer', '/terms', '/privacy', '/refund']);

/**
 * The footer for signed-in screens.
 *
 * `SiteCompactFooter` is the site's marketing footer: four columns, 21 links to
 * landing pages, and on a 390×844 phone 1033 px of a 2209 px dashboard. Nearly
 * half of the cabinet was an advertisement aimed at someone who is already
 * inside and has, in most cases, already paid. The full footer stays on the
 * public pages, where those links do work for search; here the reader needs
 * support and the legal documents, and nothing else.
 *
 * No language switch: `SiteHeader` carries one on every page that renders this,
 * and /settings has a third in its own form.
 */
export function CabinetFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const whatsapp = getPublicWhatsappNumber();
  const legalLinks = SITE_FOOTER_LINK_KEYS.filter((l) => LEGAL_HREFS.has(l.href));

  return (
    <footer className="border-t border-us-border/60 bg-us-ivory">
      <div className="us-container flex flex-wrap items-center gap-x-4 gap-y-2 py-5 font-body text-xs text-us-ink-muted">
        {whatsapp ? (
          <a
            href={getWhatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-us-ink"
          >
            WhatsApp
          </a>
        ) : null}
        <a href={`mailto:${SITE_LEGAL.email}`} className="transition-colors hover:text-us-ink">
          {SITE_LEGAL.email}
        </a>
        {legalLinks.map(({ href, labelKey }) => (
          <LocaleLink key={href} href={href} className="transition-colors hover:text-us-ink">
            {t(labelKey)}
          </LocaleLink>
        ))}
        <span className="ml-auto text-us-ink-muted/70">© {year} QazShaqyru</span>
      </div>
    </footer>
  );
}
