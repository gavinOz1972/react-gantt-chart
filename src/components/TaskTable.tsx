import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ProjectSettings, ScheduleResult, TaskInput } from '../domain'
import { dependencyError } from './projectEntry'
import { InlineField } from './InlineField'
import { DependencyPicker } from './DependencyPicker'

export function TaskTable({ tasks, result, editingId, selectedTaskId, blocked, onEdit, onDelete, onSelect, project, manual = false, onMove, onDuplicate, onCommit, onDraftChange, renderRemaining }: {
  tasks: readonly TaskInput[]; result: ScheduleResult; editingId?: string; blocked: boolean
  selectedTaskId?: string | null; onSelect?: (id: string) => void
  onEdit: (task: TaskInput) => void; onDelete: (task: TaskInput) => void
  project?: ProjectSettings; manual?: boolean; onMove?: (id: string, before: string) => void
  onDuplicate?: (task: TaskInput) => void; onCommit?: (task: TaskInput) => string | undefined
  onDraftChange?: (key: string, dirty: boolean) => void
  renderRemaining?: (task: TaskInput) => ReactNode
}) {
  const scrollRegion = useRef<HTMLDivElement>(null)
  const dragging = useRef<string | null>(null)
  useEffect(() => { if (scrollRegion.current) scrollRegion.current.scrollLeft = 0 }, [editingId])
  const scheduled = new Map(result.ok ? result.tasks.map(task => [task.taskId, task]) : [])
  if (!tasks.length) return <div className="empty-state"><h3>Your project starts with one task</h3><p>Add your first task, enter its estimated hours, and see where it fits in your calendar.</p></div>
  function field(task: TaskInput, key: 'name' | 'description' | 'durationHours', type: 'text' | 'number' | 'multiline') {
    return onCommit ? <InlineField label={`${task.taskId} ${key === 'durationHours' ? 'duration' : key}`} value={String(task[key])} type={type} disabled={blocked}
      onDraftChange={dirty => onDraftChange?.(`${task.taskId}:${key}`, dirty)} onCommit={value => onCommit({ ...task, [key]: key === 'durationHours' ? Number(value) : value })} /> : task[key]
  }
  return <><p className="table-hint muted">Scroll the table horizontally to see all columns.</p>
    <div ref={scrollRegion} className="table-scroll" tabIndex={0} role="region" aria-label="Task schedule table" onDragOver={event => {
      if (!manual || blocked || !dragging.current) return
      event.preventDefault()
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientY < bounds.top + 45) event.currentTarget.scrollTop -= 18
      else if (event.clientY > bounds.bottom - 45) event.currentTarget.scrollTop += 18
    }}>
    <table className={renderRemaining ? 'task-table-with-effort' : undefined}><caption className="sr-only">Task inputs and calculated schedule dates. Select a field to edit; total hours is the full task duration.</caption><thead><tr>
      {onMove && <th scope="col">Order</th>}<th scope="col">ID</th><th scope="col">Task / description</th><th scope="col">Total hours</th>{renderRemaining && <th scope="col">Remaining Effort</th>}<th scope="col">Predecessors</th><th scope="col">Start</th><th scope="col">Calculated finish</th><th scope="col">Actions</th>
    </tr></thead><tbody>{tasks.map((task, index) => {
      const dates = scheduled.get(task.taskId)
      return <tr key={task.taskId} data-task-row={task.taskId} aria-label={`${task.taskId} ${task.name}`} aria-selected={selectedTaskId === task.taskId} className={`${editingId === task.taskId ? 'editing-row' : ''}${selectedTaskId === task.taskId ? ' selected-task-row' : ''}`}
        onClick={event => { if (!(event.target as HTMLElement).closest('button,input,textarea,select,a,label,.dependency-popover')) onSelect?.(task.taskId) }}
        onDragOver={event => { if (manual && !blocked && dragging.current) event.preventDefault() }}
        onDrop={event => { event.preventDefault(); if (manual && !blocked && dragging.current) onMove?.(dragging.current, task.taskId); dragging.current = null }}>
        {onMove && <td className="order-cell"><button type="button" className="quiet drag-handle" draggable={manual && !blocked} disabled={!manual || blocked} aria-label={`Drag ${task.taskId} to reorder`} title={manual ? 'Drag onto a row to place above it, or use Move up / Move down' : 'Choose Manual Order to rearrange tasks'}
          onDragStart={event => { dragging.current = task.taskId; event.dataTransfer.setData('text/plain', task.taskId); event.dataTransfer.effectAllowed = 'move' }} onDragEnd={() => { dragging.current = null }}><OrderIcon kind="grip" /></button>
          <div className="order-actions"><button type="button" className="quiet" disabled={!manual || blocked || index === 0} aria-label={`Move ${task.taskId} up`} onClick={() => onMove(task.taskId, tasks[index - 1].taskId)}><OrderIcon kind="up" /></button>
          <button type="button" className="quiet" disabled={!manual || blocked || index === tasks.length - 1} aria-label={`Move ${task.taskId} down`} onClick={() => onMove(tasks[index + 1].taskId, task.taskId)}><OrderIcon kind="down" /></button></div></td>}
        <th scope="row"><button type="button" className="task-id task-inspect" aria-label={`Select ${task.taskId} in chart`} onClick={() => onSelect?.(task.taskId)}>{task.taskId}</button></th>
        <td className="task-text">{field(task, 'name', 'text')}<div className="task-description">{field(task, 'description', 'multiline')}</div>
          <small>{task.predecessorTaskIds.length ? 'Dependency start' : task.independentStartMode === 'MANUAL' ? 'Manual start' : 'Follows project start'}{editingId === task.taskId ? ' · Unsaved preview' : ''}</small></td>
        <td>{field(task, 'durationHours', 'number')}</td>
        {renderRemaining && <td className="remaining-effort-cell">{renderRemaining(task)}</td>}
        <td>{onCommit && project ? <div className="inline-dependencies"><DependencyPicker taskId={task.taskId} tasks={tasks} selected={task.predecessorTaskIds} disabled={blocked} compact
          optionError={predecessors => dependencyError(project, tasks, task, predecessors)?.message} onDraftChange={dirty => onDraftChange?.(`${task.taskId}:predecessors`, dirty)}
          onCommit={predecessorTaskIds => onCommit({ ...task, predecessorTaskIds })} />
          {task.predecessorTaskIds.length > 0 && task.independentStartMode === 'MANUAL' && <><small>Retained independent date: {task.requestedStartDate}</small><ResetStart task={task} disabled={blocked} onCommit={onCommit} /></>}
          {task.predecessorTaskIds.length > 0 && <small>{task.predecessorTaskIds.map(id => `${id} — ${tasks.find(entry => entry.taskId === id)?.name ?? id}`).join('; ')}</small>}
        </div> : task.predecessorTaskIds.length ? task.predecessorTaskIds.map(id => `${id} — ${tasks.find(entry => entry.taskId === id)?.name ?? id}`).join('; ') : 'None'}</td>
        <td>{!task.predecessorTaskIds.length && onCommit && project ? <><InlineField label={`${task.taskId} independent start date`} type="date" disabled={blocked}
          value={task.independentStartMode === 'MANUAL' ? task.requestedStartDate : project.projectStartDate} display={task.independentStartMode === 'MANUAL' ? `Requested: ${task.requestedStartDate}` : 'Change start date'} onDraftChange={dirty => onDraftChange?.(`${task.taskId}:date`, dirty)}
          onCommit={value => onCommit({ ...task, independentStartMode: 'MANUAL', requestedStartDate: value })} />
          {task.independentStartMode === 'MANUAL' && <ResetStart task={task} disabled={blocked} onCommit={onCommit} />}</> : null}
          {dates ? <><span>{dates.startDate}</span><small>hour {dates.startSlot.hour} that day</small></> : <span className="muted">Unavailable</span>}</td>
        <td>{dates ? <><span>{dates.finishDate}</span><small>after hour {dates.finishBoundary.afterHour} that day</small></> : <span className="muted">Unavailable</span>}</td>
        <td><div className="row-actions">{onDuplicate && <button type="button" className="quiet" disabled={blocked} onClick={() => onDuplicate(task)} aria-label={`Duplicate ${task.taskId}`}>Duplicate</button>}
          <button type="button" className="quiet" disabled={blocked} onClick={() => onEdit(task)} aria-label={`Edit ${task.taskId}`} title="Open full task form">Edit form</button>
          <button type="button" className="danger-text" disabled={blocked} onClick={() => onDelete(task)} aria-label={`Delete ${task.taskId}`}>Delete</button></div></td>
      </tr>
    })}</tbody></table></div></>
}

function OrderIcon({ kind }: { kind: 'grip' | 'up' | 'down' }) {
  return <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false" style={{ pointerEvents: 'none' }}>
    {kind === 'grip'
      ? <g fill="currentColor">{[4, 8, 12].flatMap(y => [5, 11].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" />))}</g>
      : <path d={kind === 'up' ? 'M8 13V3M3 8l5-5 5 5' : 'M8 3v10M3 8l5 5 5-5'} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
}

function ResetStart({ task, disabled, onCommit }: { task: TaskInput; disabled: boolean; onCommit: (task: TaskInput) => string | undefined }) {
  const [error, setError] = useState('')
  return <><button className="quiet inline-reset" type="button" disabled={disabled} aria-label={`Reset ${task.taskId} to Project Start`} onClick={() => setError(onCommit({ taskId: task.taskId, name: task.name, description: task.description, durationHours: task.durationHours, predecessorTaskIds: task.predecessorTaskIds, independentStartMode: 'DEFAULT' }) ?? '')}>Reset to Project Start</button>{error && <span role="alert" className="field-error">{error}</span>}</>
}
