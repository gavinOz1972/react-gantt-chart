import { TASK_STATUSES } from '../../progress/taskProgress'
import type { TaskStatus } from '../../progress/taskProgress'

export function TaskStatusControl({ taskId, value, disabled, context = 'table', onRequest }: {
  taskId: string; value: TaskStatus; disabled: boolean; context?: 'table' | 'details' | 'chart'
  onRequest: (target: TaskStatus, trigger: HTMLSelectElement) => void
}) {
  return <select className="task-status-control" aria-label={`${taskId} status in ${context}`} value={value} disabled={disabled} onChange={event => onRequest(event.target.value as TaskStatus, event.currentTarget)}>
    {TASK_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
  </select>
}
