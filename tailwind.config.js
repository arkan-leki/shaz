export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        vazirmatn: ['Vazirmatn', 'sans-serif']
      },
      boxShadow: {
        soft: '0 25px 90px rgba(15, 23, 42, 0.4)'
      },
      backgroundImage: {
        textured: 'radial-gradient(circle at top right, rgba(96, 165, 250, 0.16), transparent 25%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.12), transparent 18%)'
      }
    }
  },
  plugins: []
}
