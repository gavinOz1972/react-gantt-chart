import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

// Test tooling only: load the existing pure TS modules in memory, never alter
// production imports, dependencies, scripts or the accepted forecast mathematics.
const loader = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
const { studentInputs, studentFile, legacyStudentFile, forecastAssumptions } = await loader.ssrLoadModule('/tests/wp71/studentFixture.ts')
const { calculateSchedule, analyzeCriticalPath } = await loader.ssrLoadModule('/src/domain/index.ts')
const { forecastSchedule } = await loader.ssrLoadModule('/src/forecast/forecast.ts')
await loader.close()
const directory = 'tests/fixtures/wp71'
await mkdir(directory, { recursive: true })
const write = (name, data) => writeFile(`${directory}/${name}.json`, JSON.stringify(data, null, 2) + '\n')
const evidence = {}
for (const count of [30, 40]) {
  const inputs = studentInputs(count)
  const schedule = calculateSchedule(inputs.project, inputs.tasks)
  assert.equal(schedule.ok, true)
  const critical = analyzeCriticalPath(inputs.project, inputs.tasks, schedule)
  assert.equal(critical.ok, true)
  const file = studentFile({ count })
  const forecast = forecastSchedule({ ...inputs, settings: forecastAssumptions, today: '2026-11-02', remainingHours: file.workTracking.remainingHours })
  const hours = inputs.tasks.reduce((sum, task) => sum + task.durationHours, 0)
  assert.equal(hours, count === 30 ? 181 : 226)
  assert.equal(schedule.projectCompletion.date, count === 30 ? '2026-12-15' : '2027-01-04')
  assert.equal(schedule.projectCompletion.afterHour, count === 30 ? 3 : 4)
  assert.equal(forecast.forecastFinish, count === 30 ? '2026-12-18' : '2026-12-28')
  const byId = Object.fromEntries(schedule.tasks.map(task => [task.taskId, task]))
  for (const [id, finishDate, afterHour] of [['T1', '2026-11-02', 4], ['T2', '2026-11-05', 2], ['T5', '2026-11-05', 2], ['T12', '2026-11-13', 2], ['T25', '2026-11-19', 3]]) {
    assert.equal(byId[id].finishDate, finishDate); assert.equal(byId[id].finishBoundary.afterHour, afterHour)
  }
  evidence[count] = { totalHours: hours, taskCount: count, committedCompletion: schedule.projectCompletion, forecastCompletion: forecast.forecastFinish,
    weeklyCapacity: forecast.weeklyCapacity, targetDays: forecast.targetDays, targetCapacity: forecast.capacityThroughTarget,
    criticalTaskIds: critical.tasks.filter(task => task.critical).map(task => task.taskId), schedule: schedule.tasks }
  await write(count === 30 ? 'student-30-prepared' : 'student-40-performance', file)
}
await write('student-30-create', studentFile({ baseline: false, estimates: false }))
for (const version of [1, 2, 3, 4]) await write(`legacy-format-${version}`, legacyStudentFile(version))
await write('expected-anchors', evidence)
console.log(JSON.stringify(evidence, (key, value) => key === 'schedule' ? undefined : value, 2))
