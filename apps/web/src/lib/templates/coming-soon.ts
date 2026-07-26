/**
 * Placeholder templates — metadata only for designer pipeline.
 * NOT shown as product cards on the public catalog (honest live-only витрина).
 * Agents wire slugs into CATALOG_TEMPLATE_SLUGS / SURET_MANIFESTS when assets exist.
 */

export type ComingSoonProduct = 'site' | 'suret';

export type ComingSoonTemplate = {
  slug: string;
  category: string;
  nameRu: string;
  nameKz: string;
  planTier: 'free' | 'standard' | 'premium';
  product: ComingSoonProduct;
  tags: string[];
  etaLabelRu: string;
  etaLabelKz: string;
};

export const COMING_SOON_TEMPLATES: ComingSoonTemplate[] = [
  {
    slug: 'toy-classic',
    category: 'toy',
    nameRu: 'Той · классика',
    nameKz: 'Той · классика',
    planTier: 'standard',
    product: 'site',
    tags: ['национальный', 'домбра'],
    etaLabelRu: 'В разработке',
    etaLabelKz: 'Дайындалуда',
  },
  {
    slug: 'betashar-gold',
    category: 'betashar',
    nameRu: 'Беташар · золото',
    nameKz: 'Беташар · алтын',
    planTier: 'standard',
    product: 'site',
    tags: ['нежный', 'золото'],
    etaLabelRu: 'В разработке',
    etaLabelKz: 'Дайындалуда',
  },
  {
    slug: 'uzatu-elegant',
    category: 'kyz_uzatu',
    nameRu: 'Узату · элегант',
    nameKz: 'Қыз ұзату · элегант',
    planTier: 'standard',
    product: 'site',
    tags: ['классика'],
    etaLabelRu: 'В разработке',
    etaLabelKz: 'Дайындалуда',
  },
  {
    slug: 'suret-uzatu-01',
    category: 'kyz_uzatu',
    nameRu: 'Сүрет · узату 01',
    nameKz: 'Сүрет · ұзату 01',
    planTier: 'standard',
    product: 'suret',
    tags: ['фото-приглашение', 'Stories'],
    etaLabelRu: 'Ждёт фон дизайнера',
    etaLabelKz: 'Дизайнер фонын күтеді',
  },
  {
    slug: 'suret-wedding-01',
    category: 'wedding',
    nameRu: 'Сүрет · свадьба 01',
    nameKz: 'Сүрет · үйлену 01',
    planTier: 'standard',
    product: 'suret',
    tags: ['фото-приглашение', 'Stories'],
    etaLabelRu: 'Ждёт фон дизайнера',
    etaLabelKz: 'Дизайнер фонын күтеді',
  },
  {
    slug: 'sundet-festive',
    category: 'sundet_toy',
    nameRu: 'Сүндет · праздничный',
    nameKz: 'Сүндет · мерекелік',
    planTier: 'standard',
    product: 'site',
    tags: ['традиция'],
    etaLabelRu: 'В разработке',
    etaLabelKz: 'Дайындалуда',
  },
  {
    slug: 'suret-sundet-01',
    category: 'sundet_toy',
    nameRu: 'Сүрет · сүндет 01',
    nameKz: 'Сүрет · сүндет 01',
    planTier: 'standard',
    product: 'suret',
    tags: ['фото-приглашение'],
    etaLabelRu: 'Ждёт фон дизайнера',
    etaLabelKz: 'Дизайнер фонын күтеді',
  },
  {
    slug: 'tusau-keser-soft',
    category: 'tusau_keser',
    nameRu: 'Тұсаукесер · нежный',
    nameKz: 'Тұсаукесер · жұмсақ',
    planTier: 'standard',
    product: 'site',
    tags: ['детский'],
    etaLabelRu: 'В разработке',
    etaLabelKz: 'Дайындалуда',
  },
  {
    slug: 'suret-tusau-01',
    category: 'tusau_keser',
    nameRu: 'Сүрет · тұсаукесер 01',
    nameKz: 'Сүрет · тұсаукесер 01',
    planTier: 'standard',
    product: 'suret',
    tags: ['фото-приглашение'],
    etaLabelRu: 'Ждёт фон дизайнера',
    etaLabelKz: 'Дизайнер фонын күтеді',
  },
  {
    slug: 'suret-uzatu-02',
    category: 'kyz_uzatu',
    nameRu: 'Сүрет · узату 02',
    nameKz: 'Сүрет · ұзату 02',
    planTier: 'standard',
    product: 'suret',
    tags: ['фото-приглашение', 'Stories'],
    etaLabelRu: 'Ждёт фон дизайнера',
    etaLabelKz: 'Дизайнер фонын күтеді',
  },
  {
    slug: 'suret-wedding-02',
    category: 'wedding',
    nameRu: 'Сүрет · свадьба 02',
    nameKz: 'Сүрет · үйлену 02',
    planTier: 'standard',
    product: 'suret',
    tags: ['фото-приглашение', 'Stories'],
    etaLabelRu: 'Ждёт фон дизайнера',
    etaLabelKz: 'Дизайнер фонын күтеді',
  },
  {
    slug: 'suret-sundet-02',
    category: 'sundet_toy',
    nameRu: 'Сүрет · сүндет 02',
    nameKz: 'Сүрет · сүндет 02',
    planTier: 'standard',
    product: 'suret',
    tags: ['фото-приглашение'],
    etaLabelRu: 'Ждёт фон дизайнера',
    etaLabelKz: 'Дизайнер фонын күтеді',
  },
  {
    slug: 'suret-toy-01',
    category: 'toy',
    nameRu: 'Сүрет · той 01',
    nameKz: 'Сүрет · той 01',
    planTier: 'standard',
    product: 'suret',
    tags: ['фото-приглашение', 'Stories'],
    etaLabelRu: 'Ждёт фон дизайнера',
    etaLabelKz: 'Дизайнер фонын күтеді',
  },
  {
    slug: 'suret-anniversary-01',
    category: 'anniversary',
    nameRu: 'Сүрет · мерейтой 01',
    nameKz: 'Сүрет · мерейтой 01',
    planTier: 'standard',
    product: 'suret',
    tags: ['фото-приглашение'],
    etaLabelRu: 'Ждёт фон дизайнера',
    etaLabelKz: 'Дизайнер фонын күтеді',
  },
  {
    slug: 'uzatu-site-02',
    category: 'kyz_uzatu',
    nameRu: 'Узату · тёплый site',
    nameKz: 'Қыз ұзату · жылы site',
    planTier: 'standard',
    product: 'site',
    tags: ['классика'],
    etaLabelRu: 'В разработке',
    etaLabelKz: 'Дайындалуда',
  },
  {
    slug: 'wedding-site-classic',
    category: 'wedding',
    nameRu: 'Свадьба · классика site',
    nameKz: 'Үйлену · классика site',
    planTier: 'standard',
    product: 'site',
    tags: ['элегант'],
    etaLabelRu: 'В разработке',
    etaLabelKz: 'Дайындалуда',
  },
  {
    slug: 'anniversary-warm',
    category: 'anniversary',
    nameRu: 'Мерейтой · тёплый',
    nameKz: 'Мерейтой · жылы',
    planTier: 'standard',
    product: 'site',
    tags: ['семейный'],
    etaLabelRu: 'В разработке',
    etaLabelKz: 'Дайындалуда',
  },
  {
    slug: 'shildehana-soft',
    category: 'birthday',
    nameRu: 'Шілдехана · нежный',
    nameKz: 'Шілдехана · жұмсақ',
    planTier: 'free',
    product: 'site',
    tags: ['детский'],
    etaLabelRu: 'В разработке',
    etaLabelKz: 'Дайындалуда',
  },
  {
    slug: 'wedding-minimal',
    category: 'wedding',
    nameRu: 'Свадьба · минимализм',
    nameKz: 'Үйлену той · минимализм',
    planTier: 'premium',
    product: 'site',
    tags: ['современный'],
    etaLabelRu: 'В разработке',
    etaLabelKz: 'Дайындалуда',
  },
];

export function comingSoonForCategory(category: string): ComingSoonTemplate[] {
  return COMING_SOON_TEMPLATES.filter((t) => t.category === category);
}

export function comingSoonByProduct(product: ComingSoonProduct | 'all'): ComingSoonTemplate[] {
  if (product === 'all') return COMING_SOON_TEMPLATES;
  return COMING_SOON_TEMPLATES.filter((t) => t.product === product);
}

export const PLAN_TIER_LABELS = {
  ru: { free: 'Бесплатно', standard: 'Стандарт', premium: 'Премиум' },
  kz: { free: 'Тегін', standard: 'Стандарт', premium: 'Премиум' },
} as const;
