import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Check, CreditCard } from 'lucide-react';
import { getCurrentSession } from '@/lib/api';
import { getI18n } from '@/i18n/server';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LogoutButton } from '@/components/logout-button';
import prisma from '@/lib/db';
import { TemplateOrderForm } from '@/components/template-order-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export default async function TemplatePage({ params }: Props) {
  const ctx = await getCurrentSession();
  if (!ctx) redirect(`/login?redirect=/templates/${params.slug}`);

  const template = await prisma.template.findUnique({
    where: { slug: params.slug, isActive: true },
  });

  if (!template) notFound();

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-40 backdrop-blur bg-white/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/templates" className="flex items-center gap-2">
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
        <Link
          href="/templates"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к каталогу
        </Link>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-stone-100 shadow-xl">
              <img
                src={template.previewImageUrl}
                alt={template.nameRu}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-100">
              <p className="text-xs uppercase tracking-wider text-stone-400 mb-3">Что входит в шаблон</p>
              <ul className="space-y-3">
                {[
                  'Готовый дизайн для выбранного торжества',
                  'Личный кабинет для управления приглашением',
                  'Гостевые ссылки с уникальными токенами',
                  'Сбор RSVP-ответов в реальном времени',
                  'Поделиться в WhatsApp в один клик',
                  'Музыка на фоне (по желанию)',
                  'Адаптация под мобильные устройства',
                  'Техподдержка 30 дней',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-stone-700">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-rose-600 font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                {template.category}
              </div>
              <h1 className="font-serif text-4xl text-stone-800 mb-3">{template.nameRu}</h1>
              <p className="text-stone-600 leading-relaxed">{template.descriptionRu}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-100">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-serif text-4xl text-stone-900">
                  {template.priceKzt.toLocaleString('ru-RU')}
                </span>
                <span className="text-xl text-stone-700">₸</span>
                <span className="text-sm text-stone-400 ml-1">единоразово</span>
              </div>

              <TemplateOrderForm template={{ id: template.id, slug: template.slug, priceKzt: template.priceKzt, nameRu: template.nameRu }} />
            </div>

            <div className="bg-stone-100 rounded-2xl p-5 text-xs text-stone-600 leading-relaxed">
              После оплаты мы подготовим ваше приглашение в течение 24 часов. Вам останется только заполнить данные (имена, дату, место) — и приглашение готово к отправке.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
