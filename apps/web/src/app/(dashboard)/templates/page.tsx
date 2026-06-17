import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import prisma from '@/lib/db';
import { getCurrentSession } from '@/lib/api';
import { getI18n } from '@/i18n/server';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LogoutButton } from '@/components/logout-button';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  { key: 'all', label: 'Все' },
  { key: 'wedding', label: 'Свадьба' },
  { key: 'toy', label: 'Той' },
  { key: 'betashar', label: 'Беташар' },
  { key: 'kyz_uzatu', label: 'Кыз узату' },
  { key: 'birthday', label: 'День рождения' },
  { key: 'anniversary', label: 'Юбилей' },
  { key: 'corporate', label: 'Корпоратив' },
];

interface Props {
  searchParams: { category?: string };
}

export default async function TemplatesPage({ searchParams }: Props) {
  const ctx = await getCurrentSession();
  if (!ctx) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50">
        <Link href="/login" className="text-stone-600 hover:text-stone-800">
          Войдите, чтобы выбрать шаблон
        </Link>
      </main>
    );
  }

  const category = searchParams.category || 'all';

  const where: { isActive: boolean; category?: 'wedding' | 'toy' | 'betashar' | 'kyz_uzatu' | 'birthday' | 'anniversary' | 'corporate' | 'other' } = {
    isActive: true,
  };
  const VALID_CATEGORIES = ['wedding', 'toy', 'betashar', 'kyz_uzatu', 'birthday', 'anniversary', 'corporate', 'other'] as const;
  if (category !== 'all' && (VALID_CATEGORIES as readonly string[]).includes(category)) {
    where.category = category as (typeof VALID_CATEGORIES)[number];
  }

  const templates = await prisma.template.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      nameRu: true,
      nameKz: true,
      descriptionRu: true,
      descriptionKz: true,
      category: true,
      previewImageUrl: true,
      priceKzt: true,
      isFeatured: true,
    },
  });

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-40 backdrop-blur bg-white/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-rose-400">♥</span>
            <span className="font-serif text-lg tracking-tight text-stone-800">Invito</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-stone-800 mb-2">Выберите шаблон</h1>
          <p className="text-stone-500">Готовые дизайны для вашего торжества — оплата после выбора</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/templates?category=${c.key}`}
              className={`h-9 px-4 inline-flex items-center rounded-full text-sm font-medium transition-colors ${
                category === c.key
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {templates.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-stone-100">
            <p className="text-stone-500">В этой категории пока нет шаблонов</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/templates/${template.slug}`}
                className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-stone-200 hover:shadow-xl transition-all"
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-stone-100">
                  <img
                    src={template.previewImageUrl}
                    alt={template.nameRu}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {template.isFeatured && (
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-rose-600 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Хит
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3">
                    <span className="text-sm px-3 py-1.5 rounded-full bg-stone-900/95 text-white font-medium">
                      {template.priceKzt.toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wider text-stone-400 mb-1">
                    {template.category}
                  </p>
                  <h3 className="font-medium text-stone-900 group-hover:text-rose-600 transition-colors mb-1">
                    {template.nameRu}
                  </h3>
                  {template.descriptionRu && (
                    <p className="text-sm text-stone-500 line-clamp-2">{template.descriptionRu}</p>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-stone-700 group-hover:text-rose-600 transition-colors">
                    Выбрать <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
