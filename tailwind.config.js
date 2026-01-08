/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f6f7f6',
          100: '#e3e7e3',
          200: '#c6cfc6',
          300: '#a3b0a3',
          400: '#7d8e7d',
          500: '#5f7260',
          600: '#4a5b4b',
          700: '#3d4a3e',
          800: '#333d34',
          900: '#2c332d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      maxWidth: {
        'content': '1140px',
      },
    },
  },
  plugins: [],
};
