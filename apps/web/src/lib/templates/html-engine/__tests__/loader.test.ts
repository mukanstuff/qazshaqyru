import { describe, expect, it } from 'vitest';
import { loadHtmlTemplate } from '@/lib/templates/html-engine/loader';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'html-tpl-test-'));
const tmpPublic = path.join(tmpRoot, 'public');
fs.mkdirSync(tmpPublic, { recursive: true });

describe('loadHtmlTemplate', () => {
  it('reads template HTML under <root>/public/', () => {
    const filePath = path.join(tmpPublic, 'index.html');
    fs.writeFileSync(filePath, '<div data-bind="groomName">x</div>', 'utf8');

    const result = loadHtmlTemplate(filePath, { root: tmpRoot });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.html).toContain('data-bind');
    }
  });

  it('returns error when file missing under public/', () => {
    const result = loadHtmlTemplate(path.join(tmpPublic, 'missing.html'), {
      root: tmpRoot,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not found/i);
    }
  });

  it('rejects paths outside the public/ tree', () => {
    const outsidePath = path.join(tmpRoot, 'index.html');
    fs.writeFileSync(outsidePath, 'secret', 'utf8');
    const result = loadHtmlTemplate(outsidePath, { root: tmpRoot });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/outside/i);
    }
  });
});
