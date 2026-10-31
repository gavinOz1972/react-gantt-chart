import { useEffect, useRef, useState } from 'react'
import { calculateSchedule } from './domain'
import type { TaskInput } from './domain'
import { EntryErrors } from './components/EntryErrors'
import { ProjectSettingsForm } from './components/ProjectSettingsForm'
import { TaskEditor } from './components/TaskEditor'
import { TaskTable } from './components/TaskTable'
import { DeleteTaskDialog } from './components/DeleteTaskDialog'
import { dependencyError, initialProject, newTask, projectFromDraft, projectToDraft, removeTaskAndLinks, replaceTask, taskFromDraft, taskToDraft } from './components/projectEntry'
import type { ProjectDraft, TaskDraft } from './components/projectEntry'

function App() {
  const [project, setProject] = useState(initialProject)
  const [projectDraft, setProjectDraft] = useState(() => projectToDraft(initialProject))
  const [tasks, setTasks] = useState<readonly TaskInput[]>([])
  const [nextId, setNextId] = useState(1)
  const [editor, setEditor] = useState<TaskDraft | null>(null)
  const [linkError, setLinkError] = useState('')
  const [deleting, setDeleting] = useState<TaskInput | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')
  const addButton = useRef<HTMLButtonElement>(null)
  const restoreEditorFocus = useRef(false)
  useEffect(() => {
    if (!editor && restoreEditorFocus.current) {
      addButton.current?.focus()
      restoreEditorFocus.current = false
    }
  }, [editor, deleting])

  const proposedProject = projectFromDraft(project.projectId, projectDraft)
  const proposedTasks = editor ? replaceTask(tasks, taskFromDraft(editor)) : tasks
  const result = calculateSchedule(proposedProject, proposedTasks)
  const errors = result.ok ? [] : result.errors
  const projectDirty = JSON.stringify(projectDraft) !== JSON.stringify(projectToDraft(project))
  const isNew = !!editor && !tasks.some(task => task.taskId === editor.taskId)
  const completion = result.ok ? result.projectCompletion : null
  const previewing = !!editor || projectDirty

  function commitProject(draft: ProjectDraft) {
    const candidate = projectFromDraft(project.projectId, draft)
    if (calculateSchedule(candidate, tasks).ok) {
      setProject(candidate)
      setNotice('Project settings updated.')
    }
  }

  function startEditing(task: TaskInput) {
    setProject(proposedProject)
    setEditor(taskToDraft(task))
    setLinkError('')
    setNotice('')
  }

  function changeEditor(draft: TaskDraft) {
    setEditor(draft)
    setLinkError('')
  }

  function predecessorProblem(id: string) {
    if (!editor) return undefined
    const seed = tasks.find(task => task.taskId === editor.taskId) ?? newTask(editor.taskId)
    return dependencyError(project, tasks, seed, [...editor.predecessorTaskIds, id])?.message
  }

  function togglePredecessor(id: string) {
    if (!editor) return
    const predecessors = editor.predecessorTaskIds.includes(id)
      ? editor.predecessorTaskIds.filter(value => value !== id) : [...editor.predecessorTaskIds, id]
    const seed = tasks.find(task => task.taskId === editor.taskId) ?? newTask(editor.taskId)
    const problem = dependencyError(project, tasks, seed, predecessors)
    if (problem) { setLinkError(problem.message); return }
    changeEditor({ ...editor, predecessorTaskIds: predecessors })
  }

  function closeEditor(message: string) {
    restoreEditorFocus.current = true
    setEditor(null)
    setLinkError('')
    setNotice(message)
  }

  function saveTask() {
    if (!editor || !result.ok) return
    setTasks(proposedTasks)
    if (isNew) setNextId(nextId + 1)
    closeEditor(`${editor.taskId} saved. Schedule updated.`)
  }

  function confirmDelete() {
    if (!deleting) return
    const candidate = removeTaskAndLinks(tasks, deleting.taskId)
    const checked = calculateSchedule(project, candidate)
    if (!checked.ok) {
      setDeleteError(`Task kept. ${checked.errors.map(error => `${error.taskId ?? 'Project'}: ${error.message}`).join(' ')} Edit the affected task's retained independent start or project settings first.`)
      return
    }
    setTasks(candidate)
    restoreEditorFocus.current = true
    setNotice(`${deleting.taskId} deleted. Other tasks were kept and recalculated.`)
    setDeleting(null)
  }

  return <main>
    <header className="page-header"><div><span className="eyebrow">Project planner</span><h1>React Gantt Chart</h1>
      <p>Set your working calendar, connect your tasks, and see your schedule take shape.</p></div><span className="phase-label">Project & task entry</span></header>
    <p className="session-note">This project is kept in this tab only. Reloading or closing the page clears your entries.</p>
    <ProjectSettingsForm draft={projectDraft} errors={errors} disabled={!!editor} dirty={projectDirty} onChange={setProjectDraft}
      onCommit={commitProject} onRevert={() => { setProjectDraft(projectToDraft(project)); setNotice('Saved project settings restored.') }} />
    <section className="summary-panel" aria-labelledby="summary-heading">
      <div className="section-heading"><h2 id="summary-heading">Project overview</h2><span className={result.ok ? 'status-label' : 'status-label invalid'}>{!result.ok ? 'Needs attention' : previewing ? 'Unsaved preview' : 'Schedule current'}</span></div>
      <dl className="summary-grid">
        <div><dt>Tasks{editor ? ' (preview)' : ''}</dt><dd>{proposedTasks.length}</dd></div>
        <div><dt>Calculated completion</dt><dd>{!result.ok ? 'Unavailable' : completion ? <>{completion.date}<small>after hour {completion.afterHour}</small></> : 'No tasks yet'}</dd></div>
        <div><dt>Target end date</dt><dd>{proposedProject.targetEndDate || 'Not set'}</dd></div>
        <div><dt>Target status</dt><dd>{!result.ok ? 'Unavailable' : !completion ? 'Add tasks to compare' : completion.date <= proposedProject.targetEndDate ? <span className="on-time">On time</span> : <span className="late">Late</span>}</dd></div>
      </dl><p className="summary-help">Target is the end of the selected date. Independent tasks may overlap; hours are working slots, not clock times.</p>
    </section>
    <EntryErrors errors={errors} />
    {editor && <TaskEditor key={editor.taskId} draft={editor} isNew={isNew} tasks={tasks} projectStartDate={project.projectStartDate}
      scheduled={result.ok ? result.tasks.find(task => task.taskId === editor.taskId) : undefined} errors={errors} linkError={linkError}
      optionError={predecessorProblem} onChange={changeEditor} onToggle={togglePredecessor} onSave={saveTask} onCancel={() => closeEditor('Task changes discarded. Saved schedule restored.')} />}
    <section className="panel tasks-panel" aria-labelledby="tasks-heading">
      <div className="section-heading"><div><span className="eyebrow">02 / Work</span><h2 id="tasks-heading">Tasks & schedule</h2></div>
        <button ref={addButton} type="button" disabled={!!editor || !result.ok} onClick={() => startEditing(newTask(`T${nextId}`))}>Add task</button></div>
      {editor && <p className="muted">The table previews your task changes. Save or cancel before editing another task.</p>}
      <TaskTable tasks={proposedTasks} result={result} editingId={editor?.taskId} blocked={!!editor || !result.ok}
        onEdit={startEditing} onDelete={task => { setDeleting(task); setDeleteError('') }} />
    </section>
    <p className="save-notice" role="status">{notice}</p>
    {deleting && <DeleteTaskDialog task={deleting} affected={tasks.filter(task => task.predecessorTaskIds.includes(deleting.taskId))} error={deleteError}
      onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    <footer>Project and task entry · Graphical Gantt view comes next.</footer>
  </main>
}

export default App
