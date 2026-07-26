import { describe, it, expect } from 'vitest';

/**
 * Pure gates for guest chrome vs envelope ritual.
 * Mirrors LayoutRouter rules without mounting React.
 */
function shouldAutoOpenRsvp(opts: {
  canRSVP: boolean;
  openRsvpEnabled: boolean;
  envelopeSeen: boolean;
  hasToken: boolean;
  showRSVP: boolean;
  rsvpStatus: string | null;
}): boolean {
  if (!opts.canRSVP || opts.openRsvpEnabled || !opts.envelopeSeen) return false;
  if (!opts.hasToken) return false;
  if (opts.showRSVP) return false;
  return !opts.rsvpStatus || opts.rsvpStatus === 'pending';
}

function shouldShowMusicPrompt(opts: {
  hasMusic: boolean;
  envelopeSeen: boolean;
  decision: string | null;
  isEditing: boolean;
  hideGuestChrome: boolean;
}): boolean {
  if (opts.isEditing || opts.hideGuestChrome || !opts.hasMusic) return false;
  if (!opts.envelopeSeen) return false;
  return !opts.decision;
}

describe('guest envelope gates', () => {
  it('blocks RSVP auto-open until envelope is seen', () => {
    expect(
      shouldAutoOpenRsvp({
        canRSVP: true,
        openRsvpEnabled: false,
        envelopeSeen: false,
        hasToken: true,
        showRSVP: false,
        rsvpStatus: 'pending',
      }),
    ).toBe(false);

    expect(
      shouldAutoOpenRsvp({
        canRSVP: true,
        openRsvpEnabled: false,
        envelopeSeen: true,
        hasToken: true,
        showRSVP: false,
        rsvpStatus: 'pending',
      }),
    ).toBe(true);
  });

  it('blocks music prompt until envelope is seen', () => {
    expect(
      shouldShowMusicPrompt({
        hasMusic: true,
        envelopeSeen: false,
        decision: null,
        isEditing: false,
        hideGuestChrome: false,
      }),
    ).toBe(false);

    expect(
      shouldShowMusicPrompt({
        hasMusic: true,
        envelopeSeen: true,
        decision: null,
        isEditing: false,
        hideGuestChrome: false,
      }),
    ).toBe(true);
  });
});
