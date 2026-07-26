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

  it('keeps cream-left hero readability outside Tailwind layers', () => {
    const css = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf8');
    expect(css).toContain('.landing-hero-readable');
    expect(css).toContain('.landing-hero-fade-x');
    expect(css).toContain("color: var(--us-ink) !important");
    expect(css).toContain('font-weight: 800 !important');
    expect(css).toMatch(/linear-gradient\(\s*90deg/);
  });
});
