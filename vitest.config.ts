import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/vite-env.d.ts'],
      provider: 'v8',
      reporter: ['text', 'html'],
    },
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.ts'],
  },
});
