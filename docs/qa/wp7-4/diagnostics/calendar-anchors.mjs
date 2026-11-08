// Design-only diagnostic: existing calendar/WP1 anchors, not a guided planner.
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

const loader = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-wp74-design', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
let domain
try { domain = await loader.ssrLoadModule('/src/domain/index.ts') }
finally { await loader.close() }
const { calculateSchedule, createWorkingCalendar, dateToOrdinal, ordinalToDate } = domain
const project = { projectId: 'WP74-DESIGN-ONLY', name: 'Fictional calendar anchors', projectStartDate: '2026-11-02', targetEndDate: '2026-11-30', workingWeekdays: [1, 2, 3, 4, 5], workingHoursPerDay: 4 }
const calendar = createWorkingCalendar(project)
const observations = []
function check(name, actual, expected) {
  assert.deepEqual(actual, expected, name)
  observations.push({ name, expected, actual, result: 'Pass' })
}
for (const [actualDate, expected] of [['2026-11-06', '2026-11-09'], ['2026-11-07', '2026-11-09'], ['2026-11-11', '2026-11-12'], ['2026-11-12', '2026-11-13'], ['2026-11-13', '2026-11-16']]) {
  check(`Existing calendar: strict date-after ${actualDate}`, calendar.firstSlotOnOrAfter(ordinalToDate(dateToOrdinal(actualDate) + 1)), { date: expected, hour: 1 })
}
check('M/Th/F gap after Monday2', createWorkingCalendar({ ...project, workingWeekdays: [1, 4, 5] }).firstSlotOnOrAfter('2026-11-03'), { date: '2026-11-05', hour: 1 })
check('Four planned slots starting Monday9', calendar.advanceWorkingSlots({ date: '2026-11-09', hour: 1 }, 4), { date: '2026-11-09', afterHour: 4 })
check('Known planned boundary releases next day', calendar.slotAfter({ date: '2026-11-09', afterHour: 4 }), { date: '2026-11-10', hour: 1 })
check('Twenty planned slots starting Monday9', calendar.advanceWorkingSlots({ date: '2026-11-09', hour: 1 }, 20), { date: '2026-11-13', afterHour: 4 })
const task = (taskId, predecessorTaskIds = []) => ({ taskId, name: taskId, description: '', durationHours: 4, predecessorTaskIds, independentStartMode: 'DEFAULT' })
const chain = calculateSchedule(project, [task('A'), task('B', ['A']), task('C', ['B'])])
assert.equal(chain.ok, true)
check('Legacy chain before review', chain.tasks.map(t => [t.taskId, t.startDate, t.finishDate]), [['A', '2026-11-02', '2026-11-02'], ['B', '2026-11-03', '2026-11-03'], ['C', '2026-11-04', '2026-11-04']])
const inactive = calculateSchedule(project, [task('A'), { ...task('B', ['A']), independentStartMode: 'MANUAL', requestedStartDate: '2026-11-09' }])
assert.equal(inactive.ok, true)
check('Current dependent manual date remains inactive', inactive.tasks.find(t => t.taskId === 'B').startDate, '2026-11-03')
check('Historical Nov2 to actual Nov6 means calendar days', dateToOrdinal('2026-11-06') - dateToOrdinal('2026-11-02'), 4)
await writeFile('docs/qa/wp7-4/evidence/calendar-anchors.json', JSON.stringify({ purpose: 'Existing calendar/WP1 checks only; no proposed workflow or scheduling implementation', sourceCommit: 'a5a953e820615e2b1105f235f0060c5831e335bf', observations }, null, 2) + '\n')
console.log(`PASS: ${observations.length} existing calendar/WP1 anchors; no Actual Start, transaction, revision evaluator or new file format implemented.`)
