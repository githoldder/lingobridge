import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: false,
    viewport: { width: 1280, height: 720 },
  },
  webServer: [
    {
      command: 'npx tsx backend/src/server.ts',
      port: 3001,
      timeout: 15000,
      reuseExistingServer: true,
    },
    {
      command: 'npx vite --port 3000 --host 127.0.0.1',
      port: 3000,
      timeout: 20000,
      reuseExistingServer: true,
    },
  ],
});
