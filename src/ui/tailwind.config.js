/** @type {import('tailwindcss').Config} */
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
        primary: '#7733FF',
        secondary: '#B896FF',
        text: '#293056',
        darkText: '#E0E0E0',
        background: '#FFFFFF',
        darkBackground: '#1F1F1F',
      },
    },
  },
  plugins: [],
};
