import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { calculateSchedule } from '../../src/domain'
import type { ProjectFile } from '../../src/persistence/projectFile'
import { LOCAL_PROJECTS_KEY } from '../../src/persistence/localProjects'
import { chooseDependency } from '../dependencyHelpers'
import { openPlan } from '../wp5-2-fixtures'
import { legacyStudentFile, studentFile, studentInputs } from './studentFixture'

test.use({ timezoneId: 'America/Regina', viewport: { width: 1440, height: 900 }, actionTimeout: 10_000 })
const directory = 'docs/qa/wp7-1/evidence'
const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true }).click()
const health = (page: Page) => page.getByRole('region', { name: 'Project health', exact: true })
const work = (page: Page) => page.getByRole('region', { name: 'Work & effort', exact: true })
const statusPanel = (page: Page) => page.getByRole('region', { name: 'Status & completion', exact: true })
const baselineHash = (file: ProjectFile) => createHash('sha256').update(JSON.stringify(file.baseline)).digest('hex')
async function evidence(name: string, data: unknown) { await mkdir(directory, { recursive: true }); await writeFile(`${directory}/${name}.json`, JSON.stringify(data, null, 2) + '\n') }
async function download(page: Page, name: string | RegExp = 'Export JSON'): Promise<ProjectFile> {
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name, exact: typeof name === 'string' }).click()
  const file = await pending; return JSON.parse(await readFile((await file.path())!, 'utf8'))
}
async function exported(page: Page) { await tab(page, 'Files'); return download(page) }
async function select(page: Page, id: string) { await tab(page, 'Workspace'); await page.getByRole('button', { name: `Select ${id} in chart`, exact: true }).click() }
async function save(page: Page, name: string) {
  await tab(page, 'Files'); await page.getByLabel('Saved plan name', { exact: true }).fill(`WP71 DISPOSABLE ${name}`)
  await page.getByRole('button', { name: 'Save As', exact: true }).click(); await expect(page.getByText('Saved locally', { exact: true })).toBeVisible()
}
async function quick(page: Page, id: string, value: string, chart = false) {
  const label = `${chart ? 'Selected ' : ''}${id} remaining effort`
  await page.getByRole('button', { name: `Edit ${label}`, exact: true }).click(); await page.getByLabel(label, { exact: true }).fill(value); await page.getByLabel(label, { exact: true }).press('Enter')
}
function unchanged(before: ProjectFile, after: ProjectFile) { expect({ ...after, savedAt: before.savedAt }).toEqual(before) }
function anchors(file: ProjectFile) {
  const result = calculateSchedule(file.project, file.tasks)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result
}

test('E01 E02 E03 - create thirty tasks through UI, verify anchors, reject cycles, organize durable IDs', async ({ page }) => {
  test.setTimeout(180_000)
  const inputs = studentInputs()
  await page.goto('/'); await page.getByRole('button', { name: 'New project', exact: true }).click()
  for (const [label, value] of [['Project name', inputs.project.name], ['Project start date', '2026-11-02'], ['Target end date', '2027-02-26'], ['Working hours per day', '4']]) {
    await page.getByLabel(label, { exact: true }).fill(value); await page.getByLabel(label, { exact: true }).press('Tab')
  }
  await page.getByRole('checkbox', { name: 'Wednesday', exact: true }).uncheck()
  await expect(page.getByLabel('Project start date', { exact: true })).toHaveAttribute('type', 'date')
  await tab(page, 'Workspace')
  for (const task of inputs.tasks) {
    await page.getByRole('button', { name: 'Add task', exact: true }).click()
    const editor = page.locator('.editor')
    await editor.getByLabel(/^Task name/).fill(task.name)
    await editor.getByLabel(/^Estimated duration/).fill(String(task.durationHours))
    await editor.getByLabel('Description', { exact: true }).fill(task.description)
    for (const id of task.predecessorTaskIds) await chooseDependency(page, `${id} \u2014 ${inputs.tasks.find(item => item.taskId === id)!.name}`)
    if (task.independentStartMode === 'MANUAL') await editor.getByLabel('Independent start date', { exact: true }).fill(task.requestedStartDate)
    await editor.getByRole('button', { name: 'Save task', exact: true }).click()
  }
  await expect(page.locator('[data-task-row]')).toHaveCount(30)
  const created = await exported(page)
  expect(created.tasks).toEqual(inputs.tasks); expect(created.nextTaskNumber).toBe(31)
  expect(anchors(created).projectCompletion).toEqual({ date: '2026-12-15', afterHour: 3 })
  const t25 = anchors(created).tasks.find(task => task.taskId === 'T25')!
  expect(t25.startDate).toBe('2026-11-19')
  await tab(page, 'Workspace')
  await page.getByRole('button', { name: 'T2 predecessors', exact: true }).click()
  await page.getByRole('checkbox', { name: /^T2 predecessor T1 / }).uncheck(); await page.getByRole('button', { name: 'Done', exact: true }).click()
  expect(anchors(await exported(page)).tasks.find(task => task.taskId === 'T2')!.startDate).toBe('2026-11-02')
  await tab(page, 'Workspace'); await chooseDependency(page, `T2 predecessor T1 \u2014 ${inputs.tasks[0].name}`)
  expect(anchors(await exported(page)).projectCompletion).toEqual({ date: '2026-12-15', afterHour: 3 })
  await tab(page, 'Workspace'); await chooseDependency(page, `T1 predecessor T30 \u2014 ${inputs.tasks[29].name}`)
  await expect(page.locator('.dependency-popover').getByRole('alert')).toContainText(/cycle/i)
  await page.locator('.dependency-popover').getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Move T30 up', exact: true }).click()
  const manual = await page.locator('[data-task-row]').evaluateAll(rows => rows.map(row => row.getAttribute('data-task-row')))
  await page.getByRole('combobox', { name: 'Task order', exact: true }).selectOption('name'); await page.getByRole('combobox', { name: 'Task order', exact: true }).selectOption('manual')
  expect(await page.locator('[data-task-row]').evaluateAll(rows => rows.map(row => row.getAttribute('data-task-row')))).toEqual(manual)
  await page.getByRole('button', { name: 'Duplicate T10', exact: true }).click()
  const organized = await exported(page)
  expect(organized.tasks.find(task => task.taskId === 'T31')!.predecessorTaskIds).toEqual(['T8', 'T9'])
  expect(organized.taskProgress!.events.some(event => event.taskId === 'T31')).toBe(false)
  expect(organized.workTracking!.entries.some(entry => entry.taskId === 'T31')).toBe(false)
  expect(organized.nextTaskNumber).toBe(32)
  await save(page, 'create-organize')
  await evidence('e01-e03', { taskCountCreated: 30, taskCountAfterDuplicate: organized.tasks.length, nextTaskNumber: organized.nextTaskNumber, completion: anchors(created).projectCompletion, manualOrder: organized.manualOrder, task25: t25 })
})

test('E04 E05 E09 E14 - deliberately baseline, change current schedule, inspect charts/network and preserve invariants', async ({ page }) => {
  test.setTimeout(90_000)
  await openPlan(page, studentFile({ baseline: false }))
  await tab(page, 'Project Settings'); await page.getByRole('button', { name: 'Establish Baseline', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Establish baseline', exact: true }).click()
  const frozen = await exported(page)
  expect(frozen.baseline!.schedule.projectCompletion).toEqual({ date: '2026-12-15', afterHour: 3 })
  await tab(page, 'Workspace'); await page.getByRole('button', { name: 'Edit T18 duration', exact: true }).click()
  await page.getByLabel('T18 duration', { exact: true }).fill('16'); await page.getByLabel('T18 duration', { exact: true }).press('Enter')
  const changed = await exported(page)
  expect(changed.baseline).toEqual(frozen.baseline); expect(anchors(changed).projectCompletion).toEqual({ date: '2026-12-17', afterHour: 3 })
  await select(page, 'T30'); await page.getByRole('button', { name: 'Go to selected task', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Show Baseline', exact: true }).check(); await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  for (const mode of ['Expanded', 'Compressed']) for (const scale of ['hour', 'day', 'week']) {
    await page.getByRole('button', { name: mode, exact: true }).click(); await page.getByRole('combobox', { name: 'Scale', exact: true }).selectOption(scale)
    await expect(page.locator('[data-overlay="baseline"][data-task-id="T30"]')).toHaveAttribute('data-finish-date', '2026-12-15')
    await expect(page.locator('[data-overlay="forecast"][data-task-id="T30"]')).toHaveAttribute('data-finish-date', '2026-12-18')
  }
  await page.getByRole('checkbox', { name: 'Highlight Critical Path', exact: true }).check()
  await page.getByRole('button', { name: 'Network / Critical Path', exact: true }).click()
  const network = page.getByRole('region', { name: 'Network / Critical Path', exact: true })
  await network.getByRole('combobox', { name: 'Network zoom', exact: true }).selectOption('0.75')
  await network.getByRole('button', { name: 'Go to selected node', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Network task T30 / })).toHaveAttribute('aria-pressed', 'true')
  await network.getByRole('button', { name: 'Fit to View', exact: true }).click()
  const transform = () => network.locator('.network-svg').evaluate(element => ['data-pan-x', 'data-pan-y'].map(name => Number(element.getAttribute(name))))
  const beforePan = await transform()
  const viewport = (await network.getByRole('region', { name: 'Scrollable dependency network', exact: true }).boundingBox())!
  await page.mouse.move(viewport.x + 10, viewport.y + 10); await page.mouse.down()
  await page.mouse.move(viewport.x + 90, viewport.y + 50, { steps: 8 }); await page.mouse.up()
  const afterPan = await transform()
  expect(afterPan[0] - beforePan[0]).toBeCloseTo(80, 0); expect(afterPan[1] - beforePan[1]).toBeCloseTo(40, 0)
  await expect(page.getByRole('button', { name: /^Network task T30 / })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Gantt', exact: true }).click()
  await page.getByRole('region', { name: 'Selected chart task', exact: true }).getByRole('button', { name: 'Close selected task details', exact: true }).click()
  const after = await exported(page); unchanged(changed, after)
  await tab(page, 'Workspace'); await page.screenshot({ path: `${directory}/e04-e05-chart.png`, fullPage: true })
  await evidence('e04-e05', { baselineHash: baselineHash(after), baselineCompletion: after.baseline!.schedule.projectCompletion, currentCompletion: anchors(after).projectCompletion, taskCount: after.tasks.length, visualizationOnlyDataUnchanged: true })
})

test('E06 E07 E10 E14 - work sessions, criteria, completion/reopening and persistent historical snapshots', async ({ page }) => {
  test.setTimeout(120_000)
  const input = studentFile(); await openPlan(page, input); await select(page, 'T1')
  for (const [contributor, hours, date] of [['QA Alex', '1.25', '2026-10-31'], ['QA Casey', '2.5', '2026-11-01'], ['QA Jordan', '.75', '2026-11-02']]) {
    await work(page).getByRole('button', { name: 'Add work entry', exact: true }).click()
    await work(page).getByLabel('Contributor', { exact: true }).fill(contributor); await work(page).getByLabel('Work date', { exact: true }).fill(date)
    await work(page).getByLabel('Work hours', { exact: true }).fill(hours); await work(page).getByLabel('Work performed', { exact: true }).fill(`Reviewed charter evidence with ${contributor}`)
    await work(page).getByRole('button', { name: 'Save work entry', exact: true }).click()
  }
  await expect(work(page).locator('[data-effort="actual"]')).toHaveText('4.5 h')
  await expect(health(page)).toContainText('2026-12-18')
  const logged = await exported(page); expect(logged.baseline).toEqual(input.baseline)
  const [first, second] = logged.workTracking!.entries
  await select(page, 'T1'); await work(page).getByRole('button', { name: `Edit work entry ${first.entryId}`, exact: true }).click()
  await work(page).getByLabel('Work hours', { exact: true }).fill('1.5'); await work(page).getByRole('button', { name: 'Save work entry', exact: true }).click()
  await work(page).getByRole('button', { name: `Delete work entry ${second.entryId}`, exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(work(page).locator('[data-effort="actual"]')).toHaveText('4.75 h')
  await work(page).getByRole('button', { name: `Delete work entry ${second.entryId}`, exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Delete work entry', exact: true }).click()
  await expect(work(page).locator('[data-effort="actual"]')).toHaveText('2.25 h')
  await quick(page, 'T1', '2'); await quick(page, 'T1', '1.25', true)
  await expect(work(page).locator('[data-effort="forecast"]')).toHaveText('3.5 h')
  await statusPanel(page).getByRole('button', { name: 'Add criterion', exact: true }).click()
  await statusPanel(page).getByLabel('Completion criterion', { exact: true }).fill('A teammate reviewed and approved the charter')
  await statusPanel(page).getByRole('button', { name: 'Save criterion', exact: true }).click()
  await statusPanel(page).getByRole('button', { name: 'Mark Complete', exact: true }).click()
  const modal = page.getByRole('dialog'); await modal.getByLabel('Effective completion date', { exact: true }).fill('2026-11-02')
  for (const checkbox of await modal.getByRole('checkbox').all()) await checkbox.check()
  await modal.getByRole('button', { name: 'Confirm completion', exact: true }).click()
  const completed = await exported(page); const completion = completed.taskProgress!.events[0]
  expect(completion.committedFinishDateAtCompletion).toBe('2026-11-02'); expect(completed.baseline).toEqual(input.baseline)
  await select(page, 'T1'); await statusPanel(page).getByRole('button', { name: 'Reopen task', exact: true }).click()
  await modal.getByLabel('Reopening reason', { exact: true }).fill('Mentor requested one additional charter check'); await modal.getByRole('button', { name: 'Reopen task', exact: true }).click()
  await statusPanel(page).getByRole('button', { name: 'Add criterion', exact: true }).click()
  await statusPanel(page).getByLabel('Completion criterion', { exact: true }).fill('Additional mentor check is documented'); await statusPanel(page).getByRole('button', { name: 'Save criterion', exact: true }).click()
  await page.getByRole('button', { name: 'Duplicate T1', exact: true }).click()
  const current = await exported(page)
  expect(current.taskProgress!.events[0]).toEqual(completion)
  expect(current.taskProgress!.tasks.T31.status).toBe('Not Started')
  expect(current.taskProgress!.tasks.T31.criteria.every(item => !item.checked)).toBe(true)
  expect(current.taskProgress!.events.some(event => event.taskId === 'T31')).toBe(false)
  expect(current.workTracking!.entries.some(entry => entry.taskId === 'T31')).toBe(false)
  expect(current.workTracking!.remainingHours).not.toHaveProperty('T31')
  expect(current.workTracking!.entries.find(entry => entry.entryId === first.entryId)!.createdAt).toBe(first.createdAt)
  await save(page, 'work-history'); await page.reload()
  await page.getByLabel('Saved plans', { exact: true }).selectOption('WP71 DISPOSABLE work-history'); await page.getByRole('button', { name: 'Load project', exact: true }).click()
  unchanged(current, await exported(page))
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'wp71-history.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(current)) })
  unchanged(current, await exported(page))
  await evidence('e06-e07-e10', { baselineHash: baselineHash(current), actualHours: current.workTracking!.entries.reduce((sum, entry) => sum + Math.round(entry.hours * 100), 0) / 100, events: current.taskProgress!.events, originalTaskIdsRetained: input.tasks.every(task => current.tasks.some(item => item.taskId === task.taskId)), copiedLogs: 0, copiedHistory: 0, jsonLocalRoundTrip: true })
})

test('E08 E09 E14 - populate capacity and estimates, separate project risk/task slip, block and unblock without data loss', async ({ page }) => {
  test.setTimeout(120_000)
  const input = studentFile({ estimates: false }); await openPlan(page, input)
  await tab(page, 'Project Settings')
  await page.getByRole('checkbox', { name: 'Enable effort-based forecasting', exact: true }).check()
  for (const [label, value] of [['Class hours per student per week', '3'], ['Homework hours per student per week', '5'], ['Team size', '4'], ['Forecast As-of date', '2026-11-09']]) await page.getByLabel(label, { exact: true }).fill(value)
  await tab(page, 'Workspace')
  await expect(health(page)).toContainText('Forecast: Partial')
  for (const task of input.tasks) await quick(page, task.taskId, String(task.durationHours))
  await expect(health(page)).toContainText('Known remaining / target capacity181 person-hours / 502.86 person-hours')
  await expect(health(page)).toContainText('Projected completion2026-12-18')
  await expect(health(page).getByRole('status')).toContainText('On Track')
  await select(page, 'T30'); await page.getByRole('button', { name: 'Go to selected task', exact: true }).click(); await page.getByRole('checkbox', { name: 'Show Forecast', exact: true }).check()
  await expect(page.getByRole('region', { name: 'Selected chart task', exact: true })).toContainText('Forecast Slip')
  const status = page.getByRole('combobox', { name: 'T13 status in table', exact: true })
  await status.selectOption('Blocked'); await page.getByLabel('Blocked reason', { exact: true }).fill('Waiting for school test accounts'); await page.getByRole('button', { name: 'Set Blocked', exact: true }).click()
  await expect(health(page)).toContainText('Indeterminate'); await expect(health(page).getByRole('status')).toContainText('Uncertain')
  await expect(page.locator('[data-overlay="forecast"][data-task-id="T30"]')).toHaveCount(0)
  await status.selectOption('In Progress'); await expect(health(page)).toContainText('Projected completion2026-12-18')
  await quick(page, 'T20', ''); await expect(health(page)).toContainText('Forecast: Partial'); await quick(page, 'T20', '10')
  await tab(page, 'Project Settings'); await page.getByLabel('Team size', { exact: true }).fill('2'); await page.getByLabel('Target end date', { exact: true }).fill('2027-01-15'); await page.getByLabel('Target end date', { exact: true }).press('Tab'); await tab(page, 'Workspace')
  await expect(health(page)).toContainText('Projected completion2027-01-27'); await expect(health(page).getByRole('status')).toContainText('At Risk')
  const after = await exported(page); expect(after.baseline).toEqual(input.baseline); expect(after.tasks).toEqual(input.tasks); expect(after.workTracking!.entries).toEqual([])
  await evidence('e08-e09', { baselineHash: baselineHash(after), totalRemaining: 181, defaultForecast: '2026-12-18', capacityPerWeek: 32, targetDays: 110, targetCapacity: 3520 / 7, reducedCapacityForecast: '2027-01-27', blockedUnblocked: true, taskCount: after.tasks.length })
})

for (const version of [1, 2, 3, 4] as const) test(`E11 - thirty-task legacy format ${version} backup, visible migration and malformed replacement`, async ({ page }) => {
  const original = legacyStudentFile(version), name = `WP71 DISPOSABLE legacy-${version}`
  await page.goto('/'); await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: LOCAL_PROJECTS_KEY, raw: JSON.stringify({ schemaVersion: 1, projects: [{ name, savedAt: original.savedAt, plan: original }] }) })
  await page.reload(); await page.getByLabel('Saved plans', { exact: true }).selectOption(name); await page.getByRole('button', { name: 'Load project', exact: true }).click()
  await expect(health(page)).toContainText('Forecast: Disabled')
  const stored = await page.evaluate(key => localStorage.getItem(key), LOCAL_PROJECTS_KEY)
  await tab(page, 'Project Settings'); await page.getByLabel('Project name', { exact: true }).fill(`${name} edited`); await page.getByLabel('Project name', { exact: true }).press('Tab')
  await page.getByRole('button', { name: 'Save', exact: true }).click(); await expect(page.getByRole('dialog')).toBeVisible()
  expect(await download(page, /^Export saved .* backup$/)).toEqual(original)
  await page.keyboard.press('Escape'); expect(await page.evaluate(key => localStorage.getItem(key), LOCAL_PROJECTS_KEY)).toBe(stored)
  await tab(page, 'Files'); await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...original, schemaVersion: 99 })) })
  await expect(page.getByRole('alert')).toContainText('UNSUPPORTED_VERSION'); expect(await page.evaluate(key => localStorage.getItem(key), LOCAL_PROJECTS_KEY)).toBe(stored)
  await page.getByRole('button', { name: 'Save', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Overwrite saved plan', exact: true }).click()
  const upgraded = await exported(page)
  expect(upgraded.schemaVersion).toBe(5); expect(upgraded.tasks).toEqual(original.tasks); expect(upgraded.baseline).toEqual(original.baseline)
  expect(upgraded.forecastSettings).toBeUndefined(); expect(upgraded.taskProgress!.events).toEqual([])
  await evidence(`e11-format-${version}`, { originalVersion: version, upgradedVersion: upgraded.schemaVersion, backupExact: true, cancelledAndMalformedPreservedStoredBytes: true, taskCount: upgraded.tasks.length })
})

test('E08 E10 - automatic today versus fixed today persists distinctly across a simulated date change', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-02T18:00:00Z'))
  const input = studentFile(); await openPlan(page, input); await tab(page, 'Project Settings')
  await page.getByRole('button', { name: 'Use today automatically', exact: true }).click()
  const date = page.getByLabel('Forecast As-of date', { exact: true })
  await expect(date).toHaveValue('2026-11-02')
  await date.fill('2026-11-02')
  await expect(page.getByText(/As-of follows today locally/)).toBeVisible()
  await save(page, 'date-modes')
  const automatic = await exported(page); expect(automatic.forecastSettings!.asOfDate).toBeUndefined()
  await page.clock.setFixedTime(new Date('2026-11-03T18:00:00Z')); await page.reload()
  await page.getByLabel('Saved plans', { exact: true }).selectOption('WP71 DISPOSABLE date-modes'); await page.getByRole('button', { name: 'Load project', exact: true }).click()
  await expect(health(page)).toContainText('As-of2026-11-03')
  await tab(page, 'Project Settings')
  await date.fill('2026-11-01'); await date.fill('2026-11-02')
  await expect(page.getByText(/Using a fixed scenario date/)).toBeVisible()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const fixed = await exported(page); expect(fixed.forecastSettings!.asOfDate).toBe('2026-11-02')
  await page.reload(); await page.getByLabel('Saved plans', { exact: true }).selectOption('WP71 DISPOSABLE date-modes'); await page.getByRole('button', { name: 'Load project', exact: true }).click()
  await expect(health(page)).toContainText('As-of2026-11-02')
  const after = await exported(page); unchanged(fixed, after); expect(after.baseline).toEqual(input.baseline)
  await evidence('as-of-date-modes', { simulatedInitialDate: '2026-11-02', simulatedNextDate: '2026-11-03', sameValueFillRemainedAutomatic: true, automaticSettings: automatic.forecastSettings, fixedSettings: fixed.forecastSettings, fixedDateSurvivedNextDayReload: true, baselineHash: baselineHash(after) })
})

test('E12 - invalid fields, cancelled replacement and actual beforeunload/refresh recovery of last saved state', async ({ page }) => {
  test.setTimeout(90_000)
  const input = studentFile(); await openPlan(page, input); await save(page, 'recovery')
  await tab(page, 'Workspace'); await page.getByRole('button', { name: 'Edit T1 duration', exact: true }).click(); await page.getByLabel('T1 duration', { exact: true }).fill('0'); await page.getByLabel('T1 duration', { exact: true }).press('Enter')
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled(); await page.getByLabel('T1 duration', { exact: true }).press('Escape')
  await tab(page, 'Project Settings'); await page.getByLabel(/^Project start date/).fill(''); await page.getByLabel(/^Project start date/).press('Tab')
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled(); await page.getByRole('button', { name: 'Revert settings', exact: true }).click()
  await page.getByLabel('Team size', { exact: true }).fill('1.5'); await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled(); await page.getByRole('button', { name: 'Revert invalid forecast entries', exact: true }).click()
  await tab(page, 'Workspace'); await page.getByRole('button', { name: 'Edit T1', exact: true }).click(); await page.locator('.editor').getByLabel(/^Task name/).fill('UNSAVED DISPOSABLE DRAFT')
  // A dismissed beforeunload cancels navigation. Playwright reload can keep
  // awaiting the load event which will never occur; bound that wait explicitly.
  const prompt = page.waitForEvent('dialog'); const reload = page.reload({ timeout: 5_000 }).catch(error => String(error))
  const dialog = await prompt; expect(dialog.type()).toBe('beforeunload'); await dialog.dismiss(); await reload
  await expect(page.locator('.editor').getByLabel(/^Task name/)).toHaveValue('UNSAVED DISPOSABLE DRAFT')
  page.once('dialog', async next => { expect(next.type()).toBe('beforeunload'); await next.accept() }); await page.reload()
  await page.getByLabel('Saved plans', { exact: true }).selectOption('WP71 DISPOSABLE recovery'); await page.getByRole('button', { name: 'Load project', exact: true }).click()
  const recovered = await exported(page); expect(recovered.tasks).toEqual(input.tasks); expect(recovered.baseline).toEqual(input.baseline)
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'invalid-date.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...recovered, project: { ...recovered.project, projectStartDate: '2026-02-30' } })) })
  await expect(page.getByRole('alert')).toContainText('INVALID_DATE')
  await evidence('e12', { nativeBeforeUnloadDismissed: true, cancelledRefreshKeptDraft: true, acceptedRefreshDiscardedUnsavedDraft: true, explicitSavedStateRecovered: true, malformedDateRejected: true, baselineHash: baselineHash(recovered) })
})
