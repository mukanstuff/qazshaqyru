import type { TemplateManifest } from '../manifest-types';



const SLUG = 'wedding-luxury';



export const WEDDING_LUXURY_MANIFEST: TemplateManifest = {

  slug: SLUG,

  renderEngine: 'react-sections',

  eventTypeProfile: 'wedding',

  theme: {

    accent: '#8a7344',

    textLight: '#faf8f5',

    textDark: '#5c4a32',

    fonts: {

      display: 'var(--inv-font-display)',

      body: 'var(--inv-font-body)',

      label: 'var(--inv-font-label)',

      ceremonial: 'var(--inv-font-ceremonial)',

    },

  },

  assets: {

    bgTexture: 'backgrounds/bg-paper-01.webp',

    frameGreeting: 'backgrounds/frame-greeting.webp',

    frameDate: 'backgrounds/frame-date.webp',

    countdownBg: 'backgrounds/countdown-bg.webp',

    bgCover: 'hero/hero-01.webp',

    bgCoverAlt: 'hero/hero-02.webp',

    heroPoster: 'hero/hero-poster.webp',

    cornerTl: 'ornaments/corner-01.png',

    cornerTr: 'ornaments/corner-02.png',

    cornerBl: 'ornaments/corner-03.png',

    cornerBr: 'ornaments/corner-04.png',

    divider: 'dividers/divider-hero.png',

    dividerCard: 'dividers/divider-card.png',

    dividerRose: 'dividers/divider-rose.png',

    confettiL: 'ornaments/confetti-l.png',

    confettiR: 'ornaments/confetti-r.png',

    dressArt: 'ornaments/dress-art.png',

    emblemPrimary: 'ornaments/emblem-01.png',

    emblemSecondary: 'ornaments/emblem-02.png',

    frameOrnament: 'ornaments/frame-01.png',

    frameOrnamentAlt: 'ornaments/frame-02.png',

    overlayGrain: 'overlays/overlay-grain-01.webp',

    overlayVignette: 'overlays/overlay-vignette-01.webp',

    overlayGlow: 'overlays/overlay-glow-01.webp',

  },

  fields: [

    {

      key: 'groomName',

      type: 'text',

      required: true,

      labelRu: 'Имя жениха',

      labelKz: 'Күйеу жігіт аты',

      defaultRu: 'Нурлан',

      defaultKz: 'Нұрлан',

      profiles: ['wedding'],

    },

    {

      key: 'brideName',

      type: 'text',

      required: true,

      labelRu: 'Имя невесты',

      labelKz: 'Келін аты',

      defaultRu: 'Айгерим',

      defaultKz: 'Айгерім',

      profiles: ['wedding'],

    },

    {

      key: 'hostsLine',

      type: 'text',

      required: false,

      labelRu: 'Строка от семьи',

      labelKz: 'Отбасы жолы',

      // Empty default — livelier placeholder lives in quickEdit i18n.

    },

    {

      key: 'eventDate',

      type: 'date',

      required: true,

      labelRu: 'Дата торжества',

      labelKz: 'Той күні',

    },

    {

      key: 'eventTime',

      type: 'time',

      required: true,

      labelRu: 'Время',

      labelKz: 'Уақыты',

      defaultRu: '17:00',

      defaultKz: '17:00',

    },

    {

      key: 'venueName',

      type: 'text',

      required: true,

      labelRu: 'Место проведения',

      labelKz: 'Мекен-жай атауы',

      defaultRu: 'Ресторан «Абиба»',

      defaultKz: '«Абиба» мейрамханасы',

    },

    {

      key: 'venueAddress',

      type: 'text',

      required: false,

      labelRu: 'Адрес',

      labelKz: 'Мекен-жайы',

      defaultRu: 'г. Алматы',

      defaultKz: 'Алматы қ.',

    },

    {

      key: 'mapUrl',

      type: 'url',

      required: false,

      labelRu: 'Ссылка на карту',

      labelKz: 'Кarta сілтемесі',

    },

    {

      key: 'bodyTextKz',

      type: 'textarea',

      required: true,

      labelRu: 'Текст приглашения (KZ)',

      labelKz: 'Шақыру мәтіні (KZ)',

    },

    {

      key: 'bodyTextRu',

      type: 'textarea',

      required: false,

      labelRu: 'Текст приглашения (RU)',

      labelKz: 'Шақыру мәтіні (RU)',

    },

    {

      key: 'coverPhoto',

      type: 'image',

      required: false,

      labelRu: 'Фото пары',

      labelKz: 'Жұп фотосы',

    },

    {

      key: 'dressCodeTitle',

      type: 'text',

      required: false,

      labelRu: 'Дресс-код (заголовок)',

      labelKz: 'Киім коды (тақырып)',

      defaultRu: 'Дресс-код',

      defaultKz: 'Киім коды',

    },

    {

      key: 'dressCodeNote',

      type: 'textarea',

      required: false,

      labelRu: 'Дресс-код (описание)',

      labelKz: 'Киім коды (сипаттама)',

      defaultRu: 'Классический вечерний наряд. Пастельные и тёплые тона приветствуются.',

      defaultKz: 'Классикалық кешкі киім. Пастель және жылы реңктерді қоштаймыз.',

    },

    {

      key: 'galleryPhoto1',

      type: 'image',

      required: false,

      labelRu: 'Фото галереи 1',

      labelKz: 'Галерея фото 1',

    },

    {

      key: 'galleryPhoto2',

      type: 'image',

      required: false,

      labelRu: 'Фото галереи 2',

      labelKz: 'Галерея фото 2',

    },

    {

      key: 'galleryPhoto3',

      type: 'image',

      required: false,

      labelRu: 'Фото галереи 3',

      labelKz: 'Галерея фото 3',

    },

    {

      key: 'galleryPhoto4',

      type: 'image',

      required: false,

      labelRu: 'Фото галереи 4',

      labelKz: 'Галерея фото 4',

    },

    {

      key: 'finalText',

      type: 'textarea',

      required: false,

      labelRu: 'Заключительный текст',

      labelKz: 'Қорытынды мәтін',

      defaultRu: 'Будем рады видеть вас на нашем празднике!',

      defaultKz: 'Сіздерді тойымызда күтеміз!',

    },

  ],

  sections: [

    { id: 'envelope-intro', type: 'envelope-intro', props: { variant: 'gold' } },

    {

      id: 'hero-names',

      type: 'hero-names',

      fieldBindings: { groomName: 'groomName', brideName: 'brideName' },

      props: { useVideo: true },

    },

    {

      id: 'body-invitation',

      type: 'body-invitation',

      fieldBindings: {

        bodyText: 'bodyTextKz',

        bodyTextRu: 'bodyTextRu',

        groomName: 'groomName',

        brideName: 'brideName',

        hostsLine: 'hostsLine',

      },

      props: { frame: 'frameGreeting' },

    },

    {

      id: 'cover-photo',

      type: 'cover-photo',

      fieldBindings: { photo: 'coverPhoto' },

      props: { optional: true },

    },

    {

      id: 'calendar',

      type: 'calendar',

      fieldBindings: { eventDate: 'eventDate' },

      props: { frame: 'frameDate' },

    },

    {

      id: 'countdown',

      type: 'countdown',

      fieldBindings: { eventDate: 'eventDate', eventTime: 'eventTime' },

    },

    {

      id: 'venue-map',

      type: 'venue-map',

      fieldBindings: {

        venueName: 'venueName',

        venueAddress: 'venueAddress',

        mapUrl: 'mapUrl',

        eventTime: 'eventTime',

      },

      props: { frame: 'frameDate' },

    },

    {

      id: 'dress-code',

      type: 'dress-code',

      fieldBindings: { title: 'dressCodeTitle', note: 'dressCodeNote' },

    },

    {

      id: 'gallery',

      type: 'gallery',

      fieldBindings: {

        photo1: 'galleryPhoto1',

        photo2: 'galleryPhoto2',

        photo3: 'galleryPhoto3',

        photo4: 'galleryPhoto4',

      },

    },

    { id: 'rsvp', type: 'rsvp' },

    { id: 'program', type: 'program', canHide: true, canReorder: true },

    { id: 'kaspi', type: 'kaspi', canHide: true, canReorder: true },

    { id: 'wishes', type: 'wishes' },

    { id: 'music', type: 'music' },

    {

      id: 'final-text',

      type: 'final-text',

      fieldBindings: { text: 'finalText' },

    },

  ],

};


