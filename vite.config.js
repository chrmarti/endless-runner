import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: '/endless-runner/',
  publicDir: 'assets',
  server: {
    open: true,
    sourcemap: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    copyPublicDir: true
  }
});