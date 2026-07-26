import Link from 'next/link';
import { SITE_LEGAL, hasPublicLegalOperator } from '@/lib/site/legal-config';

export type LegalLocale = 'ru' | 'kz';

function MailLink() {
  return (
    <a href={`mailto:${SITE_LEGAL.email}`} className="text-us-accent hover:underline">
      {SITE_LEGAL.email}
    </a>
  );
}

function OperatorLabel({ locale }: { locale: LegalLocale }) {
  if (!hasPublicLegalOperator()) {
    return <>{SITE_LEGAL.brandName}</>;
  }
  return (
    <>
      {SITE_LEGAL.operatorName}
      {locale === 'kz' ? ', БСН/ЖСН: ' : ', БИН/ИИН: '}
      {SITE_LEGAL.binOrIin}
    </>
  );
}

const listClass = 'list-disc space-y-2 pl-5';

export function getLegalMeta(locale: LegalLocale) {
  const isKz = locale === 'kz';
  const operatorLine = hasPublicLegalOperator()
    ? isKz
      ? `${SITE_LEGAL.operatorName}, БСН/ЖСН: ${SITE_LEGAL.binOrIin}, ${SITE_LEGAL.address}`
      : `${SITE_LEGAL.operatorName}, БИН/ИИН: ${SITE_LEGAL.binOrIin}, ${SITE_LEGAL.address}`
    : isKz
      ? `${SITE_LEGAL.brandName}, ${SITE_LEGAL.address}`
      : `${SITE_LEGAL.brandName}, ${SITE_LEGAL.address}`;
  return {
    overline: isKz ? 'Құқықтық' : 'Правовое',
    operatorLine,
    effective: isKz ? SITE_LEGAL.effectiveDateKz : SITE_LEGAL.effectiveDateRu,
    email: SITE_LEGAL.email,
  };
}

export function TermsBody({ locale }: { locale: LegalLocale }) {
  const isKz = locale === 'kz';
  if (isKz) {
    return (
      <>
        <p>
          Осы Шарттар {SITE_LEGAL.brandName} сервисін (<OperatorLabel locale="kz" />) пайдалану
          ережелерін анықтайды. Сервисті пайдалана отырып, сіз осы
          шарттармен келісесіз.
        </p>
        <p>
          Сервис Қазақстандағы той, үйлену тойы және басқа мерекелерге арналған цифрлық шақырулар
          жасауға және жіберуге мүмкіндік береді.
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Тіркелу және OTP</h3>
        <p>
          Кіру телефон нөмірі және бір реттік код (OTP) арқылы жүреді. Сіз нөмірдің сізге тиесілі
          екеніне және аккаунттағы әрекеттерге жауаптысыз.
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Шақырулар және мазмұн</h3>
        <ul className={listClass}>
          <li>Тек жеке/отбасылық іс-шараларға арналған шақырулар жасауға болады.</li>
          <li>Спам, қорлаушы немесе заңсыз мазмұн жіберуге тыйым салынады.</li>
          <li>Қонақтардың деректеріне және олардың келісіміне сіз жауап бересіз.</li>
        </ul>
        <h3 className="font-display text-base font-medium text-us-ink">Төлем</h3>
        <p>
          Жариялау Kaspi Pay / Freedom Pay арқылы төленеді. Цифрлық қызметтің шарттары —
          жария офертада. Толығырақ:{' '}
          <Link href="/offer" className="text-us-accent hover:underline">
            Оферта
          </Link>{' '}
          және{' '}
          <Link href="/refund" className="text-us-accent hover:underline">
            Қайтару саясаты
          </Link>
          .
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Жауапкершілік</h3>
        <p>
          Сервис «сол қалпында» беріледі. Біз үзілістер, дерек жоғалуы немесе үшінші тұлғалардың
          әрекеттері үшін жауап бермейміз.
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Байланыс</h3>
        <p>
          Сұрақтар: <MailLink />
        </p>
      </>
    );
  }

  return (
    <>
      <p>
        Настоящие Условия регулируют использование сервиса {SITE_LEGAL.brandName} (
        <OperatorLabel locale="ru" />
        ). Используя Сервис, вы соглашаетесь с этими условиями.
      </p>
      <p>
        Сервис позволяет создавать и отправлять цифровые приглашения на той, свадьбы и другие
        семейные торжества в Казахстане.
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Регистрация и OTP</h3>
      <p>
        Вход выполняется по номеру телефона и одноразовому коду (OTP). Вы отвечаете за то, что
        номер принадлежит вам, и за действия в аккаунте.
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Приглашения и контент</h3>
      <ul className={listClass}>
        <li>Разрешены приглашения только на личные и семейные мероприятия.</li>
        <li>Запрещены спам, оскорбительный или незаконный контент.</li>
        <li>Вы несёте ответственность за данные гостей и наличие их согласия.</li>
      </ul>
      <h3 className="font-display text-base font-medium text-us-ink">Оплата</h3>
      <p>
        Публикация оплачивается через Kaspi Pay / Freedom Pay. Условия цифровой услуги — в
        публичной оферте. См.{' '}
        <Link href="/offer" className="text-us-accent hover:underline">
          Оферту
        </Link>{' '}
        и{' '}
        <Link href="/refund" className="text-us-accent hover:underline">
          Политику возврата
        </Link>
        .
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Ответственность</h3>
      <p>
        Сервис предоставляется «как есть». Мы не отвечаем за перерывы в работе, потерю данных или
        действия третьих лиц.
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Контакты</h3>
      <p>
        Вопросы: <MailLink />
      </p>
      <p>
        Также см.{' '}
        <Link href="/privacy" className="text-us-accent hover:underline">
          Политику конфиденциальности
        </Link>
        .
      </p>
    </>
  );
}

export function PrivacyBody({ locale }: { locale: LegalLocale }) {
  const isKz = locale === 'kz';
  if (isKz) {
    return (
      <>
        <h3 className="font-display text-base font-medium text-us-ink">Қандай деректерді жинаймыз</h3>
        <ul className={listClass}>
          <li>Телефон — OTP арқылы кіру үшін</li>
          <li>Шақыру деректері — атау, күн, орын, мәтін, фото, үлгі</li>
          <li>Қонақ деректері — есімдер, байланыс, қонақ жауаптары, тілектер</li>
          <li>Төлем метадеректері — тапсырыс статусы (Kaspi/Freedom); карта деректері бізге түспейді</li>
          <li>Техникалық деректер — IP, User-Agent, журналдар</li>
        </ul>
        <h3 className="font-display text-base font-medium text-us-ink">Қалай қолданамыз</h3>
        <p>
          Тек Сервис жұмысы үшін: аутентификация, шақыру жасау/жіберу, қонақ жауабы, төлемді растау.
          Жеке деректерді сатпаймыз және үшінші тұлғаларға мақсатсыз бермейміз (төлем провайдері мен
          заңмен белгіленген жағдайлардан басқа).
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Сақтау және жою</h3>
        <p>
          Деректер қорғалған серверлерде сақталады. Сессия әдетте 30 күннен кейін аяқталады.
          Аккаунтты және барлық деректерді жоюды сұрау:{' '}
          <MailLink />.
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Cookies</h3>
        <p>
          Авторизация (session_token) және тіл таңдауы үшін cookie қолданамыз. Браузерде өшіру
          мүмкін, бірақ кіру мен тіл сақталуы шектеледі. Жарнамалық трекерлер қолданбаймыз.
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Сіздің құқықтарыңыз</h3>
        <ul className={listClass}>
          <li>Деректердің көшірмесін алу</li>
          <li>Дәл емес деректерді түзету</li>
          <li>Аккаунт пен деректерді жою</li>
          <li>Өңдеуге келісімді қайтарып алу</li>
        </ul>
        <p>
          Байланыс: <MailLink />. Сондай-ақ{' '}
          <Link href="/terms" className="text-us-accent hover:underline">
            Пайдалану шарттары
          </Link>
          .
        </p>
      </>
    );
  }

  return (
    <>
      <h3 className="font-display text-base font-medium text-us-ink">Какие данные мы собираем</h3>
      <ul className={listClass}>
        <li>Телефон — для входа по OTP</li>
        <li>Данные приглашений — название, дата, место, тексты, фото, шаблон</li>
        <li>Данные гостей — имена, контакты, ответы гостей, пожелания</li>
        <li>
          Платёжные метаданные — статус заказа (Kaspi/Freedom); данные карты нам не передаются
        </li>
        <li>Технические данные — IP, User-Agent, журналы доступа</li>
      </ul>
      <h3 className="font-display text-base font-medium text-us-ink">Как используем</h3>
      <p>
        Только для работы Сервиса: аутентификация, создание и отправка приглашений, ответы гостей,
        подтверждение оплаты. Мы не продаём персональные данные и не передаём их третьим лицам без
        необходимости (кроме платёжного провайдера и случаев, предусмотренных законом).
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Хранение и удаление</h3>
      <p>
        Данные хранятся на защищённых серверах. Сессии обычно истекают через 30 дней. Удаление
        аккаунта и всех данных — по запросу на <MailLink />.
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Cookies</h3>
      <p>
        Используем cookies для авторизации (session_token) и языка. Отключение в браузере возможно,
        но ограничит вход и сохранение языка. Рекламные трекеры не используем.
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Ваши права</h3>
      <ul className={listClass}>
        <li>Получить копию данных</li>
        <li>Исправить неточные данные</li>
        <li>Удалить аккаунт и все данные</li>
        <li>Отозвать согласие на обработку</li>
      </ul>
      <p>
        Контакты: <MailLink />. Также см.{' '}
        <Link href="/terms" className="text-us-accent hover:underline">
          Условия использования
        </Link>
        .
      </p>
    </>
  );
}

export function OfferBody({ locale }: { locale: LegalLocale }) {
  const isKz = locale === 'kz';
  if (isKz) {
    return (
      <>
        <p>
          Осы құжат — <OperatorLabel locale="kz" /> ұсынатын публичкалық оферта. Сайтта төлем жасау —
          офертаны қабылдау болып саналады.
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Пән</h3>
        <p>
          Цифрлық қызмет: шақыру бетін жариялау және сілтеме арқылы қонақтарға қолжетімді ету
          (дизайн, қонақ жауабы, карта және басқа функциялар тарифке сай).
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Баға және төлем</h3>
        <p>
          Баға жариялау алдында көрсетіледі. Төлем Kaspi Pay немесе Freedom Pay арқылы. Карта
          деректері провайдерде өңделеді.
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Қызмет көрсету сәті</h3>
        <p>
          Төлем расталғаннан кейін шақыру жарияланады, сілтеме белсенді болады — цифрлық қызмет
          көрсетілген болып саналады.
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Қайтару</h3>
        <p>
          Цифрлық тауар/қызмет қайтару ережелері —{' '}
          <Link href="/refund" className="text-us-accent hover:underline">
            Қайтару саясатында
          </Link>
          .
        </p>
        <p>
          Байланыс: <MailLink />, {SITE_LEGAL.address}.
        </p>
      </>
    );
  }

  return (
    <>
      <p>
        Настоящий документ — публичная оферта <OperatorLabel locale="ru" />. Совершение оплаты на
        сайте означает акцепт оферты.
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Предмет</h3>
      <p>
        Цифровая услуга: публикация страницы-приглашения и доступ гостей по ссылке (дизайн, ответ гостей,
        карта и иные функции согласно тарифу).
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Цена и оплата</h3>
      <p>
        Цена указывается перед публикацией. Оплата через Kaspi Pay или Freedom Pay. Данные карты
        обрабатывает провайдер.
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Момент оказания</h3>
      <p>
        После подтверждения оплаты приглашение публикуется, ссылка становится активной — услуга
        считается оказанной.
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Возврат</h3>
      <p>
        Правила возврата цифровой услуги — в{' '}
        <Link href="/refund" className="text-us-accent hover:underline">
          Политике возврата
        </Link>
        .
      </p>
      <p>
        Контакты: <MailLink />, {SITE_LEGAL.address}.
      </p>
    </>
  );
}

export function RefundBody({ locale }: { locale: LegalLocale }) {
  const isKz = locale === 'kz';
  if (isKz) {
    return (
      <>
        <p>
          {SITE_LEGAL.brandName} цифрлық қызмет сатады (шақыруды жариялау). Төлем расталып, сілтеме
          белсенді болғаннан кейін қызмет көрсетілген деп есептеледі.
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Негізінен қайтару жоқ</h3>
        <p>
          Жарияланған цифрлық шақыру үшін ақша қайтарылмайды: сіз бірден нәтижені аласыз (бұқараға
          қолжетімді бет).
        </p>
        <h3 className="font-display text-base font-medium text-us-ink">Қайтару мүмкін болған жағдайлар</h3>
        <ul className={listClass}>
          <li>Қос төлем / техникалық қате — жариялау болмаса</li>
          <li>Төлем алынды, бірақ шақыру біздің кінәмізбен жарияланбады</li>
        </ul>
        <p>
          Өтініш: <MailLink />, тапсырыс нөмірі мен телефонды көрсетіңіз. Қарау мерзімі — әдетте 10
          жұмыс күніне дейін.
        </p>
        <p>
          Толығырақ шарттар —{' '}
          <Link href="/offer" className="text-us-accent hover:underline">
            Офертада
          </Link>
          .
        </p>
      </>
    );
  }

  return (
    <>
      <p>
        {SITE_LEGAL.brandName} продаёт цифровую услугу (публикация приглашения). После подтверждения
        оплаты и активации ссылки услуга считается оказанной.
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Как правило, без возврата</h3>
      <p>
        За уже опубликованное цифровое приглашение деньги не возвращаются: вы сразу получаете
        результат (доступная гостям страница).
      </p>
      <h3 className="font-display text-base font-medium text-us-ink">Когда возврат возможен</h3>
      <ul className={listClass}>
        <li>Двойное списание / техническая ошибка — если публикация не состоялась</li>
        <li>Оплата прошла, но приглашение не опубликовано по нашей вине</li>
      </ul>
      <p>
        Заявка: <MailLink />, укажите номер заказа и телефон. Срок рассмотрения — обычно до 10
        рабочих дней.
      </p>
      <p>
        Подробнее — в{' '}
        <Link href="/offer" className="text-us-accent hover:underline">
          Оферте
        </Link>
        .
      </p>
    </>
  );
}
