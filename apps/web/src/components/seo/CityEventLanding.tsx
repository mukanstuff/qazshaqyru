import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/shared/db';
import type { Template } from '@prisma/client';
import { PublicShell } from '@/components/shared/PublicShell';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/json-ld';
import { getCity, isCitySlug } from '@/lib/seo/cities';
import { getCityEvent } from '@/lib/seo/city-event';
import { getI18n } from '@/i18n/server';

/**
 * A landing for one event in one city — /betashar/almaty and its siblings.
 *
 * What this page is allowed to claim is the whole design problem. We have no
 * verified local data: no venue partnerships, no city price levels, no regional
 * statistics. Padding twelve cities with invented local colour is exactly how a
 * page set like this turns into doorway spam, so the copy states only what is
 * true — the event, the city, and what the product does — and the substance
 * comes from the one thing that genuinely differs per page: the templates
 * actually available for that event.
 *
 * Consequently a page whose category is empty renders (nothing is broken for a
 * visitor who follows a link) but is marked `noindex` and kept out of the
 * sitemap. It starts being advertised by itself once the category has stock.
 */

interface Props {
  event: string;
  city: string;
}

export async function buildCityEventMetadata({ event, city }: Props): Promise<Metadata> {
  const def = getCityEvent(event);
  const cityDef = getCity(city);
  if (!def || !cityDef) return {};

  const { locale } = await getI18n();
  const lang = locale === 'kz' ? 'kz' : 'ru';
  const c = cityDef[lang];
  const e = def[lang];

  const count = await prisma.template
    .count({ where: { isActive: true, category: categoryDbKey(def.category) } })
    .catch(() => 0);

  const title =
    lang === 'kz'
      ? `${c.name}: ${e.forEvent} онлайн`
      : `${cap(e.forEvent)} онлайн — ${c.name}`;

  const description =
    lang === 'kz'
      ? `${c.locative} ${e.forEvent} жасаңыз: үлгіні таңдап, мәтінді жазып, сілтемені WhatsApp арқылы жіберіңіз. Қонақтардың жауабы бір жерде жиналады.`
      : `Сделайте ${e.forEvent} ${c.locative}: выберите шаблон, впишите текст, отправьте ссылку в WhatsApp. Ответы гостей собираются в одном месте.`;

  return {
    title,
    description,
    // Empty shelf, no index. See the note at the top of this file.
    robots: count === 0 ? { index: false, follow: true } : undefined,
    alternates: { canonical: `/${event}/${city}` },
    openGraph: { title, description, type: 'website', url: `/${event}/${city}` },
  };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Route slug (`kyz-uzatu`) → Prisma category (`kyz_uzatu`). */
function categoryDbKey(route: string): string {
  return route.replace(/-/g, '_');
}

export async function CityEventLanding({ event, city }: Props) {
  const def = getCityEvent(event);
  if (!def || !isCitySlug(city)) notFound();
  const cityDef = getCity(city)!;

  const { locale } = await getI18n();
  const lang = locale === 'kz' ? 'kz' : 'ru';
  const c = cityDef[lang];
  const e = def[lang];

  const templates = await prisma.template
    .findMany({
      where: { isActive: true, category: categoryDbKey(def.category) },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 8,
    })
    .catch((): Template[] => []);

  const h1 =
    lang === 'kz'
      ? `${c.locative} ${e.forEvent}`
      : `${cap(e.forEvent)} ${c.locative}`;

  const t = COPY[lang];

  return (
    <PublicShell>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'QazShaqyru', path: '/' },
          { name: c.name, path: `/${event}/${city}` },
        ])}
      />

      <section className="us-container max-w-3xl py-12 md:py-16">
        <h1 className="font-display text-3xl leading-tight text-us-ink md:text-4xl">{h1}</h1>
        <p className="mt-4 font-body text-lg leading-relaxed text-us-ink-muted">
          {t.lede(c.locative, e.forEvent)}
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <LocaleLink
            href={`/templates/${def.category}`}
            className="inline-flex min-h-12 items-center rounded-full bg-[#16A34A] px-7 text-base font-medium text-white"
          >
            {t.cta}
          </LocaleLink>
          <LocaleLink
            href={`/${event}`}
            className="inline-flex min-h-12 items-center rounded-full border-2 border-[#16A34A]/30 px-6 text-base font-medium text-[#1F3A2E]"
          >
            {t.aboutEvent}
          </LocaleLink>
        </div>
      </section>

      {templates.length > 0 ? (
        <section className="border-t border-us-border bg-us-ivory/30 py-12">
          <div className="us-container max-w-5xl">
            <h2 className="font-display text-2xl text-us-ink">{t.templatesHeading(c.name)}</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {templates.map((tpl: Template) => (
                <LocaleLink
                  key={tpl.id}
                  href={`/editor/${tpl.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-us-border bg-white"
                >
                  {tpl.previewImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={tpl.previewImageUrl}
                      alt={lang === 'kz' ? tpl.nameKz : tpl.nameRu}
                      loading="lazy"
                      className="aspect-[9/16] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : null}
                  <p className="px-3 py-2 font-body text-sm text-us-ink">
                    {lang === 'kz' ? tpl.nameKz : tpl.nameRu}
                  </p>
                </LocaleLink>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="us-container max-w-3xl py-12">
        <h2 className="font-display text-2xl text-us-ink">{t.howHeading}</h2>
        <ol className="mt-5 space-y-3 font-body text-base leading-relaxed text-us-ink-muted">
          {t.steps.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="font-display text-us-accent">{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <p className="mt-8 font-body text-sm text-us-ink-muted">
          {t.otherCities}{' '}
          <LocaleLink href={`/${event}`} className="text-us-accent hover:underline">
            {e.forEvent}
          </LocaleLink>
          .
        </p>
      </section>
    </PublicShell>
  );
}

const COPY = {
  ru: {
    lede: (loc: string, ev: string) =>
      `Соберите ${ev} ${loc} за один вечер: выберите шаблон, впишите имена, дату и адрес, отправьте гостям ссылку в WhatsApp. Кто придёт — видно сразу, без обзвона.`,
    cta: 'Выбрать шаблон',
    aboutEvent: 'Подробнее о поводе',
    templatesHeading: (name: string) => `Шаблоны, доступные сейчас`,
    howHeading: 'Как это работает',
    steps: [
      'Выбираете шаблон и открываете редактор — регистрация не нужна, чтобы посмотреть.',
      'Вписываете имена, дату, время и адрес. Текст можно вести на казахском или русском.',
      'Публикуете и отправляете ссылку гостям в WhatsApp — по одной персональной на каждого.',
      'Смотрите, кто подтвердил, кто ещё думает, и готовите список для тойханы.',
    ],
    otherCities: 'Тот же повод без привязки к городу —',
  },
  kz: {
    lede: (loc: string, ev: string) =>
      `${loc} ${ev} бір кеште дайындаңыз: үлгіні таңдап, есімдерді, күні мен мекенжайды жазып, сілтемені WhatsApp арқылы жіберіңіз. Кім келетіні бірден көрінеді.`,
    cta: 'Үлгі таңдау',
    aboutEvent: 'Себеп туралы толығырақ',
    templatesHeading: () => 'Қазір қолжетімді үлгілер',
    howHeading: 'Қалай жұмыс істейді',
    steps: [
      'Үлгіні таңдап, редакторды ашасыз — қарау үшін тіркелудің қажеті жоқ.',
      'Есімдерді, күні мен уақытты, мекенжайды жазасыз. Мәтін қазақша немесе орысша.',
      'Жариялап, әр қонаққа жеке сілтемені WhatsApp арқылы жібересіз.',
      'Кім растағанын, кім ойланып жатқанын көріп, тойханаға тізім дайындайсыз.',
    ],
    otherCities: 'Қалаға байланысы жоқ дәл сол себеп —',
  },
} as const;
