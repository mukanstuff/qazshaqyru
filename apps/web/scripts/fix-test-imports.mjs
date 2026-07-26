import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, '..', 'src', 'lib', '__tests__');

const moves = {
  auth: '@/lib/auth',
  'api-edge': '@/lib/auth/api-edge',
  'payment-amount': '@/lib/payments/payment-amount',
  'payment-provider-config': '@/lib/payments/payment-provider-config',
  'payment-route-auth': '@/lib/payments/payment-route-auth',
  'payment-sync': '@/lib/payments/payment-sync',
  'payment-webhook-status': '@/lib/payments/payment-webhook-status',
  payments: '@/lib/payments',
  'kaspi-errors': '@/lib/payments/kaspi-errors',
  'kaspi-link': '@/lib/payments/kaspi-link',
  checkout: '@/lib/payments/checkout',
  'checkout-client': '@/lib/payments/checkout-client',
  'mock-payment-guard': '@/lib/payments/mock-payment-guard',
  'invitation-payment-sync': '@/lib/payments/invitation-payment-sync',
  'pricing-integrity': '@/lib/payments/pricing-integrity',
  'order-completion': '@/lib/payments/order-completion',
  s3: '@/lib/uploads/s3',
  'upload-client': '@/lib/uploads/upload-client',
  'upload-registry': '@/lib/uploads/upload-registry',
  'upload-storage': '@/lib/uploads/upload-storage',
  'upload-token': '@/lib/uploads/upload-token',
  'upload-validation': '@/lib/uploads/upload-validation',
  'media-url': '@/lib/uploads/media-url',
  'invitation-publish': '@/lib/invitations/invitation-publish',
  'invitation-pricing': '@/lib/invitations/invitation-pricing',
  'preview-token': '@/lib/invitations/preview-token',
  'publish-flow': '@/lib/invitations/publish-flow',
  'publish-checklist': '@/lib/invitations/publish-checklist',
  'share-url': '@/lib/invitations/share-url',
  'draft-storage': '@/lib/invitations/draft-storage',
  'draft-sync-client': '@/lib/invitations/draft-sync-client',
  actions: '@/lib/invitations/actions',
  'guest-analytics': '@/lib/guests/guest-analytics',
  'guest-reminders': '@/lib/guests/guest-reminders',
  'guest-serialize': '@/lib/guests/guest-serialize',
  'rsvp-status': '@/lib/guests/rsvp-status',
  'open-rsvp': '@/lib/guests/open-rsvp',
  'open-rsvp-config': '@/lib/guests/open-rsvp-config',
  'calendar-ics': '@/lib/guests/calendar-ics',
  'wish-fingerprint': '@/lib/wishes/wish-fingerprint',
  'wish-reactions': '@/lib/wishes/wish-reactions',
  'wish-sanitize': '@/lib/wishes/wish-sanitize',
  'template-categories': '@/lib/templates/template-categories',
  'template-data-schema': '@/lib/templates/template-data-schema',
  'template-identity': '@/lib/templates/template-identity',
  'template-resolve': '@/lib/templates/template-resolve',
  catalog: '@/lib/templates/catalog',
  'text-presets': '@/lib/templates/text-presets',
  'program-presets': '@/lib/templates/program-presets',
  'category-seo': '@/lib/templates/category-seo',
  'landing-assets': '@/lib/templates/landing-assets',
  templates: '@/lib/templates',
  api: '@/lib/shared/api',
  utils: '@/lib/shared/utils',
  env: '@/lib/shared/env',
  'rate-limit': '@/lib/shared/rate-limit',
  types: '@/lib/shared/types',
  redirect: '@/lib/shared/redirect',
  'design-tokens': '@/lib/shared/design-tokens',
  db: '@/lib/shared/db',
  'db-server': '@/lib/shared/db-server',
  notifications: '@/lib/shared/notifications',
  cleanup: '@/lib/shared/cleanup',
  'production-startup': '@/lib/shared/production-startup',
  sms: '@/lib/shared/sms',
  captcha: '@/lib/shared/captcha',
  'captcha-client': '@/lib/shared/captcha-client',
  'social-links': '@/lib/shared/social-links',
  'map-url': '@/lib/shared/map-url',
  'ux-guided-flow': '@/lib/shared/ux-guided-flow',
  'quick-wizard-schema': '@/lib/shared/quick-wizard-schema',
  'quick-wizard-url': '@/lib/shared/quick-wizard-url',
  'custom-text-schema': '@/lib/shared/custom-text-schema',
  'event-datetime': '@/lib/shared/event-datetime',
  'kazakh-datetime': '@/lib/shared/kazakh-datetime',
  'countdown-labels': '@/lib/shared/countdown-labels',
  'brand-attribution': '@/lib/shared/brand-attribution',
};

for (const file of fs.readdirSync(testDir)) {
  if (!file.endsWith('.test.ts')) continue;
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const entries = Object.entries(moves).sort((a, b) => b[0].length - a[0].length);
  for (const [mod, target] of entries) {
    content = content.replaceAll(`from '../${mod}'`, `from '${target}'`);
    content = content.replaceAll(`from "../${mod}"`, `from "${target}"`);
  }
  fs.writeFileSync(filePath, content);
}

console.log('Fixed lib __tests__ imports');
