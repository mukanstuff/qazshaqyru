import type { SuretTemplateManifest } from './manifest-types';

/**
 * Suret manifests — register here when designer delivers bg.webp.
 * Do not add to sales catalog until assets exist under public/assets/templates/suret/<id>/.
 */

export const SURET_UZATU_PILOT: SuretTemplateManifest = {
  id: 'suret/uzatu-pilot-01',
  slug: 'suret-uzatu-pilot-01',
  tier: 'SURET',
  renderEngine: 'suret',
  category: 'kyz_uzatu',
  background: '/assets/templates/suret/uzatu-pilot-01/bg.webp',
  width: 1080,
  height: 1920,
  texts: [
    {
      id: 'greeting',
      top: 18,
      font: 'var(--inv-font-ceremonial)',
      color: '#5c4a32',
      fontSize: 14,
      defaultText: {
        kk: 'Құрметті қонақтар!',
        ru: 'Дорогие гости!',
      },
    },
    {
      id: 'names',
      top: 38,
      font: 'var(--inv-font-display)',
      color: '#8a7344',
      fontSize: 42,
      defaultText: {
        kk: 'Аружан & Нұрлан',
        ru: 'Аружан & Нұрлан',
      },
    },
    {
      id: 'date',
      top: 58,
      font: 'var(--inv-font-body)',
      color: '#5c4a32',
      fontSize: 20,
      defaultText: {
        kk: '2026 ж. 15 тамыз',
        ru: '15 августа 2026',
      },
    },
    {
      id: 'venue',
      top: 72,
      font: 'var(--inv-font-body)',
      color: '#5c4a32',
      fontSize: 16,
      defaultText: {
        kk: 'Алматы, мейрамхана «Жарық»',
        ru: 'Алматы, ресторан «Жарық»',
      },
    },
  ],
};

export const SURET_MANIFESTS: SuretTemplateManifest[] = [SURET_UZATU_PILOT];

export function getSuretManifest(idOrSlug: string): SuretTemplateManifest | null {
  return (
    SURET_MANIFESTS.find((m) => m.id === idOrSlug || m.slug === idOrSlug) ?? null
  );
}

export function listSuretManifests(): SuretTemplateManifest[] {
  return [...SURET_MANIFESTS];
}
