import { describe, it, expect } from 'vitest';
import {
  buildInvitationTitle,
  validateQuickWizardStep,
  type QuickWizardFormData,
} from '@/lib/shared/quick-wizard-schema';

const validForm: QuickWizardFormData = {
  eventType: 'wedding',
  names: 'Айгүл & Нұрлан',
  eventDate: '2030-06-15',
  eventTime: '18:00',
  eventPlace: 'Ресторан Астана',
  address: 'ул. Кенесары 10',
  coverPhoto: '',
};

describe('quick-wizard-schema', () => {
  it('buildInvitationTitle trims names', () => {
    expect(buildInvitationTitle('  Айгүл & Нұрлан  ')).toBe('Айгүл & Нұрлан');
    expect(buildInvitationTitle('   ')).toBe('');
  });

  it('validates step 1 event type', () => {
    expect(validateQuickWizardStep(1, { eventType: 'wedding' })).toEqual({ success: true });
    const result = validateQuickWizardStep(1, {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.eventType).toBeTruthy();
    }
  });

  it('validates step 2 names length', () => {
    expect(validateQuickWizardStep(2, { names: 'Айгүл' })).toEqual({ success: true });
    const short = validateQuickWizardStep(2, { names: 'A' });
    expect(short.success).toBe(false);
  });

  it('validates step 3 date required', () => {
    expect(validateQuickWizardStep(3, { eventDate: '2030-01-01' })).toEqual({ success: true });
    const missing = validateQuickWizardStep(3, { eventDate: '' });
    expect(missing.success).toBe(false);
  });

  it('validates step 4 venue required', () => {
    expect(validateQuickWizardStep(4, { eventPlace: 'Алматы' })).toEqual({ success: true });
    const missing = validateQuickWizardStep(4, { eventPlace: '' });
    expect(missing.success).toBe(false);
  });

  it('accepts full form on step 5', () => {
    expect(validateQuickWizardStep(5, validForm)).toEqual({ success: true });
  });
});
