import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build can be served from any sub-path (e.g. GitHub Pages).
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Allow tunnelled/proxied dev hosts (cloud sandboxes, Codespaces, ngrok…) to load the
    // dev server. Harmless locally; without it those hosts get a 403.
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
});
