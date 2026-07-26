/**
 * Site chrome design tokens. CSS variables in globals.css mirror these values.
 */

export const colors = {
  accent: '#181818',
  accentStrong: '#0A0A0A',
  cta: '#181818',
  ctaHover: '#333333',
  ivory: '#FCFCFB',
  ink: '#1A1A1A',
  inkMuted: '#5C5C5C',
  surface: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.1)',
  danger: '#B42318',
  success: '#2D6A4F',
} as const;

export const spacing = {
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  6: '1.5rem',
  8: '2rem',
  12: '3rem',
  16: '4rem',
  24: '6rem',
} as const;

export const radius = {
  sm: '0.375rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
  md: '0 4px 12px rgba(0, 0, 0, 0.1)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
} as const;

export const typography = {
  displayXl: { size: '3rem', lineHeight: '1.1' },
  displayL: { size: '2.25rem', lineHeight: '1.15' },
  heading: { size: '1.5rem', lineHeight: '1.25' },
  body: { size: '1rem', lineHeight: '1.6' },
  caption: { size: '0.8125rem', lineHeight: '1.4' },
  overline: { size: '0.75rem', lineHeight: '1.4', letterSpacing: '0.08em' },
} as const;

export const layout = {
  maxWidthLanding: '72rem',
  maxWidthEditor: '80rem',
} as const;

export const motion = {
  fadeUpDuration: '400ms',
  fadeUpEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const cssVars = {
  accent: '--us-accent',
  accentStrong: '--us-accent-strong',
  cta: '--us-cta',
  ctaHover: '--us-cta-hover',
  ivory: '--us-ivory',
  ink: '--us-ink',
  inkMuted: '--us-ink-muted',
  surface: '--us-surface',
  border: '--us-border',
  danger: '--us-danger',
  success: '--us-success',
  fontDisplay: '--font-display',
  fontBody: '--font-body',
  radius: '--us-radius',
} as const;
