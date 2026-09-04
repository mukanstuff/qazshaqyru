import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

import {
  LANDING_HERO_BG,
  LANDING_HERO_IPHONE_MOCKUP,
  LANDING_HERO_IPHONE_SCREEN_INSET,
} from '../assets';

describe('landing hero foundation', () => {
  it('exposes full-bleed background and phone mockup assets', () => {
    expect(LANDING_HERO_BG).toMatch(/^\/assets\//);
    expect(LANDING_HERO_IPHONE_MOCKUP).toMatch(/hero-iphone-mockup/);
  });

  it('defines screen inset so invitation shows through mockup hole', () => {
    expect(LANDING_HERO_IPHONE_SCREEN_INSET.top).toMatch(/%$/);
    expect(LANDING_HERO_IPHONE_SCREEN_INSET.left).toMatch(/%$/);
    expect(LANDING_HERO_IPHONE_SCREEN_INSET.radius).toBeTruthy();
  });

  // `.landing-hero-fade-x` was dropped from globals.css when the hero stopped
  // fading its right edge; the test kept asserting the string and so had been
  // failing ever since. What is still worth guarding is that the readability
  // overrides live outside @layer, where Tailwind utilities cannot outrank
  // them — that is the bug those rules exist to prevent.
  it('keeps cream-left hero readability outside Tailwind layers', () => {
    const css = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf8');
    expect(css).toContain('.landing-hero-readable');
    expect(css).toContain('color: var(--us-ink) !important');
    expect(css).toContain('font-weight: 800 !important');
  });
});
