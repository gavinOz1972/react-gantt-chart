// @vitest-environment node
import { expect, test } from 'vitest'
import { initialProject } from '../components/projectEntry'
import { createProjectFile } from './projectFile'
import { deleteLocalProject, LOCAL_PROJECTS_KEY, readLocalProjects, saveLocalProject } from './localProjects'
import type { StoragePort } from './localProjects'

function storage() {
  const values = new Map<string, string>()
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}
function plan() {
  const file = createProjectFile({ project: initialProject, tasks: [], nextTaskNumber: 1 }, '2026-10-31T05:00:00.000Z')
  if (!file.ok) throw new Error('Invalid fixture')
  return file.value
}
test('multiple named plans save and reopen without overwriting other entries', () => {
  const local = storage()
  expect(saveLocalProject(local, 'First', plan()).ok).toBe(true)
  expect(saveLocalProject(local, 'Second', plan()).ok).toBe(true)
  const loaded = readLocalProjects(local)
  expect(loaded.ok).toBe(true)
  if (loaded.ok) expect(loaded.projects.map(entry => entry.name)).toEqual(['First', 'Second'])
})
test('overwrite and deletion are refused without explicit confirmation', () => {
  const local = storage()
  saveLocalProject(local, 'First', plan())
  const before = local.values.get(LOCAL_PROJECTS_KEY)
  expect(saveLocalProject(local, 'First', plan()).ok).toBe(false)
  expect(deleteLocalProject(local, 'First', false).ok).toBe(false)
  expect(local.values.get(LOCAL_PROJECTS_KEY)).toBe(before)
  expect(saveLocalProject(local, 'First', plan(), true).ok).toBe(true)
  expect(deleteLocalProject(local, 'First', true)).toEqual({ ok: true, projects: [] })
})
test('corrupted local data is reported and preserved', () => {
  const local = storage()
  local.values.set(LOCAL_PROJECTS_KEY, '{broken')
  expect(readLocalProjects(local).ok).toBe(false)
  expect(saveLocalProject(local, 'New', plan()).ok).toBe(false)
  expect(local.values.get(LOCAL_PROJECTS_KEY)).toBe('{broken')
})
test('quota and blocked storage failures are actionable, with no successful-save claim', () => {
  const full: StoragePort = { getItem: () => null, setItem: () => { throw { name: 'QuotaExceededError' } } }
  const result = saveLocalProject(full, 'Plan', plan())
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.error.code).toBe('STORAGE_FULL')
  const blocked = readLocalProjects({ getItem: () => { throw new Error('blocked') }, setItem: () => {} })
  expect(blocked.ok).toBe(false)
  if (!blocked.ok) expect(blocked.error.code).toBe('STORAGE_UNAVAILABLE')
})
