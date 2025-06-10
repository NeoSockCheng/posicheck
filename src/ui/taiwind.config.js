/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../../index.html", // Up two folders from src/ui to reach posicheck/index.html
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
