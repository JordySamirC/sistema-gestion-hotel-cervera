/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'verde-selva': {
          DEFAULT: '#2D5A27',
          light: '#3C7534',
          dark: '#1E3C1A',
        },
        'verde-tropical': {
          DEFAULT: '#4E8D46',
          light: '#65AB5B',
          dark: '#376431',
        },
        'marron-madera': {
          DEFAULT: '#8B5A2B',
          light: '#A86E37',
          dark: '#6E4621',
        },
        'dorado-amazonico': {
          DEFAULT: '#D4A843',
          light: '#E2BF67',
          dark: '#AA812A',
        },
        'fondo-oscuro': {
          DEFAULT: '#1A211B',
          light: '#252F27',
          dark: '#0F1310',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
