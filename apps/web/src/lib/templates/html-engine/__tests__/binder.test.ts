import { describe, expect, it } from 'vitest';
import { bindDataAttributes, resolveFieldValues } from '@/lib/templates/html-engine/binder';
import type { HtmlTemplateData, HtmlTemplateDescriptor } from '@/lib/templates/html-engine/types';

const baseDescriptor: HtmlTemplateDescriptor = {
  slug: 'luxe-gold',
  htmlPath: '/templates-html/luxe-gold/index.html',
  assetsDir: '/templates-html/luxe-gold/assets',
  accent: '#8a7344',
  name: 'Luxe Gold',
  eventTypes: ['wedding'],
  fields: [
    { key: 'groomName', default: 'Нұрлан' },
    { key: 'brideName', default: 'Айгерім' },
    { key: 'eventDate', default: '2026-09-12' },
    { key: 'eventTime', default: '17:00' },
    { key: 'venueName', default: 'Ресторан Жарық' },
    { key: 'venueAddress', default: 'г. Алматы', optional: true },
  ],
};

const baseData: HtmlTemplateData = {
  locale: 'ru',
  musicUrl: null,
  fields: {
    groomName: 'Нұрлан',
    brideName: 'Айгерим',
    eventDate: '2026-09-12',
    eventTime: '17:00',
    venueName: 'Ресторан Жарық',
    venueAddress: '',
  },
  assets: {
    hero: '/templates-html/luxe-gold/assets/hero.jpg',
    seal: '/templates-html/luxe-gold/assets/seal.svg',
  },
  defaults: {
    groomName: 'Нұрлан',
    brideName: 'Айгерім',
    eventDate: '2026-09-12',
    eventTime: '17:00',
    venueName: 'Ресторан Жарық',
  },
};

describe('resolveFieldValues', () => {
  it('uses user-provided value when present', () => {
    const result = resolveFieldValues(baseData, baseDescriptor);
    expect(result.groomName).toBe('Нұрлан');
  });

  it('falls back to default when value is empty', () => {
    const result = resolveFieldValues(baseData, baseDescriptor);
    expect(result.venueAddress).toBe(''); // optional, keeps empty
  });

  it('falls back to descriptor default when user value missing entirely', () => {
    const data: HtmlTemplateData = {
      ...baseData,
      fields: { ...baseData.fields, groomName: '' },
    };
    const result = resolveFieldValues(data, baseDescriptor);
    expect(result.groomName).toBe('Нұрлан');
  });
});

describe('bindDataAttributes', () => {
  it('replaces data-bind text content', () => {
    const html = `<h1 data-bind="groomName">placeholder</h1>`;
    const result = bindDataAttributes(html, baseData);
    expect(result).toContain('Нұрлан');
    expect(result).not.toContain('placeholder');
  });

  it('replaces data-bind-attr-href attribute', () => {
    const html = `<a data-bind-attr-href="mapUrl" href="#">Map</a>`;
    const result = bindDataAttributes(html, baseData);
    expect(result).toMatch(/href="[^"]+"/);
  });

  it('handles data-bind-component placeholder', () => {
    const html = `<div data-bind-component="countdown" data-bind="eventDate">--</div>`;
    const result = bindDataAttributes(html, baseData);
    expect(result).toContain('2026-09-12');
  });

  it('escapes HTML special chars in user data', () => {
    const html = `<span data-bind="groomName">x</span>`;
    const data: HtmlTemplateData = {
      ...baseData,
      fields: { ...baseData.fields, groomName: '<script>alert(1)</script>' },
    };
    const result = bindDataAttributes(html, data);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('preserves data-i18n-kk / data-i18n-ru based on locale', () => {
    const html = `<span data-i18n-kk="Қош келдіңіз" data-i18n-ru="Добро пожаловать">placeholder</span>`;
    expect(bindDataAttributes(html, baseData)).toContain('Добро пожаловать');
    expect(
      bindDataAttributes(html, { ...baseData, locale: 'kz' }),
    ).toContain('Қош келдіңіз');
    expect(
      bindDataAttributes(html, { ...baseData, locale: 'kz' }),
    ).not.toContain('Добро пожаловать');
  });

  it('escapes HTML in i18n attribute values', () => {
    const html = `<span data-i18n-kk="Қош" data-i18n-ru="<img src=x onerror=alert(1)>">x</span>`;
    const data: HtmlTemplateData = {
      ...baseData,
      locale: 'ru',
      fields: {
        ...baseData.fields,
      },
    };
    const result = bindDataAttributes(html, data);
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });
});
