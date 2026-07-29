import { describe, it, expect } from 'vitest';
import {
  DEFAULT_QUICK_TEMPLATE,
  liveEditorHref,
  newInvitationRedirectHref,
  quickWizardHref,
} from '@/lib/shared/quick-wizard-url';

describe('quick-wizard-url', () => {
  it('uses default catalog template slug', () => {
    expect(DEFAULT_QUICK_TEMPLATE).toBe('wedding-luxury');
  });

  it('builds encoded quick wizard href', () => {
    expect(quickWizardHref('wedding-luxury')).toBe(
      '/create?template=wedding-luxury',
    );
    expect(liveEditorHref('wedding-luxury')).toBe(
      '/create?template=wedding-luxury',
    );
  });

  it('defaults to catalog template when slug omitted', () => {
    expect(quickWizardHref()).toContain('wedding-luxury');
    expect(quickWizardHref()).toContain('/create');
  });

  it('encodes special characters in template slug', () => {
    expect(quickWizardHref('toy & family')).toBe(
      `/create?template=${encodeURIComponent('toy & family')}`,
    );
  });

  it('includes invitationId — redirects to canvas', () => {
    expect(liveEditorHref('wedding-luxury', 'inv-1')).toBe(
      '/invitations/inv-1/canvas',
    );
  });
});

describe('newInvitationRedirectHref', () => {
  it('redirects to templates when template missing', () => {
    expect(newInvitationRedirectHref()).toBe('/templates');
    expect(newInvitationRedirectHref(null)).toBe('/templates');
    expect(newInvitationRedirectHref('')).toBe('/templates');
  });

  it('redirects to quick wizard with same template', () => {
    expect(newInvitationRedirectHref('wedding-luxury')).toBe(
      '/create?template=wedding-luxury',
    );
    expect(newInvitationRedirectHref('family-warm')).toBe(quickWizardHref('family-warm'));
  });
});
