import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
    minify: 'esbuild',
  },
  server: {
    host: true,
    port: 3000,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // Use existing manifest.json in public/
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json}'],
      },
    }),
  ],
});
