import { describe, it, expect } from 'vitest';
import { resolvePublishStep } from '@/lib/invitations/publish-flow';

describe('resolvePublishStep', () => {
  it('returns pay when published', () => {
    expect(
      resolvePublishStep({ isPublished: true, isLoggedIn: true, needsPayment: true })
    ).toBe('pay');
  });

  it('returns create for draft without auth', () => {
    expect(
      resolvePublishStep({ isPublished: false, isLoggedIn: false, needsPayment: false })
    ).toBe('create');
  });

  it('returns pay when payment pending', () => {
    expect(
      resolvePublishStep({
        isPublished: false,
        isLoggedIn: true,
        needsPayment: true,
        paymentPending: true,
      })
    ).toBe('pay');
  });

  it('returns guests when logged in without guests', () => {
    expect(
      resolvePublishStep({
        isPublished: false,
        isLoggedIn: true,
        needsPayment: true,
        paymentPending: false,
        guestCount: 0,
      })
    ).toBe('guests');
  });

  it('returns pay when guests added', () => {
    expect(
      resolvePublishStep({
        isPublished: false,
        isLoggedIn: true,
        needsPayment: true,
        guestCount: 3,
      })
    ).toBe('pay');
  });

  it('returns pay in wizard preview step', () => {
    expect(
      resolvePublishStep({
        isPublished: false,
        isLoggedIn: true,
        needsPayment: true,
        wizardMode: true,
      })
    ).toBe('pay');
  });
});
