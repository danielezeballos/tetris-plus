import { defineConfig } from 'vite';
import { leaderboardsApiPlugin } from './vite-plugin-leaderboards';

export default defineConfig({
  plugins: [leaderboardsApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 47281,
    allowedHosts: ['.trycloudflare.com'],
  },
});
