/**
 * Ready-made themes.
 *
 * Every font here is verified to render Kazakh (Ә Ғ Қ Ң Ө Ұ Ү Һ І) — see
 * KAZAKH_SUBSTITUTE in components/canvas/elements/fontStack.ts. Adding a
 * theme that reaches for Tenor Sans, Playfair Display, Great Vibes, Marck,
 * Unbounded or Manrope will silently render half the couple's names in a
 * system fallback.
 *
 * `ink` is a warm dark tone in every theme, never `#000` or near-black: on
 * cream paper a true black reads as an office document rather than a card.
 */
import type { TemplateTheme } from './types';

export const THEMES = {
  /** Warm ivory and old gold — the default wedding register. */
  goldIvory: {
    paper: '#fcf7f3',
    ink: '#4a3b25',
    accent: '#b08d4f',
    muted: '#9a8a72',
    onPhoto: '#ffffff',
    display: 'Forum',
    body: 'Montserrat',
    script: 'Pacifico',
  },

  /** Deep green and brass — reads more formal, closer to the brand palette. */
  emeraldBrass: {
    paper: '#f4f7f3',
    ink: '#26402f',
    accent: '#9c7f43',
    muted: '#7d8c80',
    onPhoto: '#ffffff',
    display: 'Prata',
    body: 'Montserrat',
    script: 'Pacifico',
  },

  /** Dusty rose and copper — softer, for ұзату and қыз ұзату. */
  roseCopper: {
    paper: '#fdf6f4',
    ink: '#553a3a',
    accent: '#b5795f',
    muted: '#a1857f',
    onPhoto: '#ffffff',
    display: 'Cormorant',
    body: 'Montserrat',
    script: 'Pacifico',
  },

  /** Ink on plain paper — no gold at all, for a restrained modern look. */
  monoPaper: {
    paper: '#f7f6f2',
    ink: '#2f2f2c',
    accent: '#6f6a5e',
    muted: '#918c81',
    onPhoto: '#ffffff',
    display: 'Yeseva One',
    body: 'Inter',
    script: 'Pacifico',
  },
} satisfies Record<string, TemplateTheme>;

export type ThemeName = keyof typeof THEMES;
