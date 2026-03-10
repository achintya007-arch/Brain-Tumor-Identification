/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-inter)',     'sans-serif'],
        display: ['var(--font-syne)',      'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      colors: {
        bg: {
          base:     '#060810',
          surface:  '#0c1020',
          elevated: '#111827',
          border:   '#1e2d45',
        },
        accent: {
          cyan:      '#06b6d4',
          'cyan-dim':'#0891b2',
          green:     '#10b981',
          red:       '#ef4444',
          amber:     '#f59e0b',
        },
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
      },
    },
  },
  plugins: [],
};