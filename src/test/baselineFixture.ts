import { establishBaseline } from '../baseline/baseline'

export const baselineInputs = {
  project: { projectId: 'BASELINE-TEST', name: 'Approved student plan', projectStartDate: '2026-11-02', targetEndDate: '2026-11-02', workingWeekdays: [1, 4, 5], workingHoursPerDay: 3 },
  tasks: [
    { taskId: 'T2', name: 'Research', description: 'Original notes', durationHours: 5, predecessorTaskIds: [], independentStartMode: 'DEFAULT' },
    { taskId: 'T9', name: 'Parallel', description: '', durationHours: 2, predecessorTaskIds: [], independentStartMode: 'MANUAL', requestedStartDate: '2026-11-05' },
    { taskId: 'T15', name: 'Join', description: 'Retain manual date while dependent', durationHours: 1, predecessorTaskIds: ['T2', 'T9'], independentStartMode: 'MANUAL', requestedStartDate: '2026-11-12' },
  ], nextTaskNumber: 20, manualOrder: ['T15', 'T2', 'T9'], sortMode: 'duration', duplicateOrigins: {},
}
export const establishedAt = '2026-10-31T20:00:00.000Z'
export function snapshot() {
  const result = establishBaseline(baselineInputs, 'BL-TEST', establishedAt)
  if (!result.ok) throw new Error(JSON.stringify(result.errors))
  return result.value
}
