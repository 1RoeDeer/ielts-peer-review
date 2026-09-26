/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        ink: {
          950: '#080808',
          900: '#111111',
          800: '#1a1a1a',
          700: '#242424',
          600: '#333333',
          500: '#555555',
          400: '#888888',
          300: '#bbbbbb',
          200: '#d9d9d9',
          100: '#f0f0f0',
          50:  '#f8f8f8',
        },
      },
      boxShadow: {
        'bw-sm': '0 1px 4px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
        'bw':    '0 4px 16px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
        'bw-md': '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        'bw-lg': '0 16px 48px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)',
        'bw-xl': '0 24px 64px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.16)',
        'dk-sm': '0 1px 4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        'dk':    '0 4px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)',
        'dk-md': '0 8px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)',
        'dk-lg': '0 16px 60px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.6)',
        'dk-xl': '0 24px 80px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.7)',
        'inner-w': 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'inner-b': 'inset 0 1px 0 rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'pulse-dot': 'pulseDot 2s infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:  { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseDot: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
}
