import { NextRequest, NextResponse } from 'next/server';
import { ALL_TEMPLATE_SLUGS, getTemplate } from '@/lib/templates';
import { DEFAULT_TEMPLATE_SLUG } from '@/lib/templates/catalog';
import { DEFAULT_BODY_KZ, DEFAULT_BODY_RU } from '@/lib/templates/manifest-fields';
import { applyRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/shared/api';
import { listHtmlTemplateSlugs } from '@/lib/templates/manifests/index';

export const dynamic = 'force-dynamic';

/**
 * GET ?layout=luxe-gold
 * Demo invitation for catalog preview at /i/demo.
 */
export async function GET(request: NextRequest) {
  const rate = await applyRateLimit(request, 'public_demo', RATE_LIMITS.PUBLIC_DEMO);
  if (!rate.allowed) return rateLimitResponse(rate);

  const url = new URL(request.url);
  const layout = url.searchParams.get('layout') ?? DEFAULT_TEMPLATE_SLUG;

  const acceptLang = request.headers.get('accept-language') ?? '';
  const localeCookie = url.searchParams.get('locale');
  let locale: 'kz' | 'ru' = 'ru';
  if (localeCookie === 'kz' || localeCookie === 'ru') {
    locale = localeCookie;
  } else if (acceptLang.includes('kk') || acceptLang.includes('kz')) {
    locale = 'kz';
  } else if (acceptLang.includes('ru')) {
    locale = 'ru';
  }

  // Also allow HTML-engine template slugs (registered in manifests/index.ts).
  const htmlSlugs = listHtmlTemplateSlugs();
  const isHtmlEngine = htmlSlugs.includes(layout);
  const validSlug = isHtmlEngine || ALL_TEMPLATE_SLUGS.includes(layout)
    ? layout
    : DEFAULT_TEMPLATE_SLUG;
  const templateConfig = isHtmlEngine ? null : getTemplate(validSlug);
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const brideName = locale === 'kz' ? 'Айгерім' : 'Айгерим';
  const groomName = locale === 'kz' ? 'Нұрлан' : 'Нурлан';
  const title = `${brideName} & ${groomName}`;

  const greetings = {
    ru: {
      greeting:
        'Дорогие наши родные и друзья!\nПриглашаем вас разделить с нами самый счастливый день нашей жизни!',
      aboutCouple:
        'Мы познакомились пять лет назад и с тех пор неразлучны. Этот день станет началом нашей совместной жизни.',
      dressCode: 'Элегантный casual',
      footer: 'Ждём вас с нетерпением!',
    },
    kz: {
      greeting:
        'Құрметті аға-апа, бауырлар!\nСіздерді біздің өміріміздің ең бақытты күнін бірге өткізуге шақырамыз!',
      aboutCouple:
        'Бес жыл бұрын танысып, содан бері ажырамаймыз. Бұл күн біздің бірге өміріміздің бастауы болады.',
      dressCode: 'Элегантты casual',
      footer: 'Сіздерді асыға күтеміз!',
    },
  };

  return NextResponse.json({
    invitation: {
      id: 'demo',
      slug: 'demo',
      title,
      eventType: 'wedding',
      eventDate: futureDate.toISOString(),
      eventTime: '17:00',
      eventTimezone: 'Asia/Almaty',
      templateKey: validSlug,
      templateData: {
        backgroundImage: templateConfig?.coverUrl,
        coverPhoto: `/assets/templates/${validSlug}/hero/hero-01.webp`,
      },
      musicUrl: templateConfig?.defaultMusicUrl ?? null,
      mapUrl: 'https://2gis.kz/almaty',
      address: locale === 'kz' ? 'г. Алматы, мейрамхана «Жарық»' : 'г. Алматы, ресторан «Жарық»',
      eventPlace: locale === 'kz' ? 'Мейрамхана «Жарық»' : 'Ресторан «Жарық»',
      customText: {
        groomName,
        brideName,
        hostsLine: locale === 'kz' ? 'Құрметпен, той иелері:' : 'С уважением, семья молодых:',
        bodyTextKz: DEFAULT_BODY_KZ,
        bodyTextRu: DEFAULT_BODY_RU,
        greeting: greetings[locale].greeting,
        aboutCouple: greetings[locale].aboutCouple,
        dressCode: greetings[locale].dressCode,
        footer: greetings[locale].footer,
        program: [
          {
            time: '17:00',
            title: locale === 'kz' ? 'Салтанат / Неках' : 'Церемония / Никах',
            description: locale === 'kz' ? 'Рәсімдік бөлім' : 'Торжественная часть',
          },
          {
            time: '18:30',
            title: locale === 'kz' ? 'Той дастарханы' : 'Праздничный ужин',
            description: locale === 'kz' ? 'Дастархан' : 'Дастархан',
          },
          {
            time: '21:00',
            title: locale === 'kz' ? 'Би кеші' : 'Танцы и программа',
            description: locale === 'kz' ? 'Көңілді бөлім' : 'Развлекательная часть',
          },
        ],
      },
      language: locale,
      hostName: locale === 'kz' ? 'Айгерім мен Нұрлан' : 'Айгерим и Нурлан',
      isPast: false,
      openRsvp: true,
    },
  });
}
