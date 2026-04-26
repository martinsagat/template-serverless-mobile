import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/.sst/**',
        '**/.next/**',
        '**/.expo/**',
        '**/dist/**',
        '**/*.config.*',
        '**/sst-env.d.ts',
      ],
    },
  },
});
