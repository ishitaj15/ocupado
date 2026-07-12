/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1e293b',
          dark: '#0f172a',
          light: '#334155',
        },
        accent: '#2563eb',
        cream: {
          DEFAULT: '#f5ece0',
          dark: '#ece0cf',
        },
        warm: {
          DEFAULT: '#8b6f47',
          light: '#a68a64',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}