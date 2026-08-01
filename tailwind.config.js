/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          brown: '#3B3520',
          brownlight: '#5A5238',
          orange: '#C9762C',
          orangelight: '#E0954F',
          green: '#6E7C4B',
          greenlight: '#8B9A64',
          cream: '#F7F5F0',
          card: '#FFFFFF',
          border: '#E5E1D6',
          amber: '#C9762C',
          olive: '#6E7C4B',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(120deg, #F6E3E6 0%, #F7F5F0 50%, #E4E9F2 100%)',
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
    },
  },
  plugins: [],
}
