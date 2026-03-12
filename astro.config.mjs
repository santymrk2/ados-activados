import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true },
    excludeFiles: ['node_modules/libsql/**/*'],
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwind()],
  },
});
