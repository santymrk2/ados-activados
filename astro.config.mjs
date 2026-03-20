import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

import { createLogger } from 'vite';

const logger = createLogger();
const originalWarn = logger.warn;
logger.warn = (msg, options) => {
  if (msg.includes('vite-plugin-scripts') || msg.includes('astro:scripts')) return;
  originalWarn(msg, options);
};

export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true },
    excludeFiles: ['node_modules/libsql/**/*'],
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwind()],
    customLogger: logger,
  },
});
