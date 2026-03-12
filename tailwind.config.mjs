import { defineConfig } from 'tailwindcss';
import tailwindcss from '@tailwindcss/vite';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4342FF',
        accent: '#CCFF3E',
        background: '#EFEFEF',
        surface: '#FFFFFF',
        'surface-dark': '#E5E5E5',
        dark: '#1A1A1A',
      },
      fontFamily: {
        clash: ['ClashGrotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
