import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#F4F7F5',
          100: '#E6ECE8',
          200: '#CFDBD2',
          300: '#B0C4B5',
          400: '#8FA996',
          500: '#6E8F77',
          600: '#55725D',
          700: '#435A49',
          800: '#344538',
          900: '#27342B',
        },
        terracotta: {
          50: '#FDF6F3',
          100: '#F9ECE5',
          200: '#F3D5C5',
          300: '#EBB69F',
          400: '#E09273',
          500: '#D46E47',
          600: '#BA532C',
          700: '#944021',
          800: '#73331C',
          900: '#5B2918',
        },
        whatsapp: { DEFAULT: '#25D366', dark: '#20BA5A' },
        orangeMoney: { DEFAULT: '#EA580C', light: '#FFEDD5' },
        momo: { DEFAULT: '#EAB308', light: '#FEF9C3' },
        success: '#059669',
        warning: '#EA580C',
        error: '#DC2626',
        info: '#1E40AF',
      },
      minHeight: {
        touch: '48px',
        'touch-lg': '54px',
      },
    },
  },
  plugins: [],
};

export default config;

