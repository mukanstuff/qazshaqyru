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
          // Primary — бирюзовый Алатау
          accent: 'var(--us-accent)',
          'accent-strong': 'var(--us-accent-strong)',
          'accent-muted': 'var(--us-accent-muted)',
          // CTA — графитовый
          cta: 'var(--us-cta)',
          'cta-hover': 'var(--us-cta-hover)',
          // Surface
          ivory: 'var(--us-ivory)',
          ink: 'rgb(var(--us-ink-rgb) / <alpha-value>)',
          'ink-muted': 'var(--us-ink-muted)',
          surface: 'var(--us-surface)',
          border: 'var(--us-border)',
          'border-strong': 'var(--us-border-strong)',
          // Semantic
          danger: 'var(--us-danger)',
          success: 'var(--us-success)',
          // Brand — Алатау palette
          turquoise: 'var(--us-turquoise)',
          peach: 'var(--us-peach)',
          berry: 'var(--us-berry)',
          cloud: 'var(--us-cloud)',
          deep: 'var(--us-deep)',
          cream: 'var(--us-cream)',
          rose: 'var(--us-rose)',
          gold: 'var(--us-gold)',
          sage: 'var(--us-sage)',
          lavender: 'var(--us-lavender)',
          // Aliases
          forest: 'var(--us-forest)',
          'forest-hover': 'var(--us-forest-hover)',
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
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) * 1.5)',
      },
      maxWidth: {
        landing: '72rem',
        editor: '80rem',
      },
      boxShadow: {
        'us-sm': '0 2px 6px rgba(38, 70, 83, 0.06)',
        'us-md': '0 4px 16px rgba(38, 70, 83, 0.08)',
        'us-lg': '0 8px 32px rgba(38, 70, 83, 0.12)',
        'us-xl': '0 16px 48px rgba(38, 70, 83, 0.16)',
        'us-glow': '0 0 24px rgba(42, 157, 143, 0.25)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-up': 'fade-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 400ms ease-out both',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
