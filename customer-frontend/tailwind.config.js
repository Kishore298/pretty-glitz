/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          rose: '#C4386C',
          'rose-deep': '#B8305E',
          purple: '#8A2BE2',
          gold: '#C9A84C',
          'gold-muted': '#A67D3D',
          ivory: '#FDFBF7',
          charcoal: '#1A1118',
          dark: '#0A0A0F',
          'dark-surface': '#141420',
        },
      },
      fontFamily: {
        'display': ['Cormorant Garamond', 'Georgia', 'serif'],
        'heading': ['Outfit', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
