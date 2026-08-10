import { describe, expect, it } from 'vitest';
import { renderHtmlTemplate, renderHtmlTemplateFragment } from '@/lib/templates/html-engine/renderer';
import type { HtmlTemplateData, HtmlTemplateDescriptor } from '@/lib/templates/html-engine/types';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function makeFixture(): {
  root: string;
  descriptor: HtmlTemplateDescriptor;
  data: HtmlTemplateData;
} {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'html-render-'));
  const htmlDir = path.join(root, 'public');
  fs.mkdirSync(htmlDir, { recursive: true });
  const htmlPath = path.join(htmlDir, 'wedding.html');
  fs.writeFileSync(
    htmlPath,
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body>
  <h1 data-bind="couple"></h1>
  <p data-bind="eventDate"></p>
  <div data-i18n-kk="Қош келдіңіз" data-i18n-ru="Добро пожаловать"></div>
</body>
</html>`,
    'utf8',
  );

  const descriptor: HtmlTemplateDescriptor = {
    slug: 'demo',
    name: 'Demo',
    htmlPath: 'wedding.html',
    accent: '#c8a96a',
    fields: [
      { key: 'groomName', type: 'string', fallback: 'A' },
      { key: 'brideName', type: 'string', fallback: 'B' },
      { key: 'eventDate', type: 'date' },
    ],
    computed: [{ key: 'couple', expr: '${groomName} & ${brideName}' }],
  };

  const data: HtmlTemplateData = {
    locale: 'kz',
    fields: { groomName: 'Azat', brideName: 'Aigerim', eventDate: '2026-09-12' },
  };

  return { root, descriptor, data };
}

describe('renderHtmlTemplateFragment', () => {
  it('returns bound fragment with computed values', () => {
    const { root, descriptor, data } = makeFixture();
    const result = renderHtmlTemplateFragment(descriptor, data, { root });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.html).toContain('Azat &amp; Aigerim');
      expect(result.html).toContain('2026-09-12');
      expect(result.resolved.couple).toBe('Azat & Aigerim');
    }
  });

  it('returns error when template file missing', () => {
    const { root, descriptor, data } = makeFixture();
    fs.rmSync(path.join(root, 'public', 'wedding.html'));
    const result = renderHtmlTemplateFragment(descriptor, data, { root });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not found/i);
    }
  });
});

describe('renderHtmlTemplate', () => {
  it('injects title, theme-color, and og:meta into head', () => {
    const { root, descriptor, data } = makeFixture();
    const result = renderHtmlTemplate(descriptor, data, { root });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.html).toContain('<title>');
      expect(result.html).toContain('theme-color');
      expect(result.html).toContain('og:title');
    }
  });

  it('respects htmlLang override', () => {
    const { root, descriptor, data } = makeFixture();
    const result = renderHtmlTemplate(descriptor, data, {
      root,
      htmlLang: 'ru',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.html).toContain('og:locale" content="ru_RU');
    }
  });
});