import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { ProjectFile } from '../../src/persistence/projectFile'
import { emptyProgress, transitionTask } from '../../src/progress/taskProgress'
import { openPlan } from '../wp5-2-fixtures'
import { fixtureTimestamp, studentFile } from '../wp71/studentFixture'

test.use({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/Regina', actionTimeout: 10_000 })
const directory = 'docs/qa/wp7-3/evidence'
const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true }).click()
const health = (page: Page) => page.getByRole('region', { name: 'Project health', exact: true })
const work = (page: Page) => page.getByRole('region', { name: 'Work & effort', exact: true })
async function exported(page: Page): Promise<ProjectFile> {
  await tab(page, 'Files'); const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click()
  return JSON.parse(await readFile((await (await pending).path())!, 'utf8'))
}
async function evidence(name: string, value: unknown) {
  await mkdir(directory, { recursive: true }); await writeFile(`${directory}/${name}.json`, JSON.stringify(value, null, 2) + '\n')
}
async function select(page: Page, id: string) { await tab(page, 'Workspace'); await page.getByRole('button', { name: `Select ${id} in chart`, exact: true }).click() }
async function quick(page: Page, id: string, value: string) {
  await page.getByRole('button', { name: `Edit ${id} remaining effort`, exact: true }).click()
  await page.getByLabel(`${id} remaining effort`, { exact: true }).fill(value); await page.getByLabel(`${id} remaining effort`, { exact: true }).press('Enter')
}
async function saveAs(page: Page, suffix: string) {
  await tab(page, 'Files'); await page.getByLabel('Saved plan name', { exact: true }).fill(`WP73 DISPOSABLE ${suffix}`)
  await page.getByRole('button', { name: 'Save As', exact: true }).click()
}
function completed(remaining: number | null, logged: boolean): ProjectFile {
  const input = studentFile()
  const result = transitionTask(emptyProgress(), 'T13', { target: 'Complete', eventId: 'E-WP73-ORIGINAL', date: '2026-11-02', recordedAt: fixtureTimestamp, completionAcknowledged: true, noCriteriaAcknowledged: true, committedFinishDateAtCompletion: '2026-11-19' }, input.tasks.map(task => task.taskId))
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return { ...input, taskProgress: result.value, workTracking: { schemaVersion: 1, remainingHours: { ...input.workTracking!.remainingHours, T13: remaining }, entries: logged ? [{ entryId: 'W-WP73', taskId: 'T13', workDate: '2026-11-02', contributor: 'QA Student', hours: 2, description: 'Partial optional work record, not a completeness attestation.', createdAt: fixtureTimestamp, updatedAt: fixtureTimestamp }] : [] } }
}

for (const width of [1440, 1280, 780]) test(`C01 - pinned Actions, overflow hint, unoccluded focus and keyboard duplicate at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); const input = studentFile(); await openPlan(page, input)
  const panel = page.locator('.tasks-panel'), table = page.getByRole('region', { name: 'Task schedule table', exact: true })
  await panel.evaluate(element => element.scrollIntoView({ block: 'start' }))
  await expect(panel.getByText(/Scroll the table horizontally/)).toBeVisible()
  await mkdir(directory, { recursive: true })
  const positions = []
  for (const extreme of ['start', 'end']) {
    await table.evaluate((element, end) => { element.scrollLeft = end ? element.scrollWidth : 0 }, extreme === 'end')
    const current = await table.evaluate(element => {
      const box = element.getBoundingClientRect(), cell = element.querySelector('.task-actions-cell')!.getBoundingClientRect(), header = element.querySelector('.task-actions-header')!.getBoundingClientRect()
      const button = element.querySelector<HTMLButtonElement>('[aria-label="Duplicate T1"]')!, rect = button.getBoundingClientRect()
      return { scrollLeft: element.scrollLeft, tableRight: box.left + element.clientWidth, cellLeft: cell.left, cellRight: cell.right, headerLeft: header.left, headerRight: header.right, buttonHit: document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest('button') === button }
    })
    expect(current.buttonHit).toBe(true); expect(current.cellRight).toBeLessThanOrEqual(current.tableRight + 1)
    expect(current.headerLeft).toBeCloseTo(current.cellLeft, 0); expect(current.headerRight).toBeCloseTo(current.cellRight, 0)
    for (const name of ['Duplicate T1', 'Edit T1', 'Delete T1']) await expect(page.getByRole('button', { name, exact: true })).toBeInViewport()
    positions.push({ extreme, ...current })
    if (width === 1280) await panel.screenshot({ path: `${directory}/c01-${extreme}-1280.png` })
  }
  const duration = page.getByRole('button', { name: 'Edit T1 duration', exact: true })
  await duration.focus()
  const focus = await duration.evaluate(element => {
    const rect = element.getBoundingClientRect(), region = element.closest('.table-scroll')!, box = region.getBoundingClientRect(), actions = region.querySelector('.task-actions-cell')!.getBoundingClientRect()
    return { left: rect.left, right: rect.right, availableLeft: box.left, availableRight: actions.left }
  })
  expect(focus.left).toBeGreaterThanOrEqual(focus.availableLeft - 1); expect(focus.right).toBeLessThanOrEqual(focus.availableRight + 1)
  await page.getByRole('button', { name: 'Duplicate T1', exact: true }).focus(); await page.keyboard.press('Enter')
  const after = await exported(page)
  expect(after.tasks.filter(task => task.taskId !== 'T31')).toEqual(input.tasks); expect(after.baseline).toEqual(input.baseline)
  expect(after.workTracking!.remainingHours.T31).toBe(4); expect(after.taskProgress!.events).toEqual([])
  await tab(page, 'Workspace'); await panel.evaluate(element => element.scrollIntoView({ block: 'start' }))
  await mkdir(directory, { recursive: true }); if (width === 1280) await panel.screenshot({ path: `${directory}/c01-actions-1280.png` })
  await page.setViewportSize({ width: 2200, height: 900 })
  // The app constrains its page width; a wide screen need not remove overflow.
  const wide = await table.evaluate(element => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }))
  await expect(panel.getByText(/Scroll the table horizontally/)).toHaveCount(wide.scrollWidth > wide.clientWidth + 1 ? 1 : 0)
  await evidence(`c01-${width}`, { positions, focus, wideViewport: wide, duplicateId: 'T31', initializedRemaining: 4, baselineAndOriginalTasksUnchanged: true, hintFollowsActualOverflow: true })
})

for (const remaining of [10, 0, null]) for (const logged of [false, true]) test(`C02 C03 - Complete stored ${remaining}, logs ${logged}: zero effective work and qualified arithmetic persist`, async ({ page }) => {
  const input = completed(remaining, logged); await openPlan(page, input); await select(page, 'T13')
  for (const label of ['Edit T13 remaining effort', 'Edit Selected T13 remaining effort']) {
    const field = page.getByRole('button', { name: label, exact: true }); await expect(field).toContainText('0 h'); await expect(field).toBeDisabled()
  }
  await expect(work(page).getByLabel('Remaining effort (hours)', { exact: true })).toHaveValue('0')
  await expect(work(page).getByLabel('Remaining effort (hours)', { exact: true })).toBeDisabled()
  await expect(work(page)).toContainText(`Retained previous estimate: ${remaining === null ? 'Unknown' : `${remaining} h`}`)
  await expect(health(page)).toContainText('171 person-hours')
  await expect(work(page).locator('[data-effort="actual"]')).toHaveText(logged ? '2 h' : '0 h')
  await expect(work(page).locator('[data-effort="forecast"]')).toHaveText(logged ? '2 h' : 'Not available')
  await expect(work(page).locator('[data-effort="variance"]')).toHaveText(logged ? '-8 h' : 'Not available')
  await expect(work(page)).toContainText('Recorded actual effort')
  await expect(work(page)).toContainText('Recorded hours may be incomplete')
  if (!logged) await expect(work(page)).toContainText('Not recorded — 0 hours logged')
  await mkdir(directory, { recursive: true })
  if (remaining === 10 && !logged) await page.getByRole('region', { name: 'Selected chart task', exact: true }).screenshot({ path: `${directory}/c02-complete-summary.png` })
  const suffix = `complete-${remaining}-${logged}`; await saveAs(page, suffix); await page.reload()
  await page.getByLabel('Saved plans', { exact: true }).selectOption(`WP73 DISPOSABLE ${suffix}`); await page.getByRole('button', { name: 'Load project', exact: true }).click()
  const after = await exported(page)
  expect(after.schemaVersion).toBe(5); expect(after.workTracking).toEqual(input.workTracking); expect(after.taskProgress).toEqual(input.taskProgress)
  expect(after.tasks).toEqual(input.tasks); expect(after.baseline).toEqual(input.baseline)
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'roundtrip.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(after)) })
  await select(page, 'T13'); await expect(work(page).locator('[data-effort="remaining"]')).toHaveText('0 h')
  await evidence(`c02-${remaining}-${logged}`, { storedRemaining: after.workTracking!.remainingHours.T13, effectiveRemaining: 0, loggedHours: logged ? 2 : 0, comparisonsQualified: true, noLogsComparisonsUnavailable: !logged, knownProjectRemaining: 171, exactBaselineHistoryWorkAndEstimatesPreserved: true, format: after.schemaVersion })
})

for (const entry of ['table', 'chart', 'details'] as const) test(`C05 - ${entry} reopening cancels atomically and requires deliberate reassessment`, async ({ page }) => {
  if (entry === 'details') await page.setViewportSize({ width: 780, height: 900 })
  const input = completed(10, true); await openPlan(page, input); await select(page, 'T13')
  const target = entry === 'chart' ? 'Blocked' : entry === 'details' ? 'Not Started' : 'In Progress'
  const status = page.getByRole('combobox', { name: `T13 status in ${entry}`, exact: true })
  await status.selectOption(target)
  const dialog = page.getByRole('dialog'), confirm = dialog.getByRole('button', { name: 'Reopen task', exact: true })
  await expect(confirm).toBeDisabled()
  await dialog.getByLabel(/Reopening.*reason/).fill('Reassessed unfinished work after review')
  await dialog.getByRole('radio', { name: 'Enter a revised amount', exact: true }).check()
  await dialog.getByLabel('Reassessed remaining effort (hours)', { exact: true }).fill('-1'); await confirm.click()
  await expect(dialog.getByRole('alert')).toContainText('zero or a positive')
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  const cancelled = await exported(page)
  expect(cancelled.workTracking).toEqual(input.workTracking); expect(cancelled.taskProgress).toEqual(input.taskProgress)
  await select(page, 'T13'); await status.selectOption(target)
  await dialog.getByLabel(/Reopening.*reason/).fill('Reassessed unfinished work after review')
  if (entry === 'table') await dialog.getByRole('radio', { name: /^Confirm suggested amount/ }).check()
  else if (entry === 'chart') {
    await dialog.getByRole('radio', { name: 'Enter a revised amount', exact: true }).check()
    await dialog.getByLabel('Reassessed remaining effort (hours)', { exact: true }).fill('4')
  } else await dialog.getByRole('radio', { name: 'Declare remaining effort Unknown', exact: true }).check()
  await mkdir(directory, { recursive: true }); if (entry === 'chart') await dialog.screenshot({ path: `${directory}/c05-reassessment.png` })
  await confirm.click()
  const after = await exported(page), value = entry === 'table' ? 10 : entry === 'chart' ? 4 : null
  expect(after.workTracking!.remainingHours.T13).toBe(value); expect(after.taskProgress!.tasks.T13.status).toBe(target)
  expect(after.taskProgress!.events[0]).toEqual(input.taskProgress!.events[0]); expect(after.taskProgress!.events).toHaveLength(2)
  expect(after.workTracking!.entries).toEqual(input.workTracking!.entries); expect(after.tasks).toEqual(input.tasks); expect(after.baseline).toEqual(input.baseline)
  await evidence(`c05-${entry}`, { target, reassessedRemaining: value, invalidInputRejected: true, cancelPreservedBothStates: true, originalCompletionSnapshotAndWorkUnchanged: true, format: after.schemaVersion })
})

test('C04 C02 C05 - create, reassess, complete, reopen and duplicate have independent effort and forecast effects', async ({ page }) => {
  const input = studentFile(); await openPlan(page, input)
  await page.getByRole('button', { name: 'Add task', exact: true }).click()
  await page.locator('.editor').getByLabel(/^Task name/).fill('WP73 DISPOSABLE additional review')
  await page.locator('.editor').getByLabel(/^Estimated duration/).fill('10')
  await page.locator('.editor').getByRole('button', { name: 'Save task', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Edit T31 remaining effort', exact: true })).toContainText('10 h')
  await expect(health(page)).toContainText('191 person-hours'); await expect(health(page)).toContainText('2026-12-20')
  await quick(page, 'T31', '14'); await expect(health(page)).toContainText('195 person-hours')
  await page.getByRole('button', { name: 'Edit T31 duration', exact: true }).click(); await page.getByLabel('T31 duration', { exact: true }).fill('12'); await page.getByLabel('T31 duration', { exact: true }).press('Enter')
  await expect(page.getByRole('button', { name: 'Edit T31 remaining effort', exact: true })).toContainText('14 h')
  await select(page, 'T31'); await page.getByRole('combobox', { name: 'T31 status in chart', exact: true }).selectOption('Complete')
  const dialog = page.getByRole('dialog'); for (const checkbox of await dialog.getByRole('checkbox').all()) await checkbox.check()
  await dialog.getByRole('button', { name: 'Confirm completion', exact: true }).click()
  await expect(health(page)).toContainText('181 person-hours'); await expect(health(page)).toContainText('2026-12-18')
  const complete = await exported(page)
  expect(complete.workTracking!.remainingHours.T31).toBe(14)
  await select(page, 'T31'); await page.getByRole('combobox', { name: 'T31 status in chart', exact: true }).selectOption('In Progress')
  await dialog.getByLabel('Reopening reason', { exact: true }).fill('Six person-hours remain after the review')
  await dialog.getByRole('radio', { name: 'Enter a revised amount', exact: true }).check(); await dialog.getByLabel('Reassessed remaining effort (hours)', { exact: true }).fill('6')
  await dialog.getByRole('button', { name: 'Reopen task', exact: true }).click()
  await expect(health(page)).toContainText('187 person-hours'); await expect(health(page)).toContainText('2026-12-19')
  await page.getByRole('button', { name: 'Duplicate T31', exact: true }).click()
  await expect(health(page)).toContainText('199 person-hours'); await expect(health(page)).toContainText('2026-12-22')
  const after = await exported(page)
  expect(after.workTracking!.remainingHours.T32).toBe(12)
  expect(after.taskProgress!.tasks.T32.status).toBe('Not Started'); expect(after.taskProgress!.events.filter(event => event.taskId === 'T32')).toEqual([])
  expect(after.workTracking!.entries.filter(entry => entry.taskId === 'T32')).toEqual([])
  expect(after.taskProgress!.events[0]).toEqual(complete.taskProgress!.events[0]); expect(after.baseline).toEqual(input.baseline)
  expect(after.tasks.filter(task => !['T31', 'T32'].includes(task.taskId))).toEqual(input.tasks)
  await tab(page, 'Workspace'); await quick(page, 'T32', ''); await expect(health(page)).toContainText('Forecast: Partial')
  await evidence('c04-cross-feature', { createdRemaining: 10, revisedRemaining: 14, durationEditedTo: 12, completeEffective: 0, completeStored: 14, reopenRemaining: 6, copiedRemaining: 12, explicitUnknownSupported: true, forecastTotals: [191, 195, 181, 187], forecastDates: ['2026-12-20', '2026-12-18', '2026-12-19'], baselineAndOriginalIdsPreserved: true })
})

for (const stored of [0, null]) test(`C05 - retained ${stored} must be explicitly reassessed; zero remains distinct from Unknown`, async ({ page }) => {
  const input = completed(stored, false); await openPlan(page, input); await select(page, 'T13')
  await page.getByRole('combobox', { name: 'T13 status in details', exact: true }).selectOption('In Progress')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Reopening reason', { exact: true }).fill('Explicitly reviewed remaining work after completion')
  await expect(dialog.getByRole('button', { name: 'Reopen task', exact: true })).toBeDisabled()
  const suggested = dialog.getByRole('radio', { name: /^Confirm suggested amount/ })
  if (stored === null) {
    await expect(suggested).toBeDisabled()
    await dialog.getByRole('radio', { name: 'Enter a revised amount', exact: true }).check()
    await dialog.getByRole('button', { name: 'Reopen task', exact: true }).click()
    await expect(dialog.getByRole('alert')).toContainText('explicitly choose Unknown')
    await dialog.getByRole('radio', { name: 'Declare remaining effort Unknown', exact: true }).check()
  } else await suggested.check()
  await dialog.getByRole('button', { name: 'Reopen task', exact: true }).click()
  const after = await exported(page)
  expect(after.workTracking!.remainingHours.T13).toBe(stored)
  expect(after.taskProgress!.tasks.T13.status).toBe('In Progress')
  expect(after.taskProgress!.events[0]).toEqual(input.taskProgress!.events[0]); expect(after.baseline).toEqual(input.baseline)
})

test('C06 - Fixed today pins explicitly; Automatic advances at idle local midnight and both modes round-trip', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-03T05:59:00Z') })
  const input = studentFile(); await openPlan(page, input); await tab(page, 'Project Settings')
  await page.getByRole('radio', { name: /^Automatic/ }).check(); await expect(page.getByText('Automatic As-of: 2026-11-02', { exact: true })).toBeVisible()
  await page.getByRole('radio', { name: /^Fixed/ }).check(); await expect(page.getByLabel('Forecast As-of date', { exact: true })).toHaveValue('2026-11-02')
  await saveAs(page, 'fixed today'); const fixed = await exported(page); expect(fixed.forecastSettings!.asOfDate).toBe('2026-11-02')
  await tab(page, 'Project Settings'); await page.getByRole('radio', { name: /^Automatic/ }).check()
  await saveAs(page, 'automatic'); const automatic = await exported(page); expect(automatic.forecastSettings!.asOfDate).toBeUndefined()
  await tab(page, 'Workspace'); await page.clock.fastForward(61_000)
  await expect(health(page)).toContainText('As-of2026-11-03')
  await tab(page, 'Project Settings'); await expect(page.getByText('Automatic As-of: 2026-11-03', { exact: true })).toBeVisible()
  await mkdir(directory, { recursive: true }); await page.getByRole('heading', { name: 'Forecast assumptions', exact: true }).locator('..').locator('..').screenshot({ path: `${directory}/c06-date-mode.png` })
  await tab(page, 'Files'); await page.getByLabel('Saved plans', { exact: true }).selectOption('WP73 DISPOSABLE fixed today'); await page.getByRole('button', { name: 'Load project', exact: true }).click()
  await expect(health(page)).toContainText('As-of2026-11-02'); await page.reload()
  await page.getByLabel('Saved plans', { exact: true }).selectOption('WP73 DISPOSABLE fixed today'); await page.getByRole('button', { name: 'Load project', exact: true }).click()
  await tab(page, 'Project Settings'); await expect(page.getByRole('radio', { name: /^Fixed/ })).toBeChecked()
  await expect(page.getByLabel('Forecast As-of date', { exact: true })).toHaveValue('2026-11-02')
  const after = await exported(page); expect(after.forecastSettings).toEqual(fixed.forecastSettings); expect(after.baseline).toEqual(input.baseline)
  expect(Object.keys(after.forecastSettings!)).not.toContain('dateMode')
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'fixed.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(after)) })
  await tab(page, 'Project Settings'); await expect(page.getByRole('radio', { name: /^Fixed/ })).toBeChecked()
  await evidence('c06-modes', { fixedSettings: fixed.forecastSettings, automaticSettings: automatic.forecastSettings, automaticAdvancedAtIdleMidnight: true, fixedRetainedAcrossNextDayReloadAndImport: true, noPersistedModeFlag: true, schemaVersion: after.schemaVersion })
})

test('C02 C04 compatibility - legacy Complete Unknown remains stored Unknown and untouched estimates are not backfilled', async ({ page }) => {
  const original = JSON.parse(JSON.stringify({ ...completed(null, true), schemaVersion: 4, forecastSettings: undefined }))
  delete original.workTracking.remainingHours.T2
  await openPlan(page, original); await select(page, 'T13')
  await expect(work(page).locator('[data-effort="remaining"]')).toHaveText('0 h')
  await select(page, 'T2'); await expect(page.getByRole('button', { name: 'Edit T2 remaining effort', exact: true })).toContainText('Unknown')
  const after = await exported(page)
  expect(after.workTracking).toEqual(original.workTracking); expect(after.taskProgress).toEqual(original.taskProgress); expect(after.baseline).toEqual(original.baseline)
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export WP6.3 backup', exact: true }).click()
  expect(JSON.parse(await readFile((await (await pending).path())!, 'utf8'))).toEqual(original)
  await evidence('legacy-compatibility', { originalVersion: 4, currentExportVersion: after.schemaVersion, completeEffective: 0, completeStored: after.workTracking!.remainingHours.T13, legacyMissingRemainingNotBackfilled: true, originalBackupExact: true, baselineHistoryActualsUnchanged: true })
})
