import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './reports/coverage/frontend',
    },
    include: ['tests/unit/frontend/**/*.{test,spec}.{js,jsx}'],
  },
});
