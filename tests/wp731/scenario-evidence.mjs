// Diagnostic evidence only. This is NOT a progress-adjusted scheduler.
// Committed schedules and manually supplied candidate starts/finishes are
// checked against existing utilities and an independent, written calendar table.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

const loader = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
const domain = await loader.ssrLoadModule('/src/domain/index.ts')
const progress = await loader.ssrLoadModule('/src/progress/taskProgress.ts')
const persistence = await loader.ssrLoadModule('/src/persistence/projectFile.ts')
const baseline = await loader.ssrLoadModule('/src/baseline/baseline.ts')
const forecast = await loader.ssrLoadModule('/src/forecast/forecast.ts')
await loader.close()

// Independent hand-written date tables, not generated with production helpers.
const dates = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20']
const fourDays = ['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06', '2026-11-09', '2026-11-10', '2026-11-12', '2026-11-13', '2026-11-16', '2026-11-17']
const tasks = (...rows) => rows.map(([id, hours, predecessors = [], manual]) => ({ taskId: id, name: `WP731 DISPOSABLE ${id}`, description: 'Fictional diagnostic task; not owner data.', durationHours: hours, predecessorTaskIds: predecessors, ...(manual ? { independentStartMode: 'MANUAL', requestedStartDate: manual } : { independentStartMode: 'DEFAULT' }) }))
const ab = () => tasks(['T1', 4], ['T2', 4, ['T1']])
const chain = () => tasks(['T1', 4], ['T2', 4, ['T1']], ['T3', 4, ['T2']])
const common = { asOf: '2026-11-03', tasks: ab(), c: { T1: [0, 4], T2: [4, 8] }, actual: { T1: ['2026-11-03', '2026-11-02'] }, p: { T2: [8, 12] }, projectDate: '2026-11-04' }
const cases = [
  { ...common, id: 'L01', asOf: '2026-11-02', actual: { T1: ['2026-11-02', '2026-11-02'] }, p: { T2: [4, 8] }, projectDate: '2026-11-03' },
  { ...common, id: 'L01b', asOf: '2026-11-02', tasks: tasks(['T1', 2], ['T2', 2, ['T1']]), c: { T1: [0, 2], T2: [2, 4] }, actual: { T1: ['2026-11-02', '2026-11-02'] }, p: { T2: [4, 6] }, projectDate: '2026-11-03', note: 'Precision-only conservative shift; no historically late date and no proof of actual delay.' },
  { ...common, id: 'L02', tasks: tasks(['T1', 4]), c: { T1: [0, 4] }, p: {}, projectDate: '2026-11-03', note: 'All tasks Complete; actual project finish date, not a projected slot.' },
  { ...common, id: 'L03', asOf: '2026-11-04', actual: { T1: ['2026-11-04', '2026-11-02'] }, p: { T2: [12, 16] }, projectDate: '2026-11-05' },
  { ...common, id: 'L04', asOf: '2026-11-04', tasks: chain(), c: { T1: [0, 4], T2: [4, 8], T3: [8, 12] }, actual: { T1: ['2026-11-04', '2026-11-02'] }, p: { T2: [12, 16], T3: [16, 20] }, projectDate: '2026-11-06' },
  { ...common, id: 'L05', tasks: tasks(['T1', 4], ['T2', 4, ['T1']], ['T3', 12, [], '2026-11-03']), c: { T1: [0, 4], T2: [4, 8], T3: [4, 16] }, p: { T2: [8, 12], T3: [4, 16] }, projectDate: '2026-11-05' },
  { ...common, id: 'L06', tasks: tasks(['T1', 4], ['T2', 8], ['T3', 4, ['T1', 'T2']]), c: { T1: [0, 4], T2: [0, 8], T3: [8, 12] }, actual: { T1: ['2026-11-03', '2026-11-02'], T2: ['2026-11-03', '2026-11-03'] }, p: { T3: [8, 12] }, projectDate: '2026-11-04' },
  { ...common, id: 'L07', tasks: tasks(['T1', 4], ['T2', 4, ['T1']], ['T3', 8, [], '2026-11-03'], ['T4', 4, ['T2', 'T3']]), c: { T1: [0, 4], T2: [4, 8], T3: [4, 12], T4: [12, 16] }, p: { T2: [8, 12], T3: [4, 12], T4: [12, 16] }, projectDate: '2026-11-05' },
  { ...common, id: 'L08', asOf: '2026-11-04', tasks: tasks(['T1', 4], ['T2', 4, ['T1']], ['T3', 8, [], '2026-11-03']), c: { T1: [0, 4], T2: [4, 8], T3: [4, 12] }, actual: { T1: ['2026-11-04', '2026-11-02'], T3: ['2026-11-04', '2026-11-04'] }, p: { T2: [12, 16] }, projectDate: '2026-11-05' },
  { ...common, id: 'L09', tasks: tasks(['T1', 4], ['T2', 8, ['T1']]), c: { T1: [0, 4], T2: [4, 12] }, states: { T2: 'In Progress' }, p: { T2: null }, projectDate: null, note: 'No actual start or remaining scheduled-slot duration. Known remaining person-hours do not fill this gap.' },
  { ...common, id: 'L10', tasks: chain(), c: { T1: [0, 4], T2: [4, 8], T3: [8, 12] }, actual: { T1: ['2026-11-03', '2026-11-02'], T2: ['2026-11-02', '2026-11-03'] }, p: { T3: [8, 12] }, projectDate: null, conditionalDate: '2026-11-04', note: 'B completed before predecessor A: definite historical ordering conflict; do not certify overall feasibility.' },
  { ...common, id: 'L11', asOf: '2026-11-04', tasks: tasks(['T1', 4], ['T2', 4, ['T1'], '2026-11-03']), actual: { T1: ['2026-11-04', '2026-11-02'] }, p: { T2: [12, 16] }, projectDate: '2026-11-05', note: 'Retained manual date is inactive while predecessors control the start.' },
  { ...common, id: 'L11b', asOf: '2026-11-04', tasks: tasks(['T1', 4], ['T2', 4, [], '2026-11-03']), actual: { T1: ['2026-11-04', '2026-11-02'] }, p: { T2: [8, 12] }, projectDate: '2026-11-04', note: 'Active independent not-before release is superseded by As-of; no dependency from T1 to T2.' },
  { ...common, id: 'L12', asOf: '2026-11-07', tasks: tasks(['T1', 20], ['T2', 4, ['T1']]), c: { T1: [0, 20], T2: [20, 24] }, actual: { T1: ['2026-11-07', '2026-11-06'] }, p: { T2: [20, 24] }, projectDate: '2026-11-09' },
  { ...common, id: 'L12b', asOf: '2026-11-04', fourDays: true, tasks: tasks(['T1', 8], ['T2', 4, ['T1']]), c: { T1: [0, 8], T2: [8, 12] }, actual: { T1: ['2026-11-04', '2026-11-03'] }, p: { T2: [8, 12] }, projectDate: '2026-11-05' },
  { ...common, id: 'L13', asOf: '2026-11-04', reopen: 'T1', p: { T1: null, T2: null }, projectDate: null, note: 'Previous actual completion is history, not the current dependency release.' },
  { ...common, id: 'L14', actual: { T1: ['2026-11-03', null] }, note: 'Legacy completion has no committed-finish-at-completion snapshot; historical lateness is unknown, current-plan impact can still be bounded.' },
  { ...common, id: 'L14b', actual: {}, states: { T1: 'Blocked' }, p: { T1: null, T2: null }, projectDate: null, note: 'No restart date; do not treat blocked work as ready.' },
  { ...common, id: 'L14c', actual: {}, invalidComplete: true, p: { T1: null, T2: null }, projectDate: null, note: 'Complete without a completion event is rejected by the existing decoder, not repaired.' },
  { ...common, id: 'L14d', actual: { T1: ['2026-11-05', '2026-11-02'] }, p: { T2: null }, projectDate: null, note: 'Future-effective completion relative to As-of is scenario evidence, not a validated actual fact yet.' },
  { ...common, id: 'L14e', actual: {}, states: { T1: 'In Progress' }, zeroRemaining: true, p: { T1: null, T2: null }, projectDate: null, note: 'Zero remaining person-hours does not provide completion or a remaining scheduled-slot duration.' },
  { ...common, id: 'L15', asOf: '2026-11-04', actual: { T1: ['2026-11-04', '2026-11-02'] }, p: { T2: [12, 16] }, projectDate: '2026-11-05' },
  { ...common, id: 'L16', asOf: '2026-11-04', actual: { T1: ['2026-11-04', '2026-11-02'] }, p: { T2: [12, 16] }, projectDate: '2026-11-05' },
]

const evidence = []
for (const item of cases) {
  const table = item.fourDays ? fourDays : dates
  const paperStart = index => ({ date: table[Math.floor(index / 4)], hour: index % 4 + 1 })
  const paperFinish = index => ({ date: table[Math.floor((index - 1) / 4)], afterHour: (index - 1) % 4 + 1 })
  const project = { projectId: `WP731-${item.id}`, name: `WP731 DISPOSABLE ${item.id}`, projectStartDate: '2026-11-02', targetEndDate: '2026-11-20', workingWeekdays: item.fourDays ? [1, 2, 4, 5] : [1, 2, 3, 4, 5], workingHoursPerDay: 4 }
  const inputs = { project, tasks: item.tasks, nextTaskNumber: item.tasks.length + 1, manualOrder: item.tasks.map(task => task.taskId), sortMode: 'manual', duplicateOrigins: {} }
  const schedule = domain.calculateSchedule(project, item.tasks)
  assert.equal(schedule.ok, true, item.id)
  const calendar = domain.createWorkingCalendar(project), time = domain.createWorkingTimeIndex(project)
  const byId = new Map(schedule.tasks.map(task => [task.taskId, task]))
  for (const [id, [start, end]] of Object.entries(item.c)) {
    assert.deepEqual(byId.get(id).startSlot, paperStart(start), `${item.id} committed ${id} start`)
    assert.deepEqual(byId.get(id).finishBoundary, paperFinish(end), `${item.id} committed ${id} finish`)
  }
  let tracking = progress.emptyProgress(), sequence = 0
  function transition(id, toStatus, date, extra = {}) {
    const changed = progress.transitionTask(tracking, id, { target: toStatus, eventId: `${item.id}-E${++sequence}`, date, recordedAt: '2026-11-10T12:00:00.000Z', ...extra }, item.tasks.map(task => task.taskId))
    assert.equal(changed.ok, true, `${item.id} transition`); tracking = changed.value
  }
  for (const [id, [date, reference]] of Object.entries(item.actual)) transition(id, 'Complete', date, { completionAcknowledged: true, noCriteriaAcknowledged: true, ...(reference ? { committedFinishDateAtCompletion: reference } : {}) })
  for (const [id, state] of Object.entries(item.states ?? {})) transition(id, state, item.asOf, ...(state === 'Blocked' ? [{ reason: 'No known restart date in this diagnostic.' }] : []))
  if (item.reopen) transition(item.reopen, 'In Progress', item.asOf, { reason: 'Deliberately reopened; no remaining working-slot duration exists.', reopenAcknowledged: true })
  if (item.invalidComplete) {
    const invalid = progress.decodeProgress({ ...tracking, tasks: { T1: { status: 'Complete', criteria: [] } } }, item.tasks.map(task => task.taskId))
    assert.equal(invalid.ok, false)
    evidence.push({ ...item, decoderRejected: true, errors: invalid.errors, committed: schedule.tasks }); continue
  }
  const frozen = baseline.establishBaseline(inputs, `BL-${item.id}`, '2026-11-01T12:00:00.000Z')
  assert.equal(frozen.ok, true)
  const file = persistence.createProjectFile({ ...inputs, baseline: frozen.value, taskProgress: tracking, workTracking: { schemaVersion: 1, entries: [], remainingHours: Object.fromEntries(item.tasks.map(task => [task.taskId, item.zeroRemaining ? 0 : task.durationHours])) }, forecastSettings: { schemaVersion: 1, enabled: true, classHoursPerStudent: 28, homeworkHoursPerStudent: 0, teamSize: 1, asOfDate: item.asOf } }, '2026-11-10T12:00:00.000Z')
  assert.equal(file.ok, true)
  const before = JSON.stringify(file.value), candidates = {}
  for (const [id, pair] of Object.entries(item.p)) {
    if (!pair) { candidates[id] = { start: null, finish: null, uncertainty: item.note }; continue }
    const [start, end] = pair, task = item.tasks.find(task => task.taskId === id)
    assert.equal(end - start, task.durationHours, `${item.id} full committed duration ${id}`)
    assert.deepEqual(calendar.advanceWorkingSlots(paperStart(start), task.durationHours), paperFinish(end), `${item.id} candidate finish ${id}`)
    const candidateIndex = time.startIndex(paperStart(start))
    const requiredBounds = [time.startIndex(byId.get(id).startSlot), time.startIndex(calendar.firstSlotOnOrAfter(item.asOf))]
    assert.equal(candidateIndex - time.startIndex(calendar.firstSlotOnOrAfter(project.projectStartDate)), BigInt(start))
    assert.ok(candidateIndex >= time.startIndex(byId.get(id).startSlot), `${item.id} no pull-forward`)
    assert.ok(candidateIndex >= time.startIndex(calendar.firstSlotOnOrAfter(item.asOf)), `${item.id} As-of floor`)
    for (const pred of task.predecessorTaskIds) {
      const actual = item.actual[pred]
      if (actual && pred !== item.reopen) {
        const afterDate = domain.ordinalToDate(domain.dateToOrdinal(actual[0]) + 1)
        const release = calendar.firstSlotOnOrAfter(afterDate)
        assert.ok(time.startIndex(release) <= candidateIndex, `${item.id} date-only conservative release`)
        requiredBounds.push(time.startIndex(release))
      } else if (item.p[pred]) {
        assert.ok(item.p[pred][1] <= start, `${item.id} candidate predecessor boundary`)
        requiredBounds.push(time.startIndex(paperStart(item.p[pred][1])))
      }
    }
    // Verify a supplied answer meets exactly the proposed max-bound rule;
    // never synthesize a projection for an arbitrary project.
    assert.equal(candidateIndex, requiredBounds.reduce((a, b) => a > b ? a : b), `${item.id} hand answer is earliest under the stated rules`)
    candidates[id] = { start: paperStart(start), finish: paperFinish(end) }
  }
  const critical = domain.analyzeCriticalPath(project, item.tasks, schedule)
  assert.equal(critical.ok, true)
  const result = { id: item.id, asOf: item.asOf, inputs: { project, tasks: item.tasks }, progress: tracking, committed: schedule.tasks, committedProjectFinish: schedule.projectCompletion, committedCriticalIds: critical.tasks.filter(task => task.critical).map(task => task.taskId), committedSlack: Object.fromEntries(critical.tasks.map(task => [task.taskId, task.totalSlackHours])), manuallySpecifiedCandidate: candidates, expectedProjectDate: item.projectDate, conditionalDate: item.conditionalDate ?? null, note: item.note ?? '', baselineAndSourceUnchanged: true }
  if (item.projectDate || item.conditionalDate) {
    const givenDates = Object.values(candidates).filter(task => task.finish).map(task => task.finish.date)
    for (const [id, [date]] of Object.entries(item.actual)) if (progress.progressForTask(tracking, id).status === 'Complete') givenDates.push(date)
    assert.equal(givenDates.sort().at(-1), item.projectDate ?? item.conditionalDate, `${item.id} project date aggregation of hand answers`)
  }
  if (item.id === 'L15') {
    const effort = forecast.forecastSchedule({ ...inputs, progress: tracking, remainingHours: file.value.workTracking.remainingHours, settings: file.value.forecastSettings, today: item.asOf })
    assert.equal(effort.tasks.find(task => task.taskId === 'T2').forecastFinish, '2026-11-04')
    result.effortModelT2Finish = '2026-11-04'; result.proposedProgressAdjustedT2Finish = '2026-11-05'; result.overlayCombinationsSpecified = 8
  }
  if (item.id === 'L16') {
    const loaded = persistence.parseProject(persistence.serializeProject(file.value))
    assert.equal(loaded.ok, true); assert.deepEqual(loaded.value, file.value)
    result.exactRoundTrip = true; result.fixedAsOfRequiredForReproduction = item.asOf
  }
  assert.equal(JSON.stringify(file.value), before, `${item.id} mutation check`)
  assert.deepEqual(domain.calculateSchedule(project, item.tasks), schedule)
  evidence.push(result)
}
const directory = 'docs/qa/wp7-3-1/evidence'
await mkdir(directory, { recursive: true })
await writeFile(`${directory}/scenario-evidence.json`, JSON.stringify({ method: 'Hand-specified candidate starts/finishes and independent calendar lookup tables; existing production utilities only check anchors and invariants. No projection algorithm is implemented.', capturedAtUTC: new Date().toISOString(), scenarioCount: 16, caseCount: cases.length, cases: evidence }, null, 2) + '\n')
console.log(`PASS: ${cases.length} hand-specified cases cover L01-L16; committed anchors, candidate calendar arithmetic, source invariants, legacy event gaps and fixed-input save/reload checked. No production projection implemented.`)
