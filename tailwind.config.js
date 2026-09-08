import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal:        '#24575C',
          'teal-mid':  '#2D6B71',
          'teal-light':'#3A8A91',
          'teal-pale': '#EAF4F5',
          pink:        '#EF8ABA',
          'pink-light':'#F7BCDA',
          'pink-dark': '#D46A9F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
};
