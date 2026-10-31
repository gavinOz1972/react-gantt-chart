import { decodeProject } from './projectFile'
import type { PersistenceIssue, ProjectFile } from './projectFile'

export const LOCAL_PROJECTS_KEY = 'react-gantt-chart:projects:v1'
export interface NamedProject { name: string; savedAt: string; plan: ProjectFile }
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>
export type LibraryResult = { ok: true; projects: NamedProject[] } | { ok: false; error: PersistenceIssue }
const failure = (code: string, message: string): LibraryResult => ({ ok: false, error: { code, message } })
function storageFailure(error: unknown): LibraryResult {
  const name = typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : ''
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED'
    ? failure('STORAGE_FULL', 'Browser storage is full. Export JSON for a portable copy, or delete an unneeded saved plan and retry.')
    : failure('STORAGE_UNAVAILABLE', 'Browser storage is unavailable or blocked. Your open plan is unchanged; use JSON export to keep a copy.')
}
export function readLocalProjects(storage: StoragePort): LibraryResult {
  let raw: string | null
  try { raw = storage.getItem(LOCAL_PROJECTS_KEY) } catch (error) { return storageFailure(error) }
  if (raw === null) return { ok: true, projects: [] }
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || !('schemaVersion' in data) || data.schemaVersion !== 1 || !('projects' in data) || !Array.isArray(data.projects)) return failure('STORAGE_CORRUPT', 'The local project library has an unsupported or damaged format. It was not overwritten. Import a backup JSON file or use another browser profile.')
    const projects: NamedProject[] = []
    const names = new Set<string>()
    for (const entry of data.projects) {
      if (typeof entry !== 'object' || entry === null || typeof entry.name !== 'string' || !entry.name.trim() || names.has(entry.name)) return failure('STORAGE_CORRUPT', 'The local library contains invalid or duplicate saved names. Existing storage was not changed.')
      const parsed = decodeProject(entry.plan)
      if (!parsed.ok || entry.savedAt !== parsed.value.savedAt) return failure('STORAGE_CORRUPT', `Saved plan ${entry.name} is invalid. Existing storage was not changed; use an exported backup.`)
      names.add(entry.name)
      projects.push({ name: entry.name, savedAt: entry.savedAt, plan: parsed.value })
    }
    return { ok: true, projects: projects.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0) }
  } catch { return failure('STORAGE_CORRUPT', 'The local library is not valid JSON. It was not erased or overwritten. Use a backup JSON file or another browser profile.') }
}

export function saveLocalProject(storage: StoragePort, name: string, plan: ProjectFile, overwrite = false): LibraryResult {
  const trimmed = name.trim()
  if (!trimmed) return failure('INVALID_SAVE_NAME', 'Enter a name for the saved plan.')
  const validated = decodeProject(plan)
  if (!validated.ok) return failure('INVALID_PROJECT', validated.errors.map(error => error.message).join(' '))
  const library = readLocalProjects(storage)
  if (!library.ok) return library
  if (library.projects.some(entry => entry.name === trimmed) && !overwrite) return failure('OVERWRITE_CONFIRMATION_REQUIRED', `A plan named ${trimmed} already exists. Confirm before replacing it.`)
  const projects = [...library.projects.filter(entry => entry.name !== trimmed), { name: trimmed, savedAt: plan.savedAt, plan: validated.value }].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
  try { storage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify({ schemaVersion: 1, projects })); return { ok: true, projects } }
  catch (error) { return storageFailure(error) }
}

export function deleteLocalProject(storage: StoragePort, name: string, confirmed: boolean): LibraryResult {
  if (!confirmed) return failure('DELETE_CONFIRMATION_REQUIRED', `Confirm before deleting the saved plan ${name}.`)
  const library = readLocalProjects(storage)
  if (!library.ok) return library
  if (!library.projects.some(entry => entry.name === name)) return failure('SAVED_PROJECT_MISSING', 'That saved plan is no longer in this browser. Refresh the saved-plan list.')
  const projects = library.projects.filter(entry => entry.name !== name)
  try { storage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify({ schemaVersion: 1, projects })); return { ok: true, projects } }
  catch (error) { return storageFailure(error) }
}
