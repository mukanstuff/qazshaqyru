export type CompareRow = { feature: string; us: string; them: string };

export type ComparePageContent = {
  path: string;
  title: string;
  description: string;
  h1: string;
  definition: string;
  intro: string[];
  rows: CompareRow[];
  whoWeFit: string[];
  whoTheyFit: string[];
  faqs: { question: string; answer: string }[];
  primaryCta: { href: string; label: string };
};

/** Public compare pages. Competitor brand vs pages are intentionally not shipped. */
export const COMPARE_PAGES: Record<'done-for-you', ComparePageContent> = {
  'done-for-you': {
    path: '/compare/done-for-you',
    title: 'QazShaqyru vs «сделаем за вас» — что выбрать',
    description:
      'Self-serve онлайн-приглашение vs агентство/done-for-you: цена, скорость, контроль, ответы гостей и список для тойханы.',
    h1: 'Сами в редакторе или «под ключ»?',
    definition:
      'Self-serve QazShaqyru быстрее и дешевле для большинства семей; done-for-you нужен, когда хотите отдать дизайн и текст специалистам и не трогать редактор.',
    intro: [
      'В Казахстане рядом с конструкторами живут услуги «сделаем приглашение за вас» — от фрилансеров до агентств. Это нормальный выбор, просто другой.',
      'QazShaqyru закрывает self-serve. Для white-label/объёма есть /agency. Ниже — когда что брать.',
    ],
    rows: [
      { feature: 'Цена', us: 'от 0 / Стандарт 3 990 ₸', them: 'часто 4 900–9 990 ₸+ за работу' },
      { feature: 'Скорость старта', us: 'Минуты в редакторе', them: 'Зависит от очереди исполнителя' },
      { feature: 'Контроль правок', us: 'Сразу сами', them: 'Через правки у исполнителя' },
      { feature: 'Ответ гостей / список', us: 'В продукте', them: 'Редко как система; чаще файл' },
      { feature: 'Дизайн «вау»', us: 'Шаблоны + рост каталога', them: 'Индивидуальная отрисовка' },
      { feature: 'Масштаб для агентств', us: '/agency', them: 'Ручная студия' },
    ],
    whoWeFit: [
      'Хотите контролировать текст и дату сами.',
      'Нужен ответ гостей  и список, а не только картинка.',
      'Бюджет и время ограничены.',
    ],
    whoTheyFit: [
      'Нужен уникальный арт, которого нет в каталоге.',
      'Готовы платить за сопровождение дизайнера.',
      'Не хотите заходить в редактор вообще.',
    ],
    faqs: [
      {
        question: 'Можно ли заказать дизайн у вас?',
        answer: 'Да, через /agency или сценарий «сделаем за вас» в каталоге — если self-serve не подходит.',
      },
      {
        question: 'Self-serve хуже выглядит?',
        answer:
          'Не обязан. Хороший шаблон + ваши фото часто достаточны. Уникальная иллюстрация — зона done-for-you.',
      },
    ],
    primaryCta: { href: '/templates', label: 'Выбрать шаблон' },
  },
};
