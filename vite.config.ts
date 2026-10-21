import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 47281,
    allowedHosts: ['.trycloudflare.com'],
  },
});
