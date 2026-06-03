import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const r = (p: string) => resolve(__dirname, p);

// Multi-page build: one HTML harness per route → Rollup emits a chunk per page.
// Shared code (react + src/common) is folded into a single `common` chunk;
// the AR module (src/ar) is isolated into its own `ar` chunk so only home/painting pull it.
const ROUTES = ['home', 'about', 'catalog', 'painting', 'commission', 'cart', 'tracking', 'legal'];

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2019',
    manifest: true,
    cssCodeSplit: false, // single shared stylesheet (global :root vars must apply on every page)
    rollupOptions: {
      input: Object.fromEntries(
        ROUTES.map((name) => [name, r(name === 'home' ? 'index.html' : `${name}.html`)]),
      ),
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (id.includes('/src/ar/')) return 'ar';
          if (id.includes('/src/common/')) return 'common';
          if (id.includes('node_modules')) {
            // model-viewer is dynamically imported (lazy) — let Rollup give it its own async chunk
            if (id.includes('@google/model-viewer')) return undefined;
            return 'common'; // react / react-dom shared across every page
          }
          return undefined;
        },
      },
    },
  },
});
