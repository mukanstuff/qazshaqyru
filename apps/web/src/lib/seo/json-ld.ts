import { FAQ_KEYS, type FaqKey } from '@/lib/site/faq-keys';
import { absoluteUrl, getSiteOrigin, SITE_LOGO_PATH, SITE_NAME } from '@/lib/seo/site';

export type FaqItem = { question: string; answer: string };

export type BreadcrumbItem = { name: string; path: string };

function orgId(): string {
  return `${getSiteOrigin()}/#organization`;
}

function websiteId(): string {
  return `${getSiteOrigin()}/#website`;
}

/** Organization — sitewide identity. */
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': orgId(),
    name: SITE_NAME,
    url: getSiteOrigin(),
    logo: absoluteUrl(SITE_LOGO_PATH),
    description:
      'Онлайн-приглашения для тоев и семейных торжеств в Казахстане: ответ гостей, семьи, рассадка и список для тойханы.',
    areaServed: {
      '@type': 'Country',
      name: 'Kazakhstan',
    },
    availableLanguage: ['kk', 'ru'],
  };
}

/** WebSite + optional SearchAction for template catalog. */
export function buildWebSiteSchema(opts?: { includeSearchAction?: boolean }) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId(),
    name: SITE_NAME,
    url: getSiteOrigin(),
    publisher: { '@id': orgId() },
    inLanguage: ['kk', 'ru'],
  };

  if (opts?.includeSearchAction !== false) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${getSiteOrigin()}/templates?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    };
  }

  return schema;
}

/** SoftwareApplication for the invitation product. */
export function buildSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KZT',
      description: 'Публикация с логотипом сервиса бесплатно; после оплаты цены шаблона — полный доступ без водяного знака + все функции гостей',
    },
    url: getSiteOrigin(),
    provider: { '@id': orgId() },
  };
}

/** Service schema for commercial landing pages. */
export function buildServiceSchema(opts: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    provider: { '@id': orgId() },
    areaServed: {
      '@type': 'Country',
      name: 'Kazakhstan',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'KZT',
      // 2026-07-30: this is a placeholder price in schema for the *minimum* template price.
      // Real price is always Template.priceKzt. Never use in user CTAs.
      // 2026-07-30 OWNER MODEL (PRODUCT_MODEL_AND_RULES.md): placeholder only.
      // Real price = Template.priceKzt. Never hardcode or show 3990 in user CTAs.
      // Use resolvePublicationPriceKzt for real flows.
      price: '3990',
      url: absoluteUrl('/pricing'),
    },
  };
}

/**
 * FAQPage JSON-LD.
 * Note: Google FAQ rich results are limited for commercial sites (since 2023),
 * but markup still helps AI/AEO extraction and remains valid Schema.org.
 */
export function buildFaqPageSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildBlogPostingSchema(opts: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  locale?: 'kk' | 'ru';
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description,
    url: absoluteUrl(opts.path),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    inLanguage: opts.locale === 'kk' ? 'kk-KZ' : 'ru-KZ',
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: getSiteOrigin(),
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(SITE_LOGO_PATH),
      },
    },
    mainEntityOfPage: absoluteUrl(opts.path),
  };
}

/** Home page graph: Org + WebSite + SoftwareApplication (no duplicates across pages). */
export function buildHomeJsonLdGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [buildOrganizationSchema(), buildWebSiteSchema(), buildSoftwareApplicationSchema()],
  };
}

export function resolveLandingFaqItems(
  t: (key: string) => string,
  keys: readonly FaqKey[] = FAQ_KEYS
): FaqItem[] {
  return keys.map((key) => ({
    question: t(`landing.faq.${key}Question`),
    answer: t(`landing.faq.${key}Answer`),
  }));
}
