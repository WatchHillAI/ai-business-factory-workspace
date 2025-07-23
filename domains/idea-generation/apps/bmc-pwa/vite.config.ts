import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/bmc-pwa',
  plugins: [
    react(),
    nxViteTsPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false // Disable service worker in dev mode for hot reload
      },
      includeAssets: ['favicon.ico', 'icon.svg', 'pwa-64x64.png', 'maskable-icon-512x512.png'],
      manifest: {
        name: 'AI Business Factory - Business Model Canvas',
        short_name: 'BMC Factory',
        description: 'AI-powered Business Model Canvas creation and elaboration tool for entrepreneurs',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '16x16 32x32',
            type: 'image/x-icon'
          },
          {
            src: '/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: '/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3001,
    https: false // Use HTTP for local development
  },
  build: {
    outDir: '../../dist/apps/bmc-pwa',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  }
});