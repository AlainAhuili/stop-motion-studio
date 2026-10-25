import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base: the same bundle works under any host or sub-path,
  // so it never has to be rebuilt per environment.
  base: './',
  // The real size budget is enforced on the gzipped bundle in the performance stage.
  // ES2022 for top-level await, used to load the WebAssembly core before the domain is used.
  build: { outDir: 'dist', sourcemap: true, chunkSizeWarningLimit: 800, target: 'es2022' },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
