import { describe, it, expect } from 'vitest';
import {
  DEFAULT_QUICK_TEMPLATE,
  liveEditorHref,
  newInvitationRedirectHref,
  quickWizardHref,
} from '@/lib/shared/quick-wizard-url';

describe('quick-wizard-url', () => {
  it('uses default catalog template slug', () => {
    expect(DEFAULT_QUICK_TEMPLATE).toBe('luxe-gold');
  });

  it('builds encoded preview href from template slug', () => {
    expect(quickWizardHref('luxe-gold')).toBe('/preview/luxe-gold');
  });

  it('defaults to catalog template when slug omitted', () => {
    expect(quickWizardHref()).toContain('luxe-gold');
    expect(quickWizardHref()).toContain('/preview');
  });

  it('encodes special characters in template slug', () => {
    expect(quickWizardHref('toy & family')).toBe(
      `/preview/${encodeURIComponent('toy & family')}`,
    );
  });

  it('includes invitationId — redirects to canvas', () => {
    expect(liveEditorHref('luxe-gold', 'inv-1')).toBe('/invitations/inv-1/canvas');
  });
});

describe('newInvitationRedirectHref', () => {
  it('redirects to templates when template missing', () => {
    expect(newInvitationRedirectHref()).toBe('/templates');
    expect(newInvitationRedirectHref(null)).toBe('/templates');
    expect(newInvitationRedirectHref('')).toBe('/templates');
  });

  it('redirects to preview with same template', () => {
    expect(newInvitationRedirectHref('luxe-gold')).toBe('/preview/luxe-gold');
    expect(newInvitationRedirectHref('family-warm')).toBe(quickWizardHref('family-warm'));
  });
});
