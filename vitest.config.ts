import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Unit tests run in node env; css:false so `import './styles.css'` (pulled in via app.tsx)
// is a no-op. React plugin so .tsx/JSX modules transform correctly.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
