import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './browser', fullyParallel: true, retries: 0, reporter: 'list',
  outputDir: '../../../test-results/wp733a',
  use: { baseURL: 'http://127.0.0.1:4176', trace: 'retain-on-failure', timezoneId: 'America/Regina' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4176 --strictPort', url: 'http://127.0.0.1:4176', reuseExistingServer: false, cwd: '../../..' },
})
