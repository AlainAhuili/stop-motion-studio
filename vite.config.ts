import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base: the same bundle works under any host or sub-path,
  // so it never has to be rebuilt per environment.
  base: './',
  build: { outDir: 'dist', sourcemap: true },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
