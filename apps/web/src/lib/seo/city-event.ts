import type { CategoryRouteSlug } from '@/lib/templates/template-categories';
import type { SeoLandingKey } from '@/lib/seo/event-landings';

/**
 * Which events get city pages, and what each maps to elsewhere.
 *
 * `category` is the catalogue route the page shows templates from — it is also
 * what decides whether the page is worth putting in the sitemap. A city page
 * for a category with nothing in it is a page that cannot answer the question
 * it ranks for, so those stay out of the sitemap until the shelf is stocked
 * (see the sitemap builder). They still render, so nothing is broken for
 * anybody who follows a link; they just are not advertised.
 */
export interface CityEventDef {
  /** Route segment: /betashar/almaty */
  event: SeoLandingKey;
  category: CategoryRouteSlug;
  ru: { noun: string; forEvent: string };
  kz: { noun: string; forEvent: string };
}

export const CITY_EVENTS: CityEventDef[] = [
  {
    event: 'wedding',
    category: 'wedding',
    ru: { noun: 'свадьбу', forEvent: 'свадебное приглашение' },
    kz: { noun: 'үйлену тойына', forEvent: 'үйлену тойына шақыру' },
  },
  {
    event: 'uzatu',
    category: 'kyz-uzatu',
    ru: { noun: 'қыз ұзату', forEvent: 'приглашение на қыз ұзату' },
    kz: { noun: 'қыз ұзатуға', forEvent: 'қыз ұзатуға шақыру' },
  },
  {
    event: 'betashar',
    category: 'betashar',
    ru: { noun: 'беташар', forEvent: 'приглашение на беташар' },
    kz: { noun: 'беташарға', forEvent: 'беташарға шақыру' },
  },
  {
    event: 'sundet',
    category: 'sundet-toy',
    ru: { noun: 'сүндет той', forEvent: 'приглашение на сүндет той' },
    kz: { noun: 'сүндет тойға', forEvent: 'сүндет тойға шақыру' },
  },
  {
    event: 'tusaukeser',
    category: 'tusau-keser',
    ru: { noun: 'тұсаукесер', forEvent: 'приглашение на тұсаукесер' },
    kz: { noun: 'тұсаукесерге', forEvent: 'тұсаукесерге шақыру' },
  },
  {
    event: 'mereytoi',
    category: 'anniversary',
    ru: { noun: 'юбилей', forEvent: 'приглашение на юбилей' },
    kz: { noun: 'мерейтойға', forEvent: 'мерейтойға шақыру' },
  },
];

const BY_EVENT = new Map(CITY_EVENTS.map((e) => [e.event, e]));

export function getCityEvent(event: string): CityEventDef | null {
  return BY_EVENT.get(event as SeoLandingKey) ?? null;
}
