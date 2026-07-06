/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f2',
          100: '#fde3e3',
          200: '#fbc9c9',
          300: '#f6a3a3',
          400: '#ee7272',
          500: '#e14343',
          600: '#c81e2b', // primary brand red
          700: '#a3141f',
          800: '#87141c',
          900: '#71151c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
