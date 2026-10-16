/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cloud: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        brand: {
          pastel: '#BAE6FD',
          DEFAULT: '#0284C7',
          hover: '#0369A1',
          dark: '#0C4A6E',
        },
        slate: {
          heading: '#0F172A',
          body: '#334155',
          muted: '#64748B',
        },
        semantic: {
          abono: '#16A34A',
          abonoLight: '#DCFCE7',
          cargo: '#D97706',
          cargoLight: '#FEF3C7',
          anulacion: '#E11D48',
          anulacionLight: '#FFE4E6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'pos': '0 2px 8px -1px rgba(15, 23, 42, 0.08), 0 1px 4px -1px rgba(15, 23, 42, 0.04)',
        'pos-lg': '0 8px 24px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
      }
    },
  },
  plugins: [],
}
