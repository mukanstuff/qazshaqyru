import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Heart, Sparkles, Clock, MapPin, Users, Music, ArrowRight, Check } from 'lucide-react';
import { getI18n } from '@/i18n/server';
import prisma from '@/lib/db-server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { t } = await getI18n();

  const featuredTemplates = await prisma.template
    .findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { sortOrder: 'asc' },
      take: 6,
      select: { id: true, slug: true, nameRu: true, nameKz: true, previewImageUrl: true, priceKzt: true, category: true },
    })
    .catch(() => []);

  return (
    <main className="min-h-screen bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-sans { font-family: 'DM Sans', system-ui, sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }
      `}</style>

      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-rose-400 text-rose-400" />
            <span className="font-serif text-xl tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Invito
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-8 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <a href="#templates" className="text-stone-500 hover:text-stone-800 transition-colors">
                {t('nav.invitations')}
              </a>
              <a href="#how" className="text-stone-500 hover:text-stone-800 transition-colors">
                {t('landing.howItWorks')}
              </a>
              <Link href="/i/demo" className="text-stone-500 hover:text-stone-800 transition-colors">
                {t('landing.example')}
              </Link>
            </nav>
            <LanguageSwitcher />
            <Link
              href="/login"
              className="h-9 px-5 inline-flex items-center justify-center rounded-full text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] text-white"
              style={{ fontFamily: "'DM Sans', sans-serif", background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)' }}
            >
              {t('nav.create')}
            </Link>
          </div>
        </div>
      </header>

      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ paddingTop: '64px' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)' }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-8 py-24">
          <div className="max-w-xl">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-6"
              style={{ color: 'rgba(255,255,255,0.5)', animation: 'fadeUp 0.8s ease 0.2s both', fontFamily: "'DM Sans', sans-serif" }}
            >
              {t('landing.tagline')}
            </p>
            <h1
              className="font-serif text-5xl sm:text-7xl font-light text-white leading-[1.05] mb-8"
              style={{ fontFamily: "'Cormorant Garamond', serif", animation: 'fadeUp 0.8s ease 0.4s both' }}
            >
              {t('landing.heroTitle1')}<br />
              {t('landing.heroTitle2')}<br />
              <em className="not-italic" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {t('landing.heroTitle3')}
              </em>
            </h1>
            <p
              className="text-white/70 text-base leading-relaxed mb-10 max-w-sm"
              style={{ animation: 'fadeUp 0.8s ease 0.6s both', fontFamily: "'DM Sans', sans-serif" }}
            >
              {t('landing.heroSubtitle')}
            </p>
            <div
              className="flex flex-col sm:flex-row gap-3"
              style={{ animation: 'fadeUp 0.8s ease 0.8s both', fontFamily: "'DM Sans', sans-serif" }}
            >
              <Link
                href="#templates"
                className="h-12 px-8 inline-flex items-center justify-center rounded-full text-white text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #a78b4a 100%)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                {t('landing.ctaPrimary')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/i/demo"
                className="h-12 px-8 inline-flex items-center justify-center rounded-full text-white text-sm font-medium transition-all hover:bg-white/10 active:scale-[0.98]"
                style={{ border: '1px solid rgba(255,255,255,0.25)' }}
              >
                {t('landing.ctaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="py-32 px-8 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-lg mb-20">
            <p className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: '#c9a96e' }}>
              {t('landing.howTitle')}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-light text-stone-800 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {t('landing.howSubtitle')}
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: '01', title: t('landing.step1Title'), desc: t('landing.step1Desc') },
              { num: '02', title: t('landing.step2Title'), desc: t('landing.step2Desc') },
              { num: '03', title: t('landing.step3Title'), desc: t('landing.step3Desc') },
              { num: '04', title: t('landing.step4Title'), desc: t('landing.step4Desc') },
            ].map((step) => (
              <div key={step.num} className="bg-white rounded-2xl p-6 border border-stone-100">
                <div className="text-3xl font-light text-stone-300 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {step.num}
                </div>
                <h3 className="text-lg font-medium text-stone-800 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {step.title}
                </h3>
                <p className="text-sm text-stone-500 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="templates" className="py-32 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-lg mb-20">
            <p className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: '#c9a96e' }}>
              {t('landing.templatesTitle')}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-light text-stone-800 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {t('landing.templatesSubtitle')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredTemplates.length > 0 ? (
              featuredTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/templates/${template.slug}`}
                  className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-stone-200 hover:shadow-xl transition-all"
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-stone-100">
                    <img
                      src={template.previewImageUrl}
                      alt={template.nameRu}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-stone-700 font-medium">
                        {t(`invitation.eventType.${template.category}` as 'invitation.eventType.wedding')}
                      </span>
                    </div>
                    {template.priceKzt > 0 && (
                      <div className="absolute bottom-3 right-3">
                        <span className="text-sm px-3 py-1.5 rounded-full bg-stone-900 text-white font-medium">
                          {template.priceKzt.toLocaleString('ru-RU')} ₸
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-medium text-stone-900 group-hover:text-rose-600 transition-colors">
                      {template.nameRu}
                    </h3>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 bg-stone-50 rounded-2xl">
                <p className="text-stone-500">{t('landing.templatesEmpty')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-24 px-8 bg-stone-950">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.25em] mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {t('landing.ctaTitle')}
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-light text-white mb-8 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {t('landing.ctaHeadline')}
          </h2>
          <Link
            href="#templates"
            className="inline-flex items-center gap-2 h-12 px-10 rounded-full text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98] text-stone-900 bg-white"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {t('landing.ctaButton')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="py-8 px-8 bg-white border-t border-stone-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 fill-rose-300 text-rose-300" />
            <span className="text-sm text-stone-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              © 2026 Invito
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-stone-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <Link href="/terms" className="hover:text-stone-600 transition-colors">{t('landing.terms')}</Link>
            <Link href="/privacy" className="hover:text-stone-600 transition-colors">{t('landing.privacy')}</Link>
            <a href="https://wa.me/77001234567" className="hover:text-stone-600 transition-colors">WhatsApp</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
