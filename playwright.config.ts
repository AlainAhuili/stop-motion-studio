import { defineConfig } from '@playwright/test';

// The system under test is whatever environment BASE_URL points at:
// the pipeline deploys the release candidate first, then points these tests at it.
export default defineConfig({
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4173',
    // WebGL in headless CI runs on the SwiftShader software renderer.
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'acceptance', testDir: 'acceptance/specs' },
    { name: 'perf', testDir: 'acceptance/perf' },
  ],
});
