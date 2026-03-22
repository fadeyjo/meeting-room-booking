module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../mf-bookings/src/**/*.{js,ts,jsx,tsx}',
    '../mf-meetings/src/**/*.{js,ts,jsx,tsx}',
    '../mf-admin/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        surface: {
          DEFAULT: '#f1f5f9',
          card: '#ffffff',
          elevated: '#ffffff',
        },
        ink: {
          primary: '#0f172a',
          secondary: '#475569',
          tertiary: '#64748b',
          muted: '#94a3b8',
        },
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgb(15 23 42 / 0.08), 0 4px 16px -4px rgb(15 23 42 / 0.06)',
        'soft-lg': '0 4px 20px -4px rgb(15 23 42 / 0.1), 0 8px 32px -8px rgb(15 23 42 / 0.08)',
        'inner-soft': 'inset 0 1px 2px 0 rgb(15 23 42 / 0.04)',
        ring: '0 0 0 3px rgb(59 130 246 / 0.2)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
