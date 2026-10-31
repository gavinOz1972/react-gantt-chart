import { useEffect, useRef } from 'react'
import type { ScheduleResult, TaskInput } from '../domain'

export function TaskTable({ tasks, result, editingId, blocked, onEdit, onDelete }: {
  tasks: readonly TaskInput[]; result: ScheduleResult; editingId?: string; blocked: boolean
  onEdit: (task: TaskInput) => void; onDelete: (task: TaskInput) => void
}) {
  const scrollRegion = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scrollRegion.current) scrollRegion.current.scrollLeft = 0
  }, [editingId])
  const scheduled = new Map(result.ok ? result.tasks.map(task => [task.taskId, task]) : [])
  if (!tasks.length) return <div className="empty-state"><h3>Your project starts with one task</h3><p>Add your first task, enter its estimated hours, and see where it fits in your calendar.</p></div>
  return <><p className="table-hint muted">Scroll the table horizontally to see all columns.</p><div ref={scrollRegion} className="table-scroll" tabIndex={0} role="region" aria-label="Task schedule table">
    <table><caption className="sr-only">Task inputs and calculated schedule dates</caption><thead><tr>
      <th scope="col">ID</th><th scope="col">Task</th><th scope="col">Hours</th><th scope="col">Predecessors</th><th scope="col">Calculated start</th><th scope="col">Calculated finish</th><th scope="col">Actions</th>
    </tr></thead><tbody>{tasks.map(task => {
      const dates = scheduled.get(task.taskId)
      return <tr key={task.taskId} aria-label={`${task.taskId} ${task.name}`} className={editingId === task.taskId ? 'editing-row' : undefined}>
        <th scope="row"><span className="task-id">{task.taskId}</span></th>
        <td><strong>{task.name || 'Untitled task'}</strong>{task.description && <small className="task-description">{task.description}</small>}
          <small>{task.predecessorTaskIds.length ? 'Dependency start' : task.independentStartMode === 'MANUAL' ? 'Manual start' : 'Follows project start'}{editingId === task.taskId ? ' · Unsaved preview' : ''}</small></td>
        <td>{Number.isFinite(task.durationHours) ? task.durationHours : '—'}</td>
        <td>{task.predecessorTaskIds.length ? task.predecessorTaskIds.map(id => `${id} — ${tasks.find(entry => entry.taskId === id)?.name ?? id}`).join('; ') : 'None'}</td>
        <td>{dates ? <><span>{dates.startDate}</span><small>hour {dates.startSlot.hour}</small></> : <span className="muted">Unavailable</span>}</td>
        <td>{dates ? <><span>{dates.finishDate}</span><small>after hour {dates.finishBoundary.afterHour}</small></> : <span className="muted">Unavailable</span>}</td>
        <td><div className="row-actions"><button type="button" className="quiet" disabled={blocked} onClick={() => onEdit(task)} aria-label={`Edit ${task.taskId}`}>Edit</button>
          <button type="button" className="danger-text" disabled={blocked} onClick={() => onDelete(task)} aria-label={`Delete ${task.taskId}`}>Delete</button></div></td>
      </tr>
    })}</tbody></table>
  </div></>
}
