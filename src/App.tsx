import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeCriticalPath, calculateSchedule } from './domain'
import type { TaskInput } from './domain'
import { EntryErrors } from './components/EntryErrors'
import { ProjectSettingsForm } from './components/ProjectSettingsForm'
import { TaskEditor } from './components/TaskEditor'
import { TaskTable } from './components/TaskTable'
import { DeleteTaskDialog } from './components/DeleteTaskDialog'
import { GanttChart } from './components/gantt/GanttChart'
import { NetworkView } from './components/network/NetworkView'
import { ProjectStorage } from './components/persistence/ProjectStorage'
import { projectFingerprint } from './persistence/projectFile'
import type { ProjectFile } from './persistence/projectFile'
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [highlightCritical, setHighlightCritical] = useState(false)
  const [chartView, setChartView] = useState<'gantt' | 'network'>('gantt')
  const [currentSavedName, setCurrentSavedName] = useState<string | null>(null)
  const [savedFingerprint, setSavedFingerprint] = useState(() => projectFingerprint({ project: initialProject, tasks: [], nextTaskNumber: 1 }))
  const [documentEpoch, setDocumentEpoch] = useState(0)
  const addButton = useRef<HTMLButtonElement>(null)
  const restoreEditorFocus = useRef(false)
  useEffect(() => {
    if (!editor && restoreEditorFocus.current) {
      addButton.current?.focus()
      restoreEditorFocus.current = false
    }
  }, [editor, deleting])

  const proposedProject = useMemo(() => projectFromDraft(project.projectId, projectDraft), [project.projectId, projectDraft])
  const proposedTasks = useMemo(() => editor ? replaceTask(tasks, taskFromDraft(editor)) : tasks, [editor, tasks])
  const result = useMemo(() => calculateSchedule(proposedProject, proposedTasks), [proposedProject, proposedTasks])
  const analysis = useMemo(() => analyzeCriticalPath(proposedProject, proposedTasks, result), [proposedProject, proposedTasks, result])
  const errors = result.ok ? [] : result.errors
  const projectDirty = JSON.stringify(projectDraft) !== JSON.stringify(projectToDraft(project))
  const isNew = !!editor && !tasks.some(task => task.taskId === editor.taskId)
  const completion = result.ok ? result.projectCompletion : null
  const previewing = !!editor || projectDirty
  const idLimitReached = nextId >= Number.MAX_SAFE_INTEGER - 1
  const unsaved = previewing || projectFingerprint({ project, tasks, nextTaskNumber: nextId }) !== savedFingerprint
  useEffect(() => {
    if (!unsaved) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  function openProject(file: ProjectFile, name: string | null) {
    setProject(file.project); setProjectDraft(projectToDraft(file.project)); setTasks(file.tasks); setNextId(file.nextTaskNumber)
    setEditor(null); setLinkError(''); setDeleting(null); setDeleteError(''); setSelectedTaskId(null)
    setCurrentSavedName(name); setSavedFingerprint(name ? projectFingerprint(file) : '')
    setDocumentEpoch(value => value + 1)
    setNotice(name ? `Opened “${name}”. Schedule and critical path recalculated.` : 'JSON imported. Schedule and critical path recalculated; save a browser copy if needed.')
  }
  function savedProject(file: ProjectFile, name: string) {
    setProject(file.project); setProjectDraft(projectToDraft(file.project)); setTasks(file.tasks)
    setCurrentSavedName(name); setSavedFingerprint(projectFingerprint(file))
  }
  function freshProject() {
    const fresh = { ...initialProject, projectId: `P-${crypto.randomUUID()}` }
    setProject(fresh); setProjectDraft(projectToDraft(fresh)); setTasks([]); setNextId(1); setEditor(null); setSelectedTaskId(null)
    setLinkError(''); setDeleting(null); setDeleteError(''); setCurrentSavedName(null)
    setSavedFingerprint(projectFingerprint({ project: fresh, tasks: [], nextTaskNumber: 1 })); setDocumentEpoch(value => value + 1)
    setNotice('New project started. Named browser saves were kept.')
  }

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
    if (selectedTaskId === deleting.taskId) setSelectedTaskId(null)
    restoreEditorFocus.current = true
    setNotice(`${deleting.taskId} deleted. Other tasks were kept and recalculated.`)
    setDeleting(null)
  }

  return <main>
    <header className="page-header"><div><span className="eyebrow">Project planner</span><h1>React Gantt Chart</h1>
      <p>Set your working calendar, connect your tasks, and see your schedule take shape.</p></div><span className="phase-label">Project, tasks & timeline</span></header>
    <p className="session-note">Save locally to reopen a plan in this browser, or export JSON for a portable copy. Unsaved edits stay in this tab.</p>
    <ProjectStorage key={documentEpoch} data={{ project: proposedProject, tasks, nextTaskNumber: nextId }} dirty={unsaved} ready={result.ok && !editor} currentSavedName={currentSavedName}
      onOpen={openProject} onSaved={savedProject} onNew={freshProject} onDeleted={name => { if (currentSavedName === name) { setCurrentSavedName(null); setSavedFingerprint('') } }} />
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
        <button ref={addButton} type="button" disabled={!!editor || !result.ok || idLimitReached} onClick={() => startEditing(newTask(`T${nextId}`))}>Add task</button></div>
      {idLimitReached && <p className="field-error">No safe numeric task IDs remain in this plan. Existing tasks can still be edited and saved; start a new plan to add tasks.</p>}
      {editor && <p className="muted">The table previews your task changes. Save or cancel before editing another task.</p>}
      <TaskTable tasks={proposedTasks} result={result} editingId={editor?.taskId} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} blocked={!!editor || !result.ok}
        onEdit={startEditing} onDelete={task => { setDeleting(task); setDeleteError('') }} />
    </section>
    {result.ok && !analysis.ok && <div className="error-summary" role="alert">Critical-path analysis unavailable: {analysis.errors.map(error => error.message).join(' ')}</div>}
    <div className="view-switch" role="group" aria-label="Project visualization"><button type="button" aria-pressed={chartView === 'gantt'} onClick={() => setChartView('gantt')}>Gantt</button>
      <button type="button" aria-pressed={chartView === 'network'} onClick={() => setChartView('network')}>Network / Critical Path</button></div>
    <div hidden={chartView !== 'gantt'}><GanttChart project={proposedProject} tasks={proposedTasks} result={result} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} previewing={previewing}
      analysis={analysis} highlightCritical={highlightCritical} onHighlightChange={setHighlightCritical} /></div>
    <div hidden={chartView !== 'network'}><NetworkView tasks={proposedTasks} result={result} analysis={analysis} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} /></div>
    <p className="save-notice" role="status">{notice}</p>
    {deleting && <DeleteTaskDialog task={deleting} affected={tasks.filter(task => task.predecessorTaskIds.includes(deleting.taskId))} error={deleteError}
      onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    <footer>Project, task entry, Gantt & Network / Critical Path · Local saves and portable JSON.</footer>
  </main>
}

export default App
