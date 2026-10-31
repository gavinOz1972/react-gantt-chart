import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export const task = (id: number, durationHours = 3, predecessors: number[] = []) => ({ taskId: `T${id}`, name: `Task ${id}`, description: '', durationHours, predecessorTaskIds: predecessors.map(value => `T${value}`), independentStartMode: 'DEFAULT' })
export const longPlan = {
  format: 'react-gantt-chart', schemaVersion: 1, createdBy: 'React Gantt Chart', savedAt: '2026-10-31T12:00:00.000Z',
  project: { projectId: 'WP5-2-LONG', name: 'Long visualization review', projectStartDate: '2026-11-04', targetEndDate: '2027-02-05', workingWeekdays: [1, 4, 5], workingHoursPerDay: 3 },
  tasks: [task(1, 81), task(2, 36), task(3, 9, [1, 2])], nextTaskNumber: 4,
}
export const networkPlan = { ...longPlan, project: { ...longPlan.project, projectId: 'WP5-2-NETWORK', name: 'Network navigation review' },
  tasks: [task(1, 5), task(2, 2), task(3, 3, [1]), task(4, 1, [1]), task(5, 2, [2]), task(6, 2, [3, 4]), task(7, 1, [5, 6])], nextTaskNumber: 8 }
export async function openPlan(page: Page, plan: unknown = longPlan) {
  await page.goto('/')
  await page.getByLabel('Import project JSON', { exact: true }).setInputFiles({ name: 'visualization-review.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(plan)) })
  await expect(page.getByRole('tab', { name: 'Workspace', exact: true })).toHaveAttribute('aria-selected', 'true')
}
