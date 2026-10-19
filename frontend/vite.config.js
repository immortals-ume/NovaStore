import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = 'http://127.0.0.1:5001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: { '/api': api, '/uploads': api },
  },
  // The API serves this folder in production.
  build: { outDir: 'build' },
});
