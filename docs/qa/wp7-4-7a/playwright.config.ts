import { defineConfig } from '@playwright/test'
import previous from '../wp7-4-7/playwright.config'
export default defineConfig({ ...previous, testDir: '..', testMatch: ['**/wp7-4-7/browser/history.spec.ts', '**/wp7-4-7a/browser/history-ux.spec.ts'], outputDir: './browser-results',
  projects: previous.projects?.map(p => ({ ...p, metadata: { ...p.metadata, historyEvidenceDirectory: 'docs/qa/wp7-4-7a/evidence' } })),
})
