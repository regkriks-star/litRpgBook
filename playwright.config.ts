import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5173);

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/pwa.spec.ts', '**/chapter-five-art.spec.ts', '**/scene-editor-production.spec.ts'],
  timeout: 60000,
  use: {
    baseURL: `http://localhost:${port}`,
    // This desktop has ample /dev/shm; Chromium's /tmp fallback fills the project disk.
    launchOptions: { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], ignoreDefaultArgs: ['--disable-dev-shm-usage'] },
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: { command: `npm run dev -- --port ${port} --strictPort`, url: `http://localhost:${port}`, reuseExistingServer: true },
});
