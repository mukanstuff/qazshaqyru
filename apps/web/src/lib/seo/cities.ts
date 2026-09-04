/**
 * Cities the catalogue publishes local landing pages for.
 *
 * Only facts live here: the city's name in both languages and the grammatical
 * forms the copy needs. Nothing about venues, prices or local customs — we have
 * no verified data on any of that, and inventing "в Алматы средний той на 300
 * гостей" to bulk out a page is how these pages become worthless and, in the
 * blogosphere sense, dishonest.
 *
 * The list is Kazakhstan's largest cities. It is deliberately a plain registry
 * so a city can be added or removed without touching a route.
 */

export type CitySlug =
  | 'almaty'
  | 'astana'
  | 'shymkent'
  | 'karaganda'
  | 'aktobe'
  | 'taraz'
  | 'pavlodar'
  | 'oskemen'
  | 'semey'
  | 'atyrau'
  | 'kostanay'
  | 'kyzylorda';

export interface CityCopy {
  /** Nominative — "Алматы". */
  name: string;
  /** Locative, ready to drop after a preposition — "в Алматы", "Алматыда". */
  locative: string;
}

export interface City {
  slug: CitySlug;
  ru: CityCopy;
  kz: CityCopy;
}

export const CITIES: City[] = [
  { slug: 'almaty', ru: { name: 'Алматы', locative: 'в Алматы' }, kz: { name: 'Алматы', locative: 'Алматыда' } },
  { slug: 'astana', ru: { name: 'Астана', locative: 'в Астане' }, kz: { name: 'Астана', locative: 'Астанада' } },
  { slug: 'shymkent', ru: { name: 'Шымкент', locative: 'в Шымкенте' }, kz: { name: 'Шымкент', locative: 'Шымкентте' } },
  { slug: 'karaganda', ru: { name: 'Караганда', locative: 'в Караганде' }, kz: { name: 'Қарағанды', locative: 'Қарағандыда' } },
  { slug: 'aktobe', ru: { name: 'Актобе', locative: 'в Актобе' }, kz: { name: 'Ақтөбе', locative: 'Ақтөбеде' } },
  { slug: 'taraz', ru: { name: 'Тараз', locative: 'в Таразе' }, kz: { name: 'Тараз', locative: 'Таразда' } },
  { slug: 'pavlodar', ru: { name: 'Павлодар', locative: 'в Павлодаре' }, kz: { name: 'Павлодар', locative: 'Павлодарда' } },
  { slug: 'oskemen', ru: { name: 'Усть-Каменогорск', locative: 'в Усть-Каменогорске' }, kz: { name: 'Өскемен', locative: 'Өскеменде' } },
  { slug: 'semey', ru: { name: 'Семей', locative: 'в Семее' }, kz: { name: 'Семей', locative: 'Семейде' } },
  { slug: 'atyrau', ru: { name: 'Атырау', locative: 'в Атырау' }, kz: { name: 'Атырау', locative: 'Атырауда' } },
  { slug: 'kostanay', ru: { name: 'Костанай', locative: 'в Костанае' }, kz: { name: 'Қостанай', locative: 'Қостанайда' } },
  { slug: 'kyzylorda', ru: { name: 'Кызылорда', locative: 'в Кызылорде' }, kz: { name: 'Қызылорда', locative: 'Қызылордада' } },
];

export const CITY_SLUGS = CITIES.map((c) => c.slug);

const BY_SLUG = new Map(CITIES.map((c) => [c.slug, c]));

export function getCity(slug: string): City | null {
  return BY_SLUG.get(slug as CitySlug) ?? null;
}

export function isCitySlug(slug: string): slug is CitySlug {
  return BY_SLUG.has(slug as CitySlug);
}
