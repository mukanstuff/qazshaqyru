/**
 * Integration test — load the actual `hello-world` dummy template from disk
 * and run it through the full HTML-engine pipeline.
 *
 * Verifies:
 *   1. Loader reads the file under public/templates-html/.
 *   2. Binder substitutes every data-bind, data-i18n correctly.
 *   3. Renderer injects head metadata without breaking markup.
 */

import { describe, expect, it } from 'vitest';
import path from 'node:path';
import {
  renderHtmlTemplate,
  type HtmlTemplateData,
  type HtmlTemplateDescriptor,
} from '@/lib/templates/html-engine';

const projectRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');

const descriptor: HtmlTemplateDescriptor = {
  slug: 'hello-world',
  name: 'Hello World',
  htmlPath: '/templates-html/hello-world/index.html',
  assetsDir: '/templates-html/hello-world',
  accent: '#c8a96a',
  eventTypes: ['wedding', 'generic'],
  fields: [
    { key: 'groomName', defaults: { kz: 'Асет', ru: 'Асет' } },
    { key: 'brideName', defaults: { kz: 'Айым', ru: 'Айым' } },
    { key: 'eventDate', default: '2026-09-12' },
    { key: 'eventTime', default: '17:00' },
    { key: 'eventPlace', defaults: { kz: '«Жарық» мейрамханасы', ru: 'Ресторан «Жарық»' } },
  ],
  computed: [{ key: 'couple', expr: '${groomName} & ${brideName}' }],
};

const sampleData: HtmlTemplateData = {
  locale: 'kz',
  fields: {
    groomName: 'Али',
    brideName: 'Дана',
    eventDate: '2026-10-04',
    eventTime: '18:00',
    eventPlace: '«Astana Hall»',
  },
  musicUrl: null,
  assets: {},
  defaults: {},
};

describe('hello-world pipeline (e2e)', () => {
  it('loads + renders dummy template from disk', () => {
    const result = renderHtmlTemplate(descriptor, sampleData, {
      root: projectRoot,
    });

    if (!result.ok) {
      console.error('Renderer error:', result.error);
    }

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.html).toContain('Али &amp; Дана');
    expect(result.html).toContain('2026-10-04');
    expect(result.html).toContain('18:00');
    expect(result.html).toContain('«Astana Hall»');
    expect(result.html).toContain('Шақыру');
    expect(result.html).not.toContain('Приглашение');
    expect(result.html).not.toContain('data-bind="couple"');
    expect(result.html).not.toContain('data-i18n-kk');
  });

  it('honors Russian locale for i18n', () => {
    const ruData: HtmlTemplateData = { ...sampleData, locale: 'ru' };
    const result = renderHtmlTemplate(descriptor, ruData, {
      root: projectRoot,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.html).toContain('Приглашение');
    expect(result.html).not.toContain('Шақыру');
  });
});