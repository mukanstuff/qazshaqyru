import { describe, expect, it } from 'vitest';
import type { TemplateFieldDef } from '@/lib/templates/manifest-types';
import {
  getMissingGateKeys,
  getPreviewSectionForField,
  isPaymentStep,
  resolveWizardSteps,
  wizardFieldDomId,
} from '@/lib/templates/create-wizard-steps';

function field(key: string, required = false): TemplateFieldDef {
  return {
    key,
    type: 'text',
    required,
    labelRu: key,
    labelKz: key,
  };
}

describe('resolveWizardSteps', () => {
  it('intersects manifest fields and keeps ready step', () => {
    const visible = [
      field('groomName', true),
      field('brideName', true),
      field('eventDate', true),
      field('venueName', true),
      field('bodyTextKz', true),
      field('coverPhoto'),
    ];

    const { steps } = resolveWizardSteps(visible);
    expect(steps.map((s) => s.id)).toEqual(['who', 'whenWhere', 'story', 'ready']);
    expect(steps[0].fields.map((f) => f.key)).toEqual(['groomName', 'brideName']);
    expect(steps[1].fields.map((f) => f.key)).toEqual(['eventDate', 'venueName']);
    expect(steps[2].fields.map((f) => f.key)).toEqual(['coverPhoto', 'bodyTextKz']);
    expect(steps[3].fields).toEqual([]);
  });

  it('drops empty content steps when fields missing', () => {
    const { steps } = resolveWizardSteps([field('groomName'), field('brideName')]);
    expect(steps.map((s) => s.id)).toEqual(['who', 'ready']);
  });
});

describe('getMissingGateKeys', () => {
  it('returns empty keys that fail soft gate', () => {
    expect(
      getMissingGateKeys(['groomName', 'brideName'], {
        groomName: 'Нурлан',
        brideName: '  ',
      }),
    ).toEqual(['brideName']);
  });

  it('returns all missing gate keys in order', () => {
    expect(
      getMissingGateKeys(['eventDate', 'eventTime', 'venueName'], {
        eventDate: '',
        eventTime: '17:00',
        venueName: undefined,
      }),
    ).toEqual(['eventDate', 'venueName']);
  });
});

describe('preview + payment gates', () => {
  it('maps form fields to invitation data-section ids', () => {
    expect(getPreviewSectionForField('groomName')).toBe('hero-names');
    expect(getPreviewSectionForField('venueName')).toBe('venue-map');
    expect(getPreviewSectionForField('coverPhoto')).toBe('cover-photo');
    expect(getPreviewSectionForField('unknownField')).toBeNull();
  });

  it('payment CTA only on ready step', () => {
    expect(isPaymentStep('who')).toBe(false);
    expect(isPaymentStep('whenWhere')).toBe(false);
    expect(isPaymentStep('story')).toBe(false);
    expect(isPaymentStep('ready')).toBe(true);
  });

  it('builds stable field DOM ids for scroll-to-error', () => {
    expect(wizardFieldDomId('brideName')).toBe('qe-brideName');
  });
});
