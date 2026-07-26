'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef, type ComponentProps } from 'react';

import { useI18n } from '@/i18n';
import { resolveSeoPathLocale, withSeoLocalePrefix } from '@/lib/seo/locale-path';

export type LocaleLinkProps = ComponentProps<typeof Link>;

/**
 * next/link for public marketing routes: prefixes `/kk` or `/ru` from path locale
 * (or cookie locale when URL is unprefixed). Guest `/i/*`, auth and app shell stay plain.
 */
export const LocaleLink = forwardRef<HTMLAnchorElement, LocaleLinkProps>(function LocaleLink(
  { href, ...rest },
  ref
) {
  const pathname = usePathname();
  const { locale } = useI18n();
  const seoLocale = resolveSeoPathLocale(pathname, locale);
  const localized =
    typeof href === 'string' ? withSeoLocalePrefix(href, seoLocale) : href;

  return <Link ref={ref} href={localized} {...rest} />;
});
