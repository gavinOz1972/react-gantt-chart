import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { acceptsProjectFile, createProjectFile, MAX_PROJECT_BYTES, PROJECT_SCHEMA_VERSION, parseProject, serializeProject } from '../../persistence/projectFile'
import type { ProjectData, ProjectFile } from '../../persistence/projectFile'
import { deleteLocalProject, readLocalProjects, saveLocalProject } from '../../persistence/localProjects'
import type { LibraryResult } from '../../persistence/localProjects'
import { ConfirmDialog } from '../ConfirmDialog'

function local(operation: (storage: Storage) => LibraryResult): LibraryResult {
  try { return operation(window.localStorage) }
  catch { return { ok: false, error: { code: 'STORAGE_UNAVAILABLE', message: 'Browser storage is unavailable or blocked. Export JSON to keep a copy of the open project.' } } }
}
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('The selected file could not be read as text.'))
    reader.onerror = () => reject(new Error('The selected file could not be read. Select it again or choose another JSON file.'))
    reader.readAsText(file)
  })
}
type Pending = { kind: 'open'; file: ProjectFile; name: string | null } | { kind: 'new' } | { kind: 'overwrite'; file: ProjectFile; name: string; migrating?: 1 | 2 } | { kind: 'delete'; name: string }

export function ProjectStorage({ data, legacySource, dirty, ready, currentSavedName, onOpen, onSaved, onNew, onDeleted, saveTarget, onNameRequired }: {
  data: ProjectData; dirty: boolean; ready: boolean; currentSavedName: string | null
  legacySource?: ProjectFile
  onOpen: (file: ProjectFile, name: string | null) => void; onSaved: (file: ProjectFile, name: string) => void
  onNew: () => void; onDeleted: (name: string) => void
  saveTarget?: HTMLElement | null; onNameRequired?: () => void
}) {
  const [library, setLibrary] = useState(() => local(readLocalProjects))
  const [saveName, setSaveName] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [pending, setPending] = useState<Pending | null>(null)
  const [issue, setIssue] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const dirtyNow = useRef(dirty)
  useLayoutEffect(() => { dirtyNow.current = dirty }, [dirty])
  const name = saveName ?? currentSavedName ?? data.project.name
  const projects = library.ok ? library.projects : []
  function outcome(result: LibraryResult) {
    if (result.ok) setLibrary(result)
    else setIssue(result.error.message)
    return result.ok
  }
  function save(file: ProjectFile, target: string, overwrite: boolean) {
    const result = local(storage => saveLocalProject(storage, target, file, overwrite))
    if (outcome(result)) {
      setSaveName(target.trim())
      setSelectedName(target.trim())
      onSaved(file, target.trim())
      setNotice(`Saved “${target.trim()}” in this browser. Use Load project to reopen it.`)
      setIssue('')
    }
    return result.ok
  }
  function requestSave() {
    setIssue(''); setNotice('')
    if (!name.trim()) { setIssue('Enter a name for the saved plan.'); return }
    const created = createProjectFile(data)
    if (!created.ok) { setIssue(created.errors.map(error => error.message).join(' ')); return }
    const current = local(readLocalProjects)
    if (!outcome(current) || !current.ok) return
    const existing = current.projects.find(entry => entry.name === name.trim())
    if (existing) setPending({ kind: 'overwrite', file: created.value, name: name.trim(), migrating: existing.plan.schemaVersion < PROJECT_SCHEMA_VERSION ? existing.plan.schemaVersion as 1 | 2 : undefined })
    else save(created.value, name, false)
  }
  function quickSave() {
    if (!currentSavedName) {
      onNameRequired?.()
      requestAnimationFrame(() => { nameInput.current?.focus(); nameInput.current?.select() })
      return
    }
    setIssue(''); setNotice('')
    const created = createProjectFile(data)
    if (!created.ok) { setIssue(created.errors.map(error => error.message).join(' ')); onNameRequired?.(); return }
    const current = local(readLocalProjects)
    if (!outcome(current) || !current.ok) { onNameRequired?.(); return }
    const existing = current.projects.find(entry => entry.name === currentSavedName)
    if (existing && existing.plan.schemaVersion < PROJECT_SCHEMA_VERSION) {
      setPending({ kind: 'overwrite', file: created.value, name: currentSavedName, migrating: existing.plan.schemaVersion as 1 | 2 })
      return
    }
    if (!save(created.value, currentSavedName, true)) onNameRequired?.()
  }
  function requestLoad() {
    setIssue(''); setNotice('')
    const current = local(readLocalProjects)
    if (!outcome(current) || !current.ok) return
    const record = current.projects.find(entry => entry.name === selectedName)
    if (!record) { setIssue('Select an available saved plan first.'); setSelectedName(''); return }
    if (dirtyNow.current) setPending({ kind: 'open', file: record.plan, name: record.name })
    else onOpen(record.plan, record.name)
  }
  async function importFile(file: File) {
    setIssue(''); setNotice('')
    const problem = acceptsProjectFile(file)
    if (problem) { setIssue(problem.message); if (input.current) input.current.value = ''; return }
    setBusy(true)
    try {
      const parsed = parseProject(await readFile(file))
      if (!parsed.ok) { setIssue(parsed.errors.map(error => `[${error.code}] ${error.message}`).join(' ')); return }
      if (dirtyNow.current) setPending({ kind: 'open', file: parsed.value, name: null })
      else onOpen(parsed.value, null)
    } catch (error) { setIssue(error instanceof Error ? error.message : 'Import failed. The open project was kept.') }
    finally { setBusy(false); if (input.current) input.current.value = '' }
  }
  function download(file: ProjectFile, backup = false) {
    const versionLabel = file.schemaVersion === 1 ? 'WP5' : 'WP6.1'
    const blob = new Blob([serializeProject(file)], { type: 'application/json' })
    if (blob.size > MAX_PROJECT_BYTES) { setIssue('This project exceeds the 10 MiB portable-file limit. Reduce long descriptions or split the plan.'); return }
    try {
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `react-gantt-${file.project.name.replace(/[^\p{L}\p{N}._ -]/gu, '_').slice(0, 80) || 'project'}${backup ? `-${versionLabel}-backup` : ''}.json`
      document.body.append(anchor); anchor.click(); anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 0)
      setNotice(backup ? `${versionLabel} backup download started. It contains the original format ${file.schemaVersion} plan, before your current edits.` : 'JSON download started. Current Plan inputs, the original baseline if established, work entries and remaining effort are included. Current dates and critical paths are recalculated when imported.')
    } catch { setIssue('The download could not be started. Try another browser or save this plan locally.') }
  }
  function exportFile() {
    setIssue(''); setNotice('')
    const created = createProjectFile(data)
    if (!created.ok) { setIssue(created.errors.map(error => error.message).join(' ')); return }
    download(created.value)
  }
  function confirm() {
    if (!pending) return
    const action = pending
    setPending(null)
    if (action.kind === 'open') onOpen(action.file, action.name)
    else if (action.kind === 'new') onNew()
    else if (action.kind === 'overwrite') save(action.file, action.name, true)
    else {
      const result = local(storage => deleteLocalProject(storage, action.name, true))
      if (outcome(result)) {
        setSelectedName(''); setIssue('')
        setNotice(`Deleted the saved copy “${action.name}”. The open project was kept.`)
        onDeleted(action.name)
      }
    }
  }
  const libraryError = library.ok ? '' : library.error.message
  return <>{saveTarget && createPortal(<><span className={dirty ? 'unsaved-label' : 'preview-label'} role="status">{dirty ? 'Unsaved changes' : currentSavedName ? 'Saved locally' : 'New project'}</span>
    <button type="button" disabled={!ready || busy} onClick={quickSave}>Save</button>{issue && <span className="field-error">Save needs attention in Files</span>}</>, saveTarget)}
    <section className="panel storage-panel" aria-labelledby="storage-heading">
    <div className="section-heading"><div><span className="eyebrow">Local project files</span><h2 id="storage-heading">Save & reopen</h2></div>
      </div>
    <p className="storage-current">Current project: <strong>{data.project.name || 'Untitled project'}</strong>{currentSavedName && <> · Browser copy: {currentSavedName}</>}</p>
    <p className="muted">Plans stay in this browser profile on this site. Save is explicit. Export JSON to move or back up a plan; no account or remote storage is used.</p>
    {legacySource && <div className="compatibility-notice"><p>This {legacySource.schemaVersion === 1 ? 'WP5' : 'WP6.1'} plan is still in format {legacySource.schemaVersion}. Opening it has not changed its saved copy. Save or Export JSON writes format {PROJECT_SCHEMA_VERSION}, which older releases cannot safely preserve. Download a compatible backup before upgrading, or use Save As with a new name.</p>
      <button type="button" className="quiet" onClick={() => download(legacySource, true)}>Export {legacySource.schemaVersion === 1 ? 'WP5' : 'WP6.1'} backup</button></div>}
    <div className="storage-fields"><label>Saved plan name<input ref={nameInput} value={name} onChange={event => setSaveName(event.target.value)} /></label>
      <div className="storage-actions"><button type="button" disabled={!ready || busy} onClick={requestSave}>Save As</button>
        <button type="button" className="quiet" disabled={!ready || busy} onClick={exportFile}>Export JSON</button></div>
      <label>Saved plans<select aria-label="Saved plans" value={selectedName} onChange={event => setSelectedName(event.target.value)}><option value="">{projects.length ? 'Choose a saved plan' : 'No saved plans yet'}</option>
        {projects.map(entry => <option key={entry.name} value={entry.name}>{entry.name}</option>)}</select></label>
      <div className="storage-actions"><button type="button" className="quiet" disabled={!selectedName || busy} onClick={requestLoad}>Load project</button>
        <button type="button" className="danger-text" disabled={!selectedName || busy} onClick={() => { setIssue(''); setPending({ kind: 'delete', name: selectedName }) }}>Delete saved plan</button></div>
    </div>
    <div className="storage-actions"><button type="button" className="quiet" disabled={busy} onClick={() => input.current?.click()}>Import JSON</button>
      <input ref={input} type="file" accept=".json,application/json" hidden aria-label="Import project JSON" onChange={event => { const file = event.target.files?.[0]; if (file) void importFile(file) }} />
      <button type="button" className="quiet" disabled={busy} onClick={() => dirtyNow.current ? setPending({ kind: 'new' }) : onNew()}>New project</button>
      {busy && <span role="status">Reading and validating file…</span>}</div>
    {!ready && <p className="muted">Finish or cancel task and effort edits and correct invalid settings before saving or exporting. Load/import can replace unfinished work only after confirmation.</p>}
    {(issue || libraryError) && <p className="storage-error" role="alert">{issue || libraryError}</p>}
    <p className="save-notice" role="status">{notice}</p>
    {pending && <ConfirmDialog title={pending.kind === 'open' || pending.kind === 'new' ? 'Replace unsaved work?' : pending.kind === 'overwrite' ? `Overwrite saved plan “${pending.name}”?` : `Delete saved plan “${pending.name}”?`}
      confirmLabel={pending.kind === 'open' ? 'Replace current project' : pending.kind === 'new' ? 'Start new project' : pending.kind === 'overwrite' ? 'Overwrite saved plan' : 'Delete saved copy'} onConfirm={confirm} onCancel={() => setPending(null)}>
      <p>{pending.kind === 'open' || pending.kind === 'new' ? 'This will discard the open project’s unsaved changes and unfinished task, settings or effort drafts. Cancel to keep editing, or save/export first.'
        : pending.kind === 'overwrite' ? 'The existing named browser copy will be replaced with this plan. Other saved plans will be kept.' : 'Only this named browser copy will be deleted. The open project and other saved plans will be kept.'}</p>
      {pending.kind === 'overwrite' && pending.migrating && <><p>This upgrades the saved plan from format {pending.migrating} to format {PROJECT_SCHEMA_VERSION}. Earlier releases cannot open it. Cancel to export a compatible backup first, or save under a new name.</p>
        <button type="button" className="quiet" onClick={() => {
          const current = local(readLocalProjects)
          if (current.ok) { const original = current.projects.find(entry => entry.name === pending.name); if (original) download(original.plan, true) }
          else setIssue(current.error.message)
        }}>Export saved {pending.migrating === 1 ? 'WP5' : 'WP6.1'} backup</button></>}
    </ConfirmDialog>}
  </section></>
}
