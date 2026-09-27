/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#FBF4F4',
          100: '#F3E2E3',
          200: '#E3C2C4',
          300: '#CE9498',
          400: '#B0666C',
          500: '#8B3A3A',
          600: '#722F37',
          700: '#5C262C',
          800: '#421B20',
          900: '#2B1214',
        },
        cream: {
          DEFAULT: '#F5F0EB',
          soft: '#FAF3F0',
          deep: '#EBE2D9',
        },
        gold: {
          DEFAULT: '#C9A961',
          light: '#E0C88C',
          amber: '#D4A574',
        },
        ink: {
          DEFAULT: '#2B1F1C',
          muted: '#6F615C',
          faint: '#9A8C86',
        },
      },
      fontFamily: {
        display: [
          '"SF Pro Display"',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        text: [
          '"SF Pro Text"',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        caption: ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        footnote: ['14px', { lineHeight: '19px' }],
        body: ['17px', { lineHeight: '23px', letterSpacing: '-0.01em' }],
        title: ['20px', { lineHeight: '25px', letterSpacing: '-0.02em' }],
        'title-lg': ['24px', { lineHeight: '29px', letterSpacing: '-0.02em' }],
        hero: ['34px', { lineHeight: '40px', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        glass: '22px',
        sheet: '28px',
        pill: '999px',
      },
      backdropBlur: {
        glass: '18px',
        heavy: '28px',
      },
      boxShadow: {
        glass: '0 8px 32px -8px rgba(74, 28, 34, 0.18), 0 2px 8px -2px rgba(74, 28, 34, 0.08)',
        'glass-lg': '0 24px 60px -18px rgba(74, 28, 34, 0.28), 0 8px 20px -8px rgba(74, 28, 34, 0.14)',
        float: '0 18px 40px -12px rgba(74, 28, 34, 0.32)',
        glow: '0 0 0 1px rgba(255,255,255,0.45), 0 0 28px -6px rgba(201, 169, 97, 0.55)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.55)',
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.32, 0.72, 0, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'wave-shift': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'bottle-spin': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        'drop-fall': {
          '0%': { transform: 'translateY(-120%) scale(0.6)', opacity: '0' },
          '35%': { opacity: '1' },
          '70%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '82%': { transform: 'translateY(-26%) scale(0.92)' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'bubble-rise': {
          '0%': { transform: 'translateY(0) scale(0.7)', opacity: '0' },
          '20%': { opacity: '0.9' },
          '100%': { transform: 'translateY(-150px) scale(1.15)', opacity: '0' },
        },
        'pop-bounce': {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.35)' },
          '60%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'ripple-out': {
          '0%': { transform: 'scale(0)', opacity: '0.45' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
      },
      animation: {
        'wave-shift': 'wave-shift 2.4s linear infinite',
        'bottle-spin': 'bottle-spin 2.2s linear infinite',
        'pop-bounce': 'pop-bounce 480ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        shimmer: 'shimmer 1.6s infinite',
        'float-y': 'float-y 4s ease-in-out infinite',
        'ripple-out': 'ripple-out 600ms ease-out forwards',
      },
    },
  },
  plugins: [],
}
