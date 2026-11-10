import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  testDir: './browser', fullyParallel: true, retries: 0, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4175', trace: 'retain-on-failure', viewport: { width: 1280, height: 900 }, timezoneId: 'America/Regina' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  outputDir: './browser-results',
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort', cwd: fileURLToPath(new URL('../../../', import.meta.url)), url: 'http://127.0.0.1:4175', reuseExistingServer: false, env: { VITE_SELECTED_TASK_HISTORY: 'true' } },
})
