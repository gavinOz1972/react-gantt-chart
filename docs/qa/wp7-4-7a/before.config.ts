import { defineConfig } from '@playwright/test'
import previous from '../wp7-4-7/playwright.config'
export default defineConfig({ ...previous, testDir: './browser', testMatch: 'before.spec.ts', outputDir: './before-results' })
