import { establishBaseline } from '../baseline/baseline'
import type { ProjectData } from '../persistence/projectFile'
import type { WorkEntry, WorkTracking } from '../workTracking/workTracking'

export const workTimestamp = '2026-10-31T21:00:00.000Z'
export const workData: ProjectData = {
  project: { projectId: 'WORK-REVIEW', name: 'Actual work review', projectStartDate: '2026-11-02', targetEndDate: '2026-12-18', workingWeekdays: [1, 4, 5], workingHoursPerDay: 3 },
  tasks: [
    { taskId: 'T2', name: 'Research', description: 'Approved eight-hour estimate', durationHours: 8, predecessorTaskIds: [], independentStartMode: 'DEFAULT' },
    { taskId: 'T9', name: 'Publish', description: 'Keep this dependent schedule', durationHours: 2, predecessorTaskIds: ['T2'], independentStartMode: 'MANUAL', requestedStartDate: '2026-11-12' },
  ], nextTaskNumber: 20, manualOrder: ['T9', 'T2'], sortMode: 'manual', duplicateOrigins: {},
}
export function workBaseline() {
  const created = establishBaseline(workData, 'BL-WORK', workTimestamp)
  if (!created.ok) throw new Error(JSON.stringify(created.errors))
  return created.value
}
export const workEntry = (entryId = 'W-1', hours = 2.25, workDate = '2026-10-28', taskId = 'T2'): WorkEntry => ({
  entryId, taskId, workDate, hours, contributor: 'Alex Student', description: 'Reviewed sources and wrote notes', createdAt: workTimestamp, updatedAt: workTimestamp,
})
export const workRecords = (): WorkTracking => ({ schemaVersion: 1, entries: [workEntry(), workEntry('W-2', 3.5, '2026-10-29')], remainingHours: { T2: 5, T9: null } })
