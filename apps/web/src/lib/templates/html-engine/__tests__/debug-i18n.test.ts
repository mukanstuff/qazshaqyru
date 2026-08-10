import { describe, it } from 'vitest';
import { bindDataAttributes } from '@/lib/templates/html-engine/binder';
import fs from 'node:fs';
import path from 'node:path';

describe('debug-i18n', () => {
  it('handles real hello-world file', () => {
    const projectRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');
    const filePath = path.join(projectRoot, 'public', 'templates-html', 'hello-world', 'index.html');
    const html = fs.readFileSync(filePath, 'utf8');
    const result = bindDataAttributes(
      html,
      { locale: 'kz', fields: {}, musicUrl: null, assets: {}, defaults: {} },
      {
        slug: 'hello-world',
        name: 'hello',
        htmlPath: '/x',
        assetsDir: '/x',
        accent: '#fff',
        eventTypes: ['generic'],
        fields: [],
      },
    );
    console.log('Result:', result);
  });
});