/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdfaf5',
          100: '#f9f3e8',
          200: '#f3e5d1',
          300: '#e8d4b3',
          400: '#d4a574',
          500: '#c9a882',
          600: '#b8926a',
          700: '#a07b56',
          800: '#8B6F47',
          900: '#6b5435',
        },
        beige: {
          50: '#fdfaf5',
          100: '#f9f3e8',
          200: '#f3e5d1',
          300: '#e8d4b3',
          400: '#d4a574',
          500: '#c9a882',
          600: '#b8926a',
          700: '#a07b56',
          800: '#8B6F47',
          900: '#6b5435',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}