import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/idea-cards-pwa',
  plugins: [react(), nxViteTsPaths()],
  server: {
    port: 3002,
    host: true
  },
  define: {
    'process.env': {}
  },
  build: {
    outDir: '../../dist/apps/idea-cards-pwa',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
  },
});