import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: 'assets',
  server: {
    open: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});