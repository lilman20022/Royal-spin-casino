export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          gold: '#FFD700',
          dark: '#1a1a2e',
          darker: '#0f0f1e',
          accent: '#e94560'
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
