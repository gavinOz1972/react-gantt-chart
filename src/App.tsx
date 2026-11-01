import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeCriticalPath, calculateSchedule } from './domain'
import type { TaskInput } from './domain'
import { EntryErrors } from './components/EntryErrors'
import { ProjectSettingsForm } from './components/ProjectSettingsForm'
import { TaskEditor } from './components/TaskEditor'
import { TaskTable } from './components/TaskTable'
import { TaskInspection } from './components/TaskInspection'
import { DeleteTaskDialog } from './components/DeleteTaskDialog'
import { GanttChart } from './components/gantt/GanttChart'
import { NetworkView } from './components/network/NetworkView'
import { BaselinePanel } from './components/BaselinePanel'
import { establishBaseline } from './baseline/baseline'
import type { Baseline } from './baseline/baseline'
import { TaskWorkPanel } from './components/TaskWorkPanel'
import { decodeWorkTracking, effortSummary, emptyWorkTracking, formatEffort, parseEffort, removeTaskWork } from './workTracking/workTracking'
import type { WorkTracking } from './workTracking/workTracking'
import { RemainingEffortField } from './components/RemainingEffortField'
import type { RemainingEffortDraft } from './components/RemainingEffortField'
import { ProjectStorage } from './components/persistence/ProjectStorage'
import { projectFingerprint } from './persistence/projectFile'
import type { ProjectFile } from './persistence/projectFile'
import { dependencyError, initialProject, newTask, projectFromDraft, projectToDraft, removeTaskAndLinks, replaceTask, taskFromDraft, taskToDraft } from './components/projectEntry'
import type { ProjectDraft, TaskDraft } from './components/projectEntry'
import { displayTasks, duplicateTask, insertCopy, moveBefore } from './taskManagement'
import type { DuplicateOrigins, SortMode } from './taskManagement'
import { decodeProgress, duplicateProgress, emptyProgress, progressForTask, removeTaskProgress, replaceCriteria, transitionTask } from './progress/taskProgress'
import type { CompletionCriterion, ProgressTracking, TaskStatus, TransitionRequest } from './progress/taskProgress'
import { TaskStatusControl } from './components/progress/TaskStatusControl'
import { TaskStatusPanel } from './components/progress/TaskStatusPanel'
import { DefinitionOfDone } from './components/progress/DefinitionOfDone'
import { StatusTransitionDialog } from './components/progress/StatusTransitionDialog'
import { localDate } from './components/progress/localDate'

const tabs = ['Files', 'Project Settings', 'Workspace'] as const
type Tab = typeof tabs[number]

function App() {
  const [project, setProject] = useState(initialProject)
  const [projectDraft, setProjectDraft] = useState(() => projectToDraft(initialProject))
  const [tasks, setTasks] = useState<readonly TaskInput[]>([])
  const [nextId, setNextId] = useState(1)
  const [manualOrder, setManualOrder] = useState<readonly string[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('manual')
  const [duplicateOrigins, setDuplicateOrigins] = useState<DuplicateOrigins>({})
  const [baseline, setBaseline] = useState<Baseline>()
  const [legacySource, setLegacySource] = useState<ProjectFile>()
  const [workTracking, setWorkTracking] = useState<WorkTracking>(emptyWorkTracking)
  const [workDraft, setWorkDraft] = useState(false)
  const [quickRemaining, setQuickRemaining] = useState<RemainingEffortDraft | null>(null)
  const [taskProgress, setTaskProgress] = useState<ProgressTracking>(emptyProgress)
  const [criteriaDraft, setCriteriaDraft] = useState(false)
  const [definitionDraft, setDefinitionDraft] = useState(false)
  const [statusPrompt, setStatusPrompt] = useState<{ taskId: string; target: TaskStatus } | null>(null)
  const statusTrigger = useRef<HTMLElement | null>(null)
  const [inlineDrafts, setInlineDrafts] = useState<ReadonlySet<string>>(new Set())
  const [tab, setTab] = useState<Tab>('Files')
  const [saveTarget, setSaveTarget] = useState<HTMLDivElement | null>(null)
  const [editor, setEditor] = useState<TaskDraft | null>(null)
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
  const selectedTask = proposedTasks.find(task => task.taskId === selectedTaskId)
  const selectedCurrentTask = tasks.find(task => task.taskId === selectedTaskId)
  const selectedEffort = selectedCurrentTask ? effortSummary(workTracking, selectedCurrentTask.taskId, baseline) : undefined
  const selectedSchedule = result.ok ? result.tasks.find(task => task.taskId === selectedTaskId) : undefined
  const completion = result.ok ? result.projectCompletion : null
  const previewing = !!editor || projectDirty
  const idLimitReached = nextId >= Number.MAX_SAFE_INTEGER - 1
  const progressDraft = criteriaDraft || definitionDraft || !!statusPrompt
  const statusBlocked = !!editor || inlineDrafts.size > 0 || workDraft || !!quickRemaining || progressDraft || !result.ok || projectDirty
  const unsaved = previewing || inlineDrafts.size > 0 || workDraft || !!quickRemaining || progressDraft || projectFingerprint({ project, tasks, nextTaskNumber: nextId, manualOrder, sortMode, duplicateOrigins, baseline, workTracking, taskProgress }) !== savedFingerprint
  const baselineProblems = [
    ...(!tasks.length ? ['Add and save at least one task.'] : []),
    ...(previewing || inlineDrafts.size > 0 || workDraft || quickRemaining || progressDraft ? ['Finish or cancel task edits, effort edits and status/criteria edits; commit or revert project settings.'] : []),
    ...errors.map(error => `${error.taskId ?? 'Project'}: ${error.message}`),
  ]
  function freezePlan() {
    if (baselineProblems.length) { setNotice(baselineProblems.join(' ')); return }
    const created = establishBaseline({ project, tasks, nextTaskNumber: nextId, manualOrder, sortMode, duplicateOrigins }, `BL-${crypto.randomUUID()}`, new Date().toISOString(), baseline)
    if (!created.ok) { setNotice(created.errors.map(error => error.message).join(' ')); return }
    setBaseline(created.value)
    setNotice('Original baseline established. Current Plan remains editable. Save or Export JSON to keep the snapshot.')
  }
  const displayed = useMemo(() => displayTasks(proposedTasks, isNew && editor ? [...manualOrder, editor.taskId] : manualOrder, sortMode, result), [proposedTasks, isNew, editor, manualOrder, sortMode, result])
  function inlineDraftChanged(key: string, dirty: boolean) {
    setInlineDrafts(previous => { const next = new Set(previous); if (dirty) next.add(key); else next.delete(key); return next })
  }
  function commitWork(value: WorkTracking): string | undefined {
    const checked = decodeWorkTracking(value, tasks.map(task => task.taskId))
    if (!checked.ok) return checked.errors.map(error => error.message).join(' ')
    setWorkTracking(checked.value)
    setNotice('Work/effort records updated. Save or Export JSON to keep them.')
  }
  function commitProgress(value: ProgressTracking): string | undefined {
    const checked = decodeProgress(value, tasks.map(task => task.taskId))
    if (!checked.ok) return checked.errors.map(error => error.message).join(' ')
    setTaskProgress(checked.value)
  }
  function commitCriteria(taskId: string, items: readonly CompletionCriterion[]): string | undefined {
    const checked = replaceCriteria(taskProgress, taskId, items, tasks.map(task => task.taskId))
    if (!checked.ok) return checked.errors.map(error => error.message).join(' ')
    setTaskProgress(checked.value)
  }
  function applyStatus(taskId: string, request: TransitionRequest): string | undefined {
    const checked = transitionTask(taskProgress, taskId, request, tasks.map(task => task.taskId))
    if (!checked.ok) return checked.errors.map(error => error.message).join(' ')
    setTaskProgress(checked.value); setNotice(`${taskId}: ${request.target}. Save or Export JSON to keep this decision.`)
  }
  function requestStatus(task: TaskInput, target: TaskStatus, trigger: HTMLElement) {
    if (statusBlocked || target === progressForTask(taskProgress, task.taskId).status) return
    statusTrigger.current = trigger
    if (target === 'Complete' || target === 'Blocked' || progressForTask(taskProgress, task.taskId).status === 'Complete') { setStatusPrompt({ taskId: task.taskId, target }); return }
    const problem = applyStatus(task.taskId, { target, eventId: `E-${crypto.randomUUID()}`, date: localDate(), recordedAt: new Date().toISOString() })
    if (problem) setNotice(problem)
  }
  function closeStatusPrompt() { setStatusPrompt(null); requestAnimationFrame(() => statusTrigger.current?.isConnected && statusTrigger.current.focus()) }
  function remainingValue(taskId: string) { return Object.hasOwn(workTracking.remainingHours, taskId) ? workTracking.remainingHours[taskId] : null }
  function commitQuickRemaining(): string | undefined {
    if (!quickRemaining) return
    const parsed = parseEffort(quickRemaining.text, true)
    let problem: string | undefined
    if (!parsed.ok) problem = parsed.errors.map(error => error.message).join(' ')
    else if (parsed.value !== remainingValue(quickRemaining.taskId)) problem = commitWork({ ...workTracking, remainingHours: { ...workTracking.remainingHours, [quickRemaining.taskId]: parsed.value } })
    if (problem) { setQuickRemaining(previous => previous && { ...previous, error: problem }); return problem }
    setQuickRemaining(null)
  }
  function remainingField(task: TaskInput, source: 'table' | 'chart') {
    const fieldKey = `${source}:${task.taskId}`
    const active = quickRemaining?.fieldKey === fieldKey
    return <RemainingEffortField key={fieldKey} label={`${source === 'chart' ? 'Selected ' : ''}${task.taskId} remaining effort`} value={remainingValue(task.taskId)} draft={active ? quickRemaining : undefined}
      disabled={!!editor || inlineDrafts.size > 0 || workDraft || progressDraft || !result.ok || projectDirty || (!!quickRemaining && !active)}
      onBegin={() => setQuickRemaining({ taskId: task.taskId, fieldKey, text: remainingValue(task.taskId) === null ? '' : String(remainingValue(task.taskId)), error: '' })}
      onChange={text => setQuickRemaining(previous => previous && { ...previous, text, error: '' })} onCommit={commitQuickRemaining} onCancel={() => setQuickRemaining(null)} />
  }
  function commitInline(task: TaskInput): string | undefined {
    const candidate = replaceTask(tasks, task)
    const checked = calculateSchedule(project, candidate)
    if (!checked.ok) return checked.errors.map(error => `${error.taskId ?? 'Project'}: ${error.message}`).join(' ')
    setTasks(candidate); setNotice(`${task.taskId} updated. Schedule and critical path recalculated.`)
  }
  function copyTask(task: TaskInput) {
    if (idLimitReached) { setNotice('No safe numeric task IDs remain. Start a new plan to add tasks.'); return }
    const copy = duplicateTask(task, `T${nextId}`, tasks)
    const candidate = [...tasks, copy]
    const checked = calculateSchedule(project, candidate)
    if (!checked.ok) { setNotice(`Copy not created: ${checked.errors.map(error => error.message).join(' ')}`); return }
    const copiedProgress = duplicateProgress(taskProgress, task.taskId, copy.taskId, progressForTask(taskProgress, task.taskId).criteria.map(() => `C-${crypto.randomUUID()}`), candidate.map(task => task.taskId))
    if (!copiedProgress.ok) { setNotice(copiedProgress.errors.map(error => error.message).join(' ')); return }
    setTaskProgress(copiedProgress.value)
    setTasks(candidate); setNextId(nextId + 1); setManualOrder(insertCopy(manualOrder, task.taskId, copy.taskId))
    setDuplicateOrigins(previous => ({ ...previous, [copy.taskId]: task.taskId })); setSelectedTaskId(copy.taskId)
    setNotice(`${copy.taskId} created immediately after ${task.taskId} in Manual Order. Current sort kept.`)
  }
  useEffect(() => {
    if (!unsaved) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  function openProject(file: ProjectFile, name: string | null) {
    setBaseline(file.baseline); setLegacySource(file.schemaVersion < 4 ? file : undefined)
    setTaskProgress(file.taskProgress ?? emptyProgress()); setCriteriaDraft(false); setDefinitionDraft(false); setStatusPrompt(null)
    setWorkTracking(file.workTracking ?? emptyWorkTracking()); setWorkDraft(false)
    setQuickRemaining(null)
    setProject(file.project); setProjectDraft(projectToDraft(file.project)); setTasks(file.tasks); setNextId(file.nextTaskNumber)
    setManualOrder(file.manualOrder); setSortMode(file.sortMode); setDuplicateOrigins(file.duplicateOrigins); setInlineDrafts(new Set()); setTab('Workspace')
    setEditor(null); setDeleting(null); setDeleteError(''); setSelectedTaskId(null)
    setCurrentSavedName(name); setSavedFingerprint(name ? projectFingerprint(file) : '')
    setDocumentEpoch(value => value + 1)
    setNotice(name ? `Opened “${name}”. Schedule and critical path recalculated.` : 'JSON imported. Schedule and critical path recalculated; save a browser copy if needed.')
  }
  function savedProject(file: ProjectFile, name: string) {
    setTaskProgress(file.taskProgress ?? emptyProgress())
    setBaseline(file.baseline); setLegacySource(undefined)
    setWorkTracking(file.workTracking ?? emptyWorkTracking())
    setProject(file.project); setProjectDraft(projectToDraft(file.project)); setTasks(file.tasks)
    setCurrentSavedName(name); setSavedFingerprint(projectFingerprint(file))
  }
  function freshProject() {
    setTaskProgress(emptyProgress()); setCriteriaDraft(false); setDefinitionDraft(false); setStatusPrompt(null)
    setBaseline(undefined); setLegacySource(undefined)
    setWorkTracking(emptyWorkTracking()); setWorkDraft(false)
    setQuickRemaining(null)
    const fresh = { ...initialProject, projectId: `P-${crypto.randomUUID()}` }
    setProject(fresh); setProjectDraft(projectToDraft(fresh)); setTasks([]); setNextId(1); setEditor(null); setSelectedTaskId(null)
    setManualOrder([]); setSortMode('manual'); setDuplicateOrigins({}); setInlineDrafts(new Set()); setTab('Project Settings')
    setDeleting(null); setDeleteError(''); setCurrentSavedName(null)
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
    setNotice('')
  }

  function changeEditor(draft: TaskDraft) {
    setEditor(draft)
  }

  function predecessorProblem(ids: readonly string[]) {
    if (!editor) return undefined
    const seed = tasks.find(task => task.taskId === editor.taskId) ?? newTask(editor.taskId)
    return dependencyError(project, tasks, seed, ids)?.message
  }

  function commitEditorPredecessors(predecessorTaskIds: string[]) {
    if (!editor) return 'Open a task before editing predecessors.'
    // Validate graph/start effects against valid saved text and effort, so an
    // unfinished name or duration cannot prevent correcting relationships.
    const seed = tasks.find(task => task.taskId === editor.taskId) ?? newTask(editor.taskId)
    const candidate = taskFromDraft({ ...taskToDraft({ ...seed, name: seed.name || 'New task' }), predecessorTaskIds,
      independentStartMode: editor.independentStartMode, requestedStartDate: editor.requestedStartDate })
    const checked = calculateSchedule(project, replaceTask(tasks, candidate))
    if (!checked.ok) return checked.errors.map(error => `${error.taskId ?? 'Project'}: ${error.message}`).join(' ')
    changeEditor({ ...editor, predecessorTaskIds })
  }

  function closeEditor(message: string) {
    restoreEditorFocus.current = true
    setEditor(null)
    setNotice(message)
  }

  function saveTask() {
    if (!editor || !result.ok) return
    setTasks(proposedTasks)
    if (isNew) { setNextId(nextId + 1); setManualOrder(previous => [...previous, editor.taskId]) }
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
    setWorkTracking(previous => removeTaskWork(previous, deleting.taskId))
    setTaskProgress(previous => removeTaskProgress(previous, deleting.taskId))
    setManualOrder(previous => previous.filter(id => id !== deleting.taskId))
    setDuplicateOrigins(previous => Object.fromEntries(Object.entries(previous).filter(([id]) => id !== deleting.taskId)))
    if (selectedTaskId === deleting.taskId) setSelectedTaskId(null)
    restoreEditorFocus.current = true
    setNotice(`${deleting.taskId} deleted. Other tasks were kept and recalculated.`)
    setDeleting(null)
  }

  return <main>
    <header className="page-header"><div><span className="eyebrow">Project planner</span><h1>React Gantt Chart</h1>
      <p className="project-identity">{project.name} · {tasks.length} tasks</p></div><div className="persistent-save" ref={setSaveTarget} /></header>
    <nav className="workspace-tabs" role="tablist" aria-label="Project sections">{tabs.map((name, index) => <button key={name} type="button" role="tab" id={`tab-${index}`} aria-controls={`panel-${index}`} aria-selected={tab === name} tabIndex={tab === name ? 0 : -1}
      onClick={() => setTab(name)} onKeyDown={event => {
        let next: number
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
        else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length
        else if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = tabs.length - 1
        else return
        event.preventDefault(); setTab(tabs[next]); document.getElementById(`tab-${next}`)?.focus()
      }}>{name}</button>)}</nav>
    <section className="summary-panel compact-summary" aria-labelledby="summary-heading">
      <div className="section-heading"><h2 id="summary-heading">Project overview</h2><span className={result.ok ? 'status-label' : 'status-label invalid'}>{!result.ok ? 'Needs attention' : previewing ? 'Unsaved preview' : 'Schedule current'}</span></div>
      <dl className="summary-grid">
        <div><dt>Tasks{editor ? ' (preview)' : ''}</dt><dd>{proposedTasks.length}</dd></div>
        <div><dt>Calculated completion</dt><dd>{!result.ok ? 'Unavailable' : completion ? <>{completion.date}<small>after hour {completion.afterHour}</small></> : 'No tasks yet'}</dd></div>
        <div><dt>Target end date</dt><dd>{proposedProject.targetEndDate || 'Not set'}</dd></div>
        <div><dt>Target status</dt><dd>{!result.ok ? 'Unavailable' : !completion ? 'Add tasks to compare' : completion.date <= proposedProject.targetEndDate ? <span className="on-time">On time</span> : <span className="late">Late</span>}</dd></div>
      </dl>
    </section>
    <div role="tabpanel" id="panel-0" aria-labelledby="tab-0" hidden={tab !== 'Files'}>
    <ProjectStorage key={documentEpoch} data={{ project: proposedProject, tasks, nextTaskNumber: nextId, manualOrder, sortMode, duplicateOrigins, baseline, workTracking, taskProgress }} legacySource={legacySource} dirty={unsaved} ready={result.ok && !editor && inlineDrafts.size === 0 && !workDraft && !quickRemaining && !progressDraft} currentSavedName={currentSavedName}
      saveTarget={saveTarget} onNameRequired={() => setTab('Files')} onOpen={openProject} onSaved={savedProject} onNew={freshProject} onDeleted={name => { if (currentSavedName === name) { setCurrentSavedName(null); setSavedFingerprint('') } }} />
    <button type="button" className="next-step" onClick={() => setTab('Project Settings')}>Next: Project Settings →</button></div>
    <div role="tabpanel" id="panel-1" aria-labelledby="tab-1" hidden={tab !== 'Project Settings'}>
    <ProjectSettingsForm draft={projectDraft} errors={errors} disabled={!!editor || inlineDrafts.size > 0 || workDraft || !!quickRemaining || progressDraft} dirty={projectDirty} onChange={setProjectDraft}
      onCommit={commitProject} onRevert={() => { setProjectDraft(projectToDraft(project)); setNotice('Saved project settings restored.') }} />
    <BaselinePanel key={`baseline-${documentEpoch}`} baseline={baseline} problems={baselineProblems} onEstablish={freezePlan} />
    <DefinitionOfDone key={`definition-${documentEpoch}`} value={taskProgress.definitionOfDone} disabled={!!editor || inlineDrafts.size > 0 || workDraft || !!quickRemaining || criteriaDraft || !!statusPrompt || projectDirty} onCommit={text => commitProgress({ ...taskProgress, definitionOfDone: text })} onDraftChange={setDefinitionDraft} />
    <button type="button" className="next-step" onClick={() => setTab('Workspace')}>Next: Workspace →</button></div>
    <EntryErrors errors={errors} />
    <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden={tab !== 'Workspace'}>
    {result.ok && !analysis.ok && <div className="error-summary" role="alert">Critical-path analysis unavailable: {analysis.errors.map(error => error.message).join(' ')}</div>}
    <div className="view-switch" role="group" aria-label="Project visualization"><button type="button" aria-pressed={chartView === 'gantt'} onClick={() => setChartView('gantt')}>Gantt</button>
      <button type="button" aria-pressed={chartView === 'network'} onClick={() => setChartView('network')}>Network / Critical Path</button></div>
    <div hidden={chartView !== 'gantt'}><GanttChart project={proposedProject} tasks={displayed} result={result} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} previewing={previewing}
      showInspection={false} analysis={analysis} highlightCritical={highlightCritical} onHighlightChange={setHighlightCritical}>
      {selectedCurrentTask && selectedEffort && <section className="selected-effort-quick" aria-label="Selected chart task">
        <strong>{selectedCurrentTask.taskId} — {selectedCurrentTask.name}</strong>
        <span className="task-status-badge">{progressForTask(taskProgress, selectedCurrentTask.taskId).status}</span>
        <div className="selected-remaining"><span>Remaining Effort</span>{remainingField(selectedCurrentTask, 'chart')}</div>
        <dl><div><dt>Actual effort</dt><dd>{formatEffort(selectedEffort.actualHours)} h</dd></div>
          <div><dt>Effort at completion</dt><dd>{selectedEffort.forecastHours === null ? 'Not available' : `${formatEffort(selectedEffort.forecastHours)} h`}</dd></div>
          <div><dt>Effort variance</dt><dd>{selectedEffort.varianceHours === null ? 'Not available' : `${selectedEffort.varianceHours > 0 ? '+' : ''}${formatEffort(selectedEffort.varianceHours)} h`}</dd></div></dl>
      </section>}
      {quickRemaining?.fieldKey.startsWith('chart:') && selectedTaskId !== quickRemaining.taskId && <div className="quick-remaining-pending" role="status">Unsubmitted Remaining Effort edit for {quickRemaining.taskId}.
        <button type="button" className="quiet" onClick={() => setSelectedTaskId(quickRemaining.taskId)}>Resume remaining edit for {quickRemaining.taskId}</button><button type="button" className="quiet" onClick={() => setQuickRemaining(null)}>Cancel remaining edit</button></div>}
    </GanttChart></div>
    <div hidden={chartView !== 'network'}><NetworkView key={documentEpoch} active={chartView === 'network' && tab === 'Workspace'} showInspection={false} tasks={proposedTasks} result={result} analysis={analysis} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} /></div>
    <section className="panel tasks-panel" aria-labelledby="tasks-heading">
      <div className="section-heading"><div><span className="eyebrow">02 / Tasks & Schedule</span><h2 id="tasks-heading">Tasks & schedule</h2></div>
        <div className="task-toolbar"><label>Task order<select value={sortMode} disabled={!!editor || inlineDrafts.size > 0 || workDraft || !!quickRemaining || progressDraft} onChange={event => setSortMode(event.target.value as SortMode)}><option value="manual">Manual Order</option><option value="start">Start Date</option><option value="name">Task Name</option><option value="duration">Duration</option></select></label>
        <button ref={addButton} type="button" disabled={!!editor || inlineDrafts.size > 0 || workDraft || !!quickRemaining || progressDraft || !result.ok || idLimitReached} onClick={() => startEditing(newTask(`T${nextId}`))}>Add task</button></div></div>
    {editor && <TaskEditor key={editor.taskId} draft={editor} isNew={isNew} tasks={tasks} projectStartDate={project.projectStartDate}
      scheduled={result.ok ? result.tasks.find(task => task.taskId === editor.taskId) : undefined} errors={errors}
      optionError={predecessorProblem} onChange={changeEditor} onPredecessors={commitEditorPredecessors} onSave={saveTask} onCancel={() => closeEditor('Task changes discarded. Saved schedule restored.')} />}
      <p className="muted order-help">{sortMode === 'manual' ? 'Drag a handle onto a row to place above it, or use the up/down buttons. Select a field to edit.' : 'Reordering is disabled while sorted. Choose Manual Order to restore your arrangement and move tasks.'}</p>
      {idLimitReached && <p className="field-error">No safe numeric task IDs remain in this plan. Existing tasks can still be edited and saved; start a new plan to add tasks.</p>}
      {editor && <p className="muted">The table previews your task changes. Save or cancel before editing another task.</p>}
      <TaskTable tasks={displayed} result={result} project={project} manual={sortMode === 'manual'} onMove={(id, before) => setManualOrder(previous => moveBefore(previous, id, before))} onDuplicate={copyTask} onCommit={commitInline} onDraftChange={inlineDraftChanged}
        editingId={editor?.taskId} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} blocked={!!editor || !result.ok || inlineDrafts.size > 0 || workDraft || !!quickRemaining || progressDraft} renderRemaining={task => remainingField(task, 'table')}
        renderStatus={task => <TaskStatusControl taskId={task.taskId} value={progressForTask(taskProgress, task.taskId).status} disabled={statusBlocked} onRequest={(target, trigger) => requestStatus(task, target, trigger)} />}
        onEdit={startEditing} onDelete={task => { setDeleting(task); setDeleteError('') }} />
    </section>
    <section className="panel task-details-panel" aria-labelledby="task-details-heading">
      <div className="section-heading"><div><span className="eyebrow">03 / Task Details</span><h2 id="task-details-heading">Task details</h2></div></div>
      {selectedTask && selectedSchedule ? <TaskInspection task={selectedTask} scheduled={selectedSchedule} analysis={analysis.ok ? analysis.tasks.find(task => task.taskId === selectedTaskId) : undefined} />
        : <p className="muted">{selectedTaskId && !result.ok ? 'Task dates are unavailable until the preview is valid.' : 'Select a bar, network node or task row to inspect its dates, duration, predecessors and slack.'}</p>}
      <TaskStatusPanel key={`status-${documentEpoch}`} task={selectedCurrentTask} tracking={taskProgress} disabled={!!editor || inlineDrafts.size > 0 || workDraft || !!quickRemaining || definitionDraft || !!statusPrompt || !result.ok || projectDirty} statusDisabled={statusBlocked}
        onRequest={requestStatus} onCriteria={commitCriteria} onDraftChange={setCriteriaDraft} onSelect={setSelectedTaskId} />
      <TaskWorkPanel key={`work-${documentEpoch}`} task={selectedCurrentTask} tracking={workTracking} baseline={baseline} disabled={!!editor || inlineDrafts.size > 0 || !result.ok || projectDirty || !!quickRemaining || progressDraft}
        onChange={commitWork} onDraftChange={setWorkDraft} onSelect={setSelectedTaskId} />
    </section>
    </div>
    <p className="save-notice" role="status">{notice}</p>
    {statusPrompt && <StatusTransitionDialog key={`${statusPrompt.taskId}:${statusPrompt.target}`} task={tasks.find(task => task.taskId === statusPrompt.taskId)!} current={progressForTask(taskProgress, statusPrompt.taskId)} target={statusPrompt.target} definitionOfDone={taskProgress.definitionOfDone}
      onCommit={request => { const problem = applyStatus(statusPrompt.taskId, request); if (!problem) closeStatusPrompt(); return problem }} onCancel={closeStatusPrompt} />}
    {deleting && <DeleteTaskDialog task={deleting} affected={tasks.filter(task => task.predecessorTaskIds.includes(deleting.taskId))} error={deleteError} workEntryCount={workTracking.entries.filter(entry => entry.taskId === deleting.taskId).length} hasRemainingEstimate={Object.hasOwn(workTracking.remainingHours, deleting.taskId) && workTracking.remainingHours[deleting.taskId] !== null} statusEventCount={taskProgress.events.filter(event => event.taskId === deleting.taskId).length} criterionCount={progressForTask(taskProgress, deleting.taskId).criteria.length}
      onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />}
    <footer>Project, task entry, Gantt & Network / Critical Path · Local saves and portable JSON.</footer>
  </main>
}

export default App
