import { defineConfig } from '@playwright/test';
const port = Number(process.env.PLAYWRIGHT_PWA_PORT || 4173);
export default defineConfig({
  testDir: './tests', outputDir: 'test-results-pwa', testMatch: ['pwa.spec.ts', 'chapter-five-art.spec.ts', 'scene-editor-production.spec.ts'], timeout: 60000,
  use: {
    baseURL: `http://localhost:${port}`, viewport: { width: 844, height: 390 },
    launchOptions: { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], ignoreDefaultArgs: ['--disable-dev-shm-usage'] },
    trace: 'retain-on-failure',
  },
  webServer: { command: `npm run preview -- --port ${port} --strictPort --base /episode/`, url: `http://localhost:${port}/episode/`, reuseExistingServer: false },
});
