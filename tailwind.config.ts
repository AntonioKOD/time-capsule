import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'handwritten': ['var(--font-handwritten)'],
        'body': ['var(--font-body)'],
      },
      colors: {
        'primary-pink': {
          light: 'var(--primary-pink-light)',
          DEFAULT: 'var(--primary-pink)',
          dark: 'var(--primary-pink-dark)',
        },
        'secondary-blue': {
          light: 'var(--secondary-blue-light)',
          DEFAULT: 'var(--secondary-blue)',
          dark: 'var(--secondary-blue-dark)',
        },
        'accent-gold': {
          light: 'var(--accent-gold-light)',
          DEFAULT: 'var(--accent-gold)',
          dark: 'var(--accent-gold-dark)',
        },
      },
      backgroundImage: {
        'gradient-sunset': 'var(--gradient-sunset)',
        'gradient-twilight': 'var(--gradient-twilight)',
        'gradient-golden': 'var(--gradient-golden)',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'medium': 'var(--shadow-medium)',
        'strong': 'var(--shadow-strong)',
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
        '4xl': 'var(--spacing-4xl)',
      },
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'medium': 'var(--transition-medium)',
        'slow': 'var(--transition-slow)',
      },
    },
  },
  plugins: [],
}

export default config 