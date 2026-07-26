/**
 * One-shot lib/ reorganization + templates.ts split.
 * Run: node scripts/refactor-lib-structure.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const SRC = path.join(WEB_ROOT, 'src');
const LIB = path.join(SRC, 'lib');

const FILE_MOVES = {
  'auth.ts': 'auth/index.ts',
  'api-edge.ts': 'auth/api-edge.ts',
  'payment-amount.ts': 'payments/payment-amount.ts',
  'payment-provider-config.ts': 'payments/payment-provider-config.ts',
  'payment-route-auth.ts': 'payments/payment-route-auth.ts',
  'payment-sync.ts': 'payments/payment-sync.ts',
  'payment-webhook-status.ts': 'payments/payment-webhook-status.ts',
  'payments.ts': 'payments/index.ts',
  'kaspi-errors.ts': 'payments/kaspi-errors.ts',
  'kaspi-link.ts': 'payments/kaspi-link.ts',
  'checkout.ts': 'payments/checkout.ts',
  'checkout-client.ts': 'payments/checkout-client.ts',
  'mock-payment-guard.ts': 'payments/mock-payment-guard.ts',
  'invitation-payment-sync.ts': 'payments/invitation-payment-sync.ts',
  'pricing-integrity.ts': 'payments/pricing-integrity.ts',
  'order-completion.ts': 'payments/order-completion.ts',
  's3.ts': 'uploads/s3.ts',
  'upload-client.ts': 'uploads/upload-client.ts',
  'upload-registry.ts': 'uploads/upload-registry.ts',
  'upload-storage.ts': 'uploads/upload-storage.ts',
  'upload-token.ts': 'uploads/upload-token.ts',
  'upload-validation.ts': 'uploads/upload-validation.ts',
  'media-url.ts': 'uploads/media-url.ts',
  'invitation-publish.ts': 'invitations/invitation-publish.ts',
  'invitation-pricing.ts': 'invitations/invitation-pricing.ts',
  'preview-token.ts': 'invitations/preview-token.ts',
  'publish-flow.ts': 'invitations/publish-flow.ts',
  'publish-checklist.ts': 'invitations/publish-checklist.ts',
  'share-url.ts': 'invitations/share-url.ts',
  'draft-storage.ts': 'invitations/draft-storage.ts',
  'draft-sync-client.ts': 'invitations/draft-sync-client.ts',
  'actions.ts': 'invitations/actions.ts',
  'guest-analytics.ts': 'guests/guest-analytics.ts',
  'guest-reminders.ts': 'guests/guest-reminders.ts',
  'guest-serialize.ts': 'guests/guest-serialize.ts',
  'rsvp-status.ts': 'guests/rsvp-status.ts',
  'open-rsvp.ts': 'guests/open-rsvp.ts',
  'open-rsvp-config.ts': 'guests/open-rsvp-config.ts',
  'calendar-ics.ts': 'guests/calendar-ics.ts',
  'wish-fingerprint.ts': 'wishes/wish-fingerprint.ts',
  'wish-reactions.ts': 'wishes/wish-reactions.ts',
  'wish-sanitize.ts': 'wishes/wish-sanitize.ts',
  'template-categories.ts': 'templates/template-categories.ts',
  'template-data-schema.ts': 'templates/template-data-schema.ts',
  'template-identity.ts': 'templates/template-identity.ts',
  'template-resolve.ts': 'templates/template-resolve.ts',
  'catalog.ts': 'templates/catalog.ts',
  'text-presets.ts': 'templates/text-presets.ts',
  'program-presets.ts': 'templates/program-presets.ts',
  'category-seo.ts': 'templates/category-seo.ts',
  'landing-assets.ts': 'templates/landing-assets.ts',
  'api.ts': 'shared/api.ts',
  'utils.ts': 'shared/utils.ts',
  'env.ts': 'shared/env.ts',
  'rate-limit.ts': 'shared/rate-limit.ts',
  'types.ts': 'shared/types.ts',
  'redirect.ts': 'shared/redirect.ts',
  'design-tokens.ts': 'shared/design-tokens.ts',
  'db.ts': 'shared/db.ts',
  'db-server.ts': 'shared/db-server.ts',
  'notifications.ts': 'shared/notifications.ts',
  'cleanup.ts': 'shared/cleanup.ts',
  'production-startup.ts': 'shared/production-startup.ts',
  'sms.ts': 'shared/sms.ts',
  'captcha.ts': 'shared/captcha.ts',
  'captcha-client.ts': 'shared/captcha-client.ts',
  'social-links.ts': 'shared/social-links.ts',
  'map-url.ts': 'shared/map-url.ts',
  'ux-guided-flow.ts': 'shared/ux-guided-flow.ts',
  'quick-wizard-schema.ts': 'shared/quick-wizard-schema.ts',
  'quick-wizard-url.ts': 'shared/quick-wizard-url.ts',
  'custom-text-schema.ts': 'shared/custom-text-schema.ts',
  'event-datetime.ts': 'shared/event-datetime.ts',
  'kazakh-datetime.ts': 'shared/kazakh-datetime.ts',
  'countdown-labels.ts': 'shared/countdown-labels.ts',
  'brand-attribution.ts': 'shared/brand-attribution.ts',
};

const SERVICE_MOVES = {
  '../services/guests.ts': 'lib/guests/service.ts',
};

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function splitTemplates() {
  const src = fs.readFileSync(path.join(LIB, 'templates.ts'), 'utf8');
  const lines = src.split('\n');
  const slice = (start, end) => lines.slice(start - 1, end).join('\n');

  const constantsContent = `${slice(26, 38)}\n\n${slice(165, 189)}\n\n${slice(202, 210)}\n`;
  const typesContent = `import type { FONT_FAMILIES } from './constants';\n\n${slice(17, 24)}\n\nexport type FlagshipTemplateSlug = import('./constants').FLAGSHIP_TEMPLATE_SLUGS[number];\n\n${slice(42, 58)}\n\n${slice(192, 200)}\n\nexport type FontFamily = keyof typeof FONT_FAMILIES;\n\n${slice(218, 279)}\n`;
  const flagshipContent = `import type { FlagshipDecorProfile, FlagshipTemplateSlug } from '@/lib/shared/types';\nimport { FLAGSHIP_TEMPLATE_SLUGS } from './constants';\n\n${slice(60, 155)}\n`;
  const assetBundlesContent = `import type { TemplateConfig } from '@/lib/shared/types';\n\n${slice(212, 215)}\n\n${slice(281, 335)}\n`;
  const configsContent = `import { BRAND_ACCENTS, TEMPLATE_MUSIC } from './constants';\nimport { asset, flatAssets, frameAssets, withOverlays } from './asset-bundles';\nimport type { TemplateConfig } from '@/lib/shared/types';\n\n${slice(359, 1239)}\n`;
  const legacyContent = `${slice(1245, 1252)}\n`;
  const helpersContent = `import { FONT_FAMILIES } from './constants';\nimport { TEMPLATE_CONFIGS } from './configs';\nimport { LEGACY_TEMPLATE_MAP } from './legacy';\nimport type { TemplateConfig } from '@/lib/shared/types';\n\n${slice(157, 163)}\n\n${slice(1256, 1291)}\n`;
  const indexContent = `export * from './constants';\nexport * from '@/lib/shared/types';\nexport * from './flagship';\nexport * from './asset-bundles';\nexport * from './configs';\nexport * from './legacy';\nexport * from './helpers';\n`;

  const tplDir = path.join(LIB, 'templates');
  ensureDir(path.join(tplDir, 'index.ts'));
  fs.writeFileSync(path.join(tplDir, 'types.ts'), typesContent);
  fs.writeFileSync(path.join(tplDir, 'constants.ts'), constantsContent);
  fs.writeFileSync(path.join(tplDir, 'flagship.ts'), flagshipContent);
  fs.writeFileSync(path.join(tplDir, 'asset-bundles.ts'), assetBundlesContent);
  fs.writeFileSync(path.join(tplDir, 'configs.ts'), configsContent);
  fs.writeFileSync(path.join(tplDir, 'legacy.ts'), legacyContent);
  fs.writeFileSync(path.join(tplDir, 'helpers.ts'), helpersContent);
  fs.writeFileSync(path.join(tplDir, 'index.ts'), indexContent);
  fs.unlinkSync(path.join(LIB, 'templates.ts'));
  console.log('Split templates.ts → lib/templates/');
}

function moveFile(relFrom, relTo) {
  const from = path.join(LIB, relFrom);
  const to = path.join(LIB, relTo);
  if (!fs.existsSync(from)) {
    console.warn(`Skip missing: ${relFrom}`);
    return;
  }
  ensureDir(to);
  fs.renameSync(from, to);
}

function moveLibFiles() {
  for (const [from, to] of Object.entries(FILE_MOVES)) {
    moveFile(from, to);
  }

  const guestsFrom = path.join(SRC, 'services', 'guests.ts');
  const guestsTo = path.join(LIB, 'guests', 'service.ts');
  if (fs.existsSync(guestsFrom)) {
    ensureDir(guestsTo);
    fs.renameSync(guestsFrom, guestsTo);
    const servicesDir = path.join(SRC, 'services');
    if (fs.readdirSync(servicesDir).length === 0) {
      fs.rmdirSync(servicesDir);
    }
  }
  console.log('Moved lib modules into domain folders');
}

function buildImportMap() {
  const map = new Map();
  for (const [from, to] of Object.entries(FILE_MOVES)) {
    const base = from.replace(/\.ts$/, '');
    const newPath = to.replace(/\.ts$/, '').replace(/\/index$/, '');
    map.set(`@/lib/${base}`, `@/lib/${newPath}`);
  }
  map.set('@/lib/guests/service', '@/lib/guests/service');
  // templates folder — @/lib/templates stays (index.ts)
  return map;
}

function walkFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'coverage'].includes(entry.name)) continue;
      walkFiles(full, acc);
    } else if (/\.(ts|tsx|mjs|js)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function applyImportMap(content, importMap) {
  let result = content;
  const entries = [...importMap.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [oldPath, newPath] of entries) {
    result = result.split(oldPath).join(newPath);
  }

  // Fix relative ./ imports inside lib for moved modules
  const relativeMap = new Map();
  for (const [from, to] of Object.entries(FILE_MOVES)) {
    const base = from.replace(/\.ts$/, '');
    const newPath = to.replace(/\.ts$/, '').replace(/\/index$/, '');
    relativeMap.set(`'./${base}'`, `'@/lib/${newPath}'`);
    relativeMap.set(`"./${base}"`, `"@/lib/${newPath}"`);
  }
  const relEntries = [...relativeMap.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [oldPath, newPath] of relEntries) {
    result = result.split(oldPath).join(newPath);
  }

  // db-server re-export
  result = result.replace(
    "export { default } from '@/lib/shared/db'",
    "export { default } from '@/lib/shared/db'",
  );

  return result;
}

function updateAllImports(importMap) {
  const roots = [SRC, path.join(WEB_ROOT, 'scripts'), path.join(WEB_ROOT, 'e2e'), path.join(WEB_ROOT, 'instrumentation.ts')];
  const files = [];
  for (const root of roots) {
    if (fs.existsSync(root) && fs.statSync(root).isFile()) {
      files.push(root);
    } else if (fs.existsSync(root)) {
      walkFiles(root, files);
    }
  }

  let changed = 0;
  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const updated = applyImportMap(original, importMap);
    if (updated !== original) {
      fs.writeFileSync(file, updated);
      changed++;
    }
  }
  console.log(`Updated imports in ${changed} files`);
}

function fixDbServer() {
  const dbServer = path.join(LIB, 'shared', 'db-server.ts');
  if (fs.existsSync(dbServer)) {
    let content = fs.readFileSync(dbServer, 'utf8');
    content = content.replace("from '@/lib/shared/db'", "from '@/lib/shared/db'");
    fs.writeFileSync(dbServer, content);
  }
}

function main() {
  console.log('Starting lib refactor...');
  splitTemplates();
  moveLibFiles();
  const importMap = buildImportMap();
  updateAllImports(importMap);
  fixDbServer();
  console.log('Done.');
}

main();
