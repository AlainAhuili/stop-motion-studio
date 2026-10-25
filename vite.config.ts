import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base: the same bundle works under any host or sub-path,
  // so it never has to be rebuilt per environment.
  base: './',
  // The real size budget is enforced on the gzipped bundle in the performance stage.
  build: { outDir: 'dist', sourcemap: true, chunkSizeWarningLimit: 800 },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
