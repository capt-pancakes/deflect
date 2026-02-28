import { defineConfig } from 'vite';

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
});
