import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // One step heavier than Tailwind defaults (product UI + landing).
      fontWeight: {
        thin: '200',
        extralight: '300',
        light: '400',
        normal: '500',
        medium: '600',
        semibold: '700',
        bold: '800',
        extrabold: '800',
        black: '900',
      },
      colors: {
        us: {
          accent: 'var(--us-accent)',
          'accent-strong': 'var(--us-accent-strong)',
          cta: 'var(--us-cta)',
          'cta-hover': 'var(--us-cta-hover)',
          ivory: 'var(--us-ivory)',
          ink: 'rgb(var(--us-ink-rgb) / <alpha-value>)',
          'ink-muted': 'var(--us-ink-muted)',
          surface: 'var(--us-surface)',
          border: 'var(--us-border)',
          danger: 'var(--us-danger)',
          success: 'var(--us-success)',
          forest: 'var(--us-forest)',
          'forest-hover': 'var(--us-forest-hover)',
          sage: 'var(--us-sage)',
          cream: 'rgb(var(--us-cream-rgb) / <alpha-value>)',
          rose: 'var(--us-rose)',
          gold: 'var(--us-gold)',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-display)', 'Georgia', 'serif'],
        script: ['var(--font-script)', 'cursive'],
      },
      fontSize: {
        'display-xl': ['3rem', { lineHeight: '1.1' }],
        'display-l': ['2.25rem', { lineHeight: '1.15' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      maxWidth: {
        landing: '72rem',
        editor: '80rem',
      },
      boxShadow: {
        'us-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'us-md': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'us-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 400ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 300ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
