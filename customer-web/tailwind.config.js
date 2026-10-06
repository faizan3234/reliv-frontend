/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      fontFamily: { handwriting: ['Caveat', 'cursive'], display: ['Fredoka', 'sans-serif'], hand: ['Patrick Hand', 'cursive'], script: ['Caveat', 'cursive'], handwritten: ['Caveat', 'cursive'], heading: ['Fredoka', 'sans-serif'] },
      boxShadow: { paper: '0 10px 25px -5px rgba(160,130,109,.25)', sticky: '2px 4px 12px rgba(180,120,100,.18)', card: '0 18px 45px -10px rgba(112,79,56,.16)' },
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          900: '#7c2d12',
        },
        kiosk: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#38bdf8',
        }
      },
    },
  },
  plugins: [],
}
