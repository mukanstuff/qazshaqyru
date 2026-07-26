import { describe, expect, it } from 'vitest';

import { colors, cssVars, layout, typography } from '@/lib/shared/design-tokens';

/** Relative luminance for WCAG contrast (sRGB) */
function luminance(hex: string): number {
  const rgb = hex
    .replace('#', '')
    .match(/.{2}/g)!
    .map((c) => parseInt(c, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('design-tokens', () => {
  it('exports core neutral palette', () => {
    expect(colors.accent).toBe('#181818');
    expect(colors.cta).toBe('#181818');
    expect(colors.ivory).toBe('#FCFCFB');
    expect(colors.ink).toBe('#1A1A1A');
  });

  it('maps CSS variable names for fonts', () => {
    expect(cssVars.fontDisplay).toBe('--font-display');
    expect(cssVars.fontBody).toBe('--font-body');
  });

  it('meets WCAG AA contrast for body text on ivory', () => {
    const ratio = contrastRatio(colors.ink, colors.ivory);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('meets WCAG AA contrast for CTA on ivory', () => {
    const ratio = contrastRatio(colors.cta, colors.ivory);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('defines layout max widths for landing and editor', () => {
    expect(layout.maxWidthLanding).toBe('72rem');
    expect(layout.maxWidthEditor).toBe('80rem');
  });

  it('defines typography scale', () => {
    expect(typography.displayXl.size).toBe('3rem');
    expect(typography.body.lineHeight).toBe('1.6');
  });
});

describe('FONT_FAMILIES compatibility', () => {
  it('references display and body CSS vars', async () => {
    const { FONT_FAMILIES } = await import('@/lib/templates');
    expect(FONT_FAMILIES.cormorant).toContain('--font-display');
    expect(FONT_FAMILIES.dmSans).toContain('--font-body');
  });
});
