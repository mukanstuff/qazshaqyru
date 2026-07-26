import type { TemplateManifest } from '../manifest-types';

/**
 * Minimal technical fixture for Template Contract + wiring tests.
 * Not in sales catalog — register in manifests + TEMPLATE_CONFIGS only.
 */
export const WIRING_STUB_MANIFEST: TemplateManifest = {
  slug: 'wiring-stub',
  renderEngine: 'react-sections',
  eventTypeProfile: 'wedding',
  theme: {
    accent: '#6e6845',
    textLight: '#faf8f5',
    textDark: '#3f3a2e',
    fonts: {
      display: 'var(--inv-font-display)',
      body: 'var(--inv-font-body)',
    },
  },
  assets: {},
  fields: [
    {
      key: 'groomName',
      type: 'text',
      required: true,
      labelRu: 'Имя жениха',
      labelKz: 'Күйеу жігіт аты',
      defaultRu: 'Али',
      defaultKz: 'Әли',
      profiles: ['wedding'],
    },
    {
      key: 'brideName',
      type: 'text',
      required: true,
      labelRu: 'Имя невесты',
      labelKz: 'Қалыңдық аты',
      defaultRu: 'Аяла',
      defaultKz: 'Аяла',
      profiles: ['wedding'],
    },
    {
      key: 'bodyTextKz',
      type: 'textarea',
      required: false,
      labelRu: 'Текст (KZ)',
      labelKz: 'Мәтін (KZ)',
      defaultKz: 'Сіздерді тойға шақырамыз.',
    },
    {
      key: 'bodyTextRu',
      type: 'textarea',
      required: false,
      labelRu: 'Текст (RU)',
      labelKz: 'Мәтін (RU)',
      defaultRu: 'Приглашаем вас на торжество.',
    },
    {
      key: 'coverPhoto',
      type: 'image',
      required: false,
      labelRu: 'Фото',
      labelKz: 'Фото',
    },
    {
      key: 'eventDate',
      type: 'date',
      required: true,
      labelRu: 'Дата',
      labelKz: 'Күні',
    },
  ],
  sections: [
    {
      id: 'hero-names',
      type: 'hero-names',
      defaultVisible: true,
      canHide: false,
      canReorder: false,
      fieldBindings: { groomName: 'groomName', brideName: 'brideName' },
    },
    {
      id: 'cover-photo',
      type: 'cover-photo',
      defaultVisible: true,
      canHide: true,
      canReorder: true,
      fieldBindings: { photo: 'coverPhoto' },
      props: { optional: true },
    },
    {
      id: 'body-invitation',
      type: 'body-invitation',
      defaultVisible: true,
      canHide: true,
      canReorder: true,
      fieldBindings: {
        bodyText: 'bodyTextKz',
        bodyTextRu: 'bodyTextRu',
        groomName: 'groomName',
        brideName: 'brideName',
      },
    },
  ],
};
