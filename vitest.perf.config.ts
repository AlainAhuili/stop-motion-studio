import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['perf/**/*.perf.test.ts'],
  },
});
