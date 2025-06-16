/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: 'class',
  content: [
    "../../index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.violet[500],
        primaryDarken: colors.violet[600],
        secondary: colors.purple[400],
        tertiery: colors.purple[300],
        textPrimary: colors.slate[700],
        textSecondary: colors.slate[500],
        backgroundPrimary: colors.yellow[100],
        backgroundSecondary: colors.gray[300]
      },      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Customize the font-sans
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [], // line-clamp is included by default in Tailwind v4
};
