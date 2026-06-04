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
  // Custom domain at root (cdn.mbezu.ru via public/CNAME) → base must be '/'.
  base: '/',
  plugins: [react()],
  build: {
    target: 'es2019',
    manifest: true,
    // The only chunk over 500 kB is the lazy model-viewer+three.js bundle, loaded
    // on-demand only when a work has real 3D/AR assets. Raise the limit so the
    // build stays warning-free; common stays ~180 kB.
    chunkSizeWarningLimit: 950,
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
            // ONLY the React runtime is shared into `common`. Everything else —
            // notably @google/model-viewer + its heavy three.js dep — is left to
            // Rollup, which folds it into the lazy async chunk (loaded only for AR).
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler|object-assign)[\\/]/.test(id)) {
              return 'common';
            }
            return undefined;
          }
          return undefined;
        },
      },
    },
  },
});
