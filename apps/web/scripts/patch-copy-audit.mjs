/**
 * One-shot copy audit patches for SEO/blog/json-ld public surfaces.
 * Run: node apps/web/scripts/patch-copy-audit.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');

function patch(file, replacements) {
  const full = path.join(root, file);
  let text = fs.readFileSync(full, 'utf8');
  let n = 0;
  for (const [from, to] of replacements) {
    const before = text;
    if (from instanceof RegExp) {
      text = text.replace(from, to);
    } else {
      text = text.split(from).join(to);
    }
    if (text !== before) n += 1;
  }
  fs.writeFileSync(full, text);
  console.log(`${file}: ${n} patterns touched`);
}

// --- event-landings.ts (RU SEO) ---
patch('src/lib/seo/event-landings.ts', [
  ['Guest Ops: RSVP, семьи, рассадка, CSV тойханы', 'Ответы гостей, список и файл для тойханы'],
  ['Guest Ops до банкета', 'Ответы гостей, список и файл для тойханы'],
  ['Цены и Guest Ops', 'Цены и список гостей'],
  [
    'Именно это QazShaqyru называет Guest Ops: операционка гостей до банкета, а не только дизайн.',
    'В QazShaqyru это ответы гостей, список и подготовка к банкету — не только дизайн.',
  ],
  [
    'Guest Ops в QazShaqyru — это RSVP по ссылке, группировка семей и +1, рассадка и выгрузка CSV или портал для менеджера тойханы.',
    'В QazShaqyru гости отвечают по ссылке, семьи и +1 группируются, есть рассадка и файл Excel для менеджера тойханы.',
  ],
  ['Guest Ops', 'список гостей и ответы'],
  ['с watermark', 'с логотипом сервиса'],
  ['с watermark сервиса', 'с логотипом сервиса'],
  ['watermark сервиса', 'логотип сервиса'],
  ['без watermark', 'без логотипа сервиса'],
  ['Без watermark', 'Без логотипа сервиса'],
  ['снять watermark', 'убрать логотип сервиса'],
  ['снимают watermark', 'убирают логотип сервиса'],
  ['Free с watermark', 'Бесплатно с логотипом сервиса'],
  ['free publish с watermark', 'бесплатная публикация с логотипом сервиса'],
  ['free watermark', 'бесплатно с логотипом сервиса'],
  ['Free watermark', 'Бесплатно с логотипом сервиса'],
  [' watermark', ' логотип сервиса'],
  ['watermark', 'логотип сервиса'],
  ['тарифом Standard', 'тарифом Стандарт'],
  ['тарифе Standard', 'тарифе Стандарт'],
  ['на Standard', 'на Стандарте'],
  ['На Standard', 'На Стандарте'],
  ['Standard от', 'Стандарт от'],
  ['Standard.', 'Стандарт.'],
  ['Standard)', 'Стандарт)'],
  ['Standard —', 'Стандарт —'],
  ['Standard,', 'Стандарт,'],
  [' Standard', ' Стандарт'],
  ['(Standard)', '(Стандарт)'],
  ['entry-конкурентов', 'недорогих конкурентов'],
  ['Entry-конкуренты', 'Недорогие конкуренты'],
  ['ops-функциями', 'функциями списка гостей'],
  ['полный список гостей и ops', 'полный список гостей'],
]);

// --- category-copy ---
patch('src/lib/seo/category-copy.ts', [
  ['/** SEO intro + FAQ for /templates/{category} — unique angle: Guest Ops. */', '/** SEO intro + FAQ for /templates/{category}. */'],
  ['Guest Ops', 'список гостей и ответы'],
  ['с watermark', 'с логотипом сервиса'],
  ['С watermark', 'С логотипом сервиса'],
  ['без watermark', 'без логотипа сервиса'],
  ['Без watermark', 'Без логотипа сервиса'],
  ['Free с watermark', 'Бесплатно с логотипом сервиса'],
  ['free watermark', 'бесплатно с логотипом сервиса'],
  ['Free watermark', 'Бесплатно с логотипом сервиса'],
  ['watermark', 'логотип сервиса'],
  ['Free publish', 'Бесплатная публикация'],
  ['free publish', 'бесплатная публикация'],
  ['на Standard', 'на Стандарте'],
  ['На Standard', 'На Стандарте'],
  ['Нужен ли Standard', 'Нужен ли Стандарт'],
  ['Можно ли без watermark', 'Можно ли без логотипа сервиса'],
  ['Можно ли без логотип сервиса', 'Можно ли без логотипа сервиса'],
  ['Standard от', 'Стандарт от'],
  ['Standard.', 'Стандарт.'],
  ['Standard —', 'Стандарт —'],
  ['Standard,', 'Стандарт,'],
  [' Standard', ' Стандарт'],
  ['(Standard)', '(Стандарт)'],
]);

// --- event-landings-kk: Latin Standard → Стандарт ---
patch('src/lib/seo/event-landings-kk.ts', [
  ['Standard 3 990', 'Стандарт 3 990'],
  ['Standard тарифінде', 'Стандарт тарифінде'],
  ['Standard-пен', 'Стандартпен'],
  ['Standard-та', 'Стандартта'],
  ['Standard-қа', 'Стандартқа'],
  ['/pricing-тегі Standard', '/pricing-тегі Стандарт'],
  ['Standard.', 'Стандарт.'],
  [' Standard', ' Стандарт'],
  ['Free логотиппен', 'Тегін логотиппен'],
]);

// --- json-ld ---
patch('src/lib/seo/json-ld.ts', [
  [
    'Публикация с watermark бесплатно; Standard от 3 990 ₸ без watermark + Guest Ops',
    'Публикация с логотипом сервиса бесплатно; Стандарт от 3 990 ₸ без логотипа + список гостей',
  ],
  ['Guest Ops', 'список гостей'],
  ['watermark', 'логотип сервиса'],
  ['Standard от', 'Стандарт от'],
]);

// --- blog posts (public render) ---
const blogReplacements = [
  ['Guest Ops', 'список гостей и ответы'],
  ['с watermark', 'с логотипом сервиса'],
  ['С watermark', 'С логотипом сервиса'],
  ['без watermark', 'без логотипа сервиса'],
  ['Без watermark', 'Без логотипа сервиса'],
  ['watermark-пен', 'сервис белгісімен'],
  ['watermark-сыз', 'белгісіз'],
  ['watermark', 'логотип сервиса'],
  ['Free watermark', 'Тегін · сервис белгісімен'],
  ['Free с логотипом сервиса', 'Бесплатно с логотипом сервиса'],
  ['## Free пен Standard', '## Тегін және Стандарт'],
  ['## Free или Standard', '## Бесплатно или Стандарт'],
  ['Free нұсқа', 'Тегін нұсқа'],
  ['Free —', 'Бесплатно —'],
  ['Free publish', 'Бесплатная публикация'],
  ['на Standard', 'на Стандарте'],
  ['На Standard', 'На Стандарте'],
  ['Standard-та', 'Стандартта'],
  ['Standard-қа', 'Стандартқа'],
  ['Standard-ты', 'Стандартты'],
  ['тарифом Standard', 'тарифом Стандарт'],
  ['Standard от', 'Стандарт от'],
  ['Standard —', 'Стандарт —'],
  ['Standard.', 'Стандарт.'],
  [' Standard', ' Стандарт'],
  ['ops-пакет', 'пакет со списком гостей'],
  ['ops-функции', 'функции списка гостей'],
];

for (const rel of [
  'content/blog/ru/honest-comparison.md',
  'content/blog/kz/honest-comparison.md',
  'content/blog/ru/choose-template.md',
  'content/blog/kz/choose-template.md',
  'content/blog/ru/kaspi-payment-refund.md',
  'content/blog/kz/kaspi-payment-refund.md',
  'content/blog/ru/paper-vs-online.md',
  'content/blog/kz/paper-vs-online.md',
  'content/blog/ru/betashar-kudalyk.md',
  'content/blog/ru/tusaukeser-text.md',
  'content/blog/kz/tusaukeser-text.md',
]) {
  patch(rel, blogReplacements);
}

console.log('done');
