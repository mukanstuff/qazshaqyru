'use client';

import { Fragment, type ReactNode } from 'react';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';

/**
 * Turns bare URL paths written inside SEO prose into real, labelled links.
 *
 * The category and event copy is full of sentences like "смотрите также
 * /uzatu, /sundet, /tusaukeser" — 37 raw paths across both languages, printed
 * to the page as literal text. On pages whose entire job is to convert search
 * traffic that reads as unfinished notes, and it wastes the one thing those
 * mentions are actually good for: internal linking, which is a large part of
 * why the bigger competitor's SEO works.
 *
 * Rewriting the prose by hand would fix the ugliness and throw the links away.
 * This keeps the editorial intent, renders a human label instead of a path, and
 * makes every mention a crawlable link. Paths with no label fall through to
 * plain text unchanged, so an unknown path can never render as a dead link.
 */

const LABELS: Record<string, { ru: string; kz: string }> = {
  '/wedding': { ru: 'свадьба', kz: 'үйлену тойы' },
  '/uzatu': { ru: 'қыз ұзату', kz: 'қыз ұзату' },
  '/sundet': { ru: 'сүндет той', kz: 'сүндет той' },
  '/tusaukeser': { ru: 'тұсаукесер', kz: 'тұсаукесер' },
  '/betashar': { ru: 'беташар', kz: 'беташар' },
  '/mereytoi': { ru: 'юбилей', kz: 'мерейтой' },
  '/pricing': { ru: 'цены', kz: 'бағалар' },
  '/templates': { ru: 'каталог шаблонов', kz: 'үлгілер каталогы' },
  '/faq': { ru: 'частые вопросы', kz: 'жиі қойылатын сұрақтар' },
  '/blog': { ru: 'блог', kz: 'блог' },
  '/seating': { ru: 'рассадка', kz: 'отырғызу' },
  '/blog/betashar-kudalyk': { ru: 'беташар и құдалық', kz: 'беташар мен құдалық' },
  '/blog/tusaukeser-text': { ru: 'текст на тұсаукесер', kz: 'тұсаукесер мәтіні' },
  '/blog/sundet-invitation': { ru: 'приглашение на сүндет', kz: 'сүндет шақыруы' },
  '/blog/toikhana-csv': { ru: 'список для тойханы', kz: 'тойханаға тізім' },
  '/blog/choose-template': { ru: 'как выбрать шаблон', kz: 'үлгіні қалай таңдау' },
  '/blog/paper-vs-online': { ru: 'бумага или онлайн', kz: 'қағаз бе, онлайн ба' },
  '/blog/rsvp-without-calls': { ru: 'ответы без обзвона', kz: 'қоңыраусыз жауаптар' },
  '/blog/send-whatsapp': { ru: 'рассылка в WhatsApp', kz: 'WhatsApp-пен тарату' },
  '/blog/seating-families': { ru: 'рассадка родственников', kz: 'туыстарды отырғызу' },
  '/blog/invitation-text': { ru: 'текст приглашения', kz: 'шақыру мәтіні' },
  '/blog/kaspi-payment-refund': { ru: 'оплата и возврат', kz: 'төлем және қайтару' },
  '/agency': { ru: 'для агентств', kz: 'агенттіктерге' },
  '/corporate': { ru: 'корпоратив', kz: 'корпоратив' },
  '/almaty': { ru: 'Алматы', kz: 'Алматы' },
  '/astana': { ru: 'Астана', kz: 'Астана' },
  '/about': { ru: 'о нас', kz: 'біз туралы' },
  '/contacts': { ru: 'контакты', kz: 'байланыс' },
  '/templates/betashar': { ru: 'шаблоны на беташар', kz: 'беташар үлгілері' },
  '/templates/wedding': { ru: 'свадебные шаблоны', kz: 'үйлену тойы үлгілері' },
  '/templates/kyz-uzatu': { ru: 'шаблоны на қыз ұзату', kz: 'қыз ұзату үлгілері' },
  '/templates/sundet-toy': { ru: 'шаблоны на сүндет той', kz: 'сүндет той үлгілері' },
  '/templates/tusau-keser': { ru: 'шаблоны на тұсаукесер', kz: 'тұсаукесер үлгілері' },
  '/templates/anniversary': { ru: 'шаблоны на юбилей', kz: 'мерейтой үлгілері' },
};

// `/kk/betashar` and `/betashar` are the same destination; LocaleLink adds the
// prefix itself, so a hardcoded one in the copy has to be stripped first.
const LOCALE_PREFIX = /^\/(ru|kz|kk)(?=\/)/;

/** Longest paths first, so `/blog/x` wins over `/blog`. */
const PATH_PATTERN = new RegExp(
  `(/(?:ru|kz|kk)?/?(?:${Object.keys(LABELS)
    .map((p) => p.slice(1))
    .sort((a, b) => b.length - a.length)
    .join('|')}))\\b`,
  'g',
);

export function LinkifyPaths({ text }: { text: string }): ReactNode {
  const { locale } = useI18n();
  const lang = locale === 'kz' ? 'kz' : 'ru';

  const parts = text.split(PATH_PATTERN);
  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, i) => {
        // Odd indices are the captured paths.
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const canonical = part.replace(LOCALE_PREFIX, '');
        const label = LABELS[canonical];
        if (!label) return <Fragment key={i}>{part}</Fragment>;
        return (
          <LocaleLink key={i} href={canonical} className="text-us-accent underline-offset-2 hover:underline">
            {label[lang]}
          </LocaleLink>
        );
      })}
    </>
  );
}
