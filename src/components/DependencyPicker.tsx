import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TaskInput } from '../domain'

export function DependencyPicker({ taskId, tasks, selected, disabled = false, compact = false, optionError, onCommit, onDraftChange }: {
  taskId: string; tasks: readonly TaskInput[]; selected: readonly string[]; disabled?: boolean; compact?: boolean
  optionError: (predecessors: readonly string[]) => string | undefined
  onCommit: (predecessors: string[]) => string | undefined; onDraftChange?: (dirty: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>([])
  const [error, setError] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0, width: 360, maxHeight: 380 })
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const openNow = useRef(false)
  const suppressClick = useRef(false)
  const finishRef = useRef<(cancel?: boolean) => boolean>(() => false)
  const popupId = useId()
  function finish(cancel = false) {
    if (!openNow.current) return true
    const changed = draft.length !== selected.length || draft.some(id => !selected.includes(id))
    const problem = cancel || !changed ? undefined : onCommit([...draft])
    if (problem) { setError(problem); popup.current?.focus({ preventScroll: true }); return false }
    openNow.current = false
    setOpen(false); setError(''); onDraftChange?.(false)
    trigger.current?.focus({ preventScroll: true })
    return true
  }
  useLayoutEffect(() => { finishRef.current = finish })
  // These listeners outlive the open panel, so the click following an outside
  // pointerdown is consumed even after a valid commit has closed the portal.
  useEffect(() => {
    const inside = (event: Event) => event.composedPath().some(node => node === trigger.current || node === popup.current)
    const consume = (event: Event) => { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation() }
    const pointer = (event: PointerEvent) => {
      suppressClick.current = false
      if (!openNow.current || inside(event)) return
      suppressClick.current = true; consume(event); finishRef.current()
    }
    const click = (event: MouseEvent) => {
      if (suppressClick.current) {
        suppressClick.current = false
        // Disabled controls may emit pointerdown without a following click.
        // Never consume a later keyboard/assistive activation of Done/Cancel.
        if (event.detail > 0) { consume(event); return }
      }
      // Also handle keyboard/assistive clicks without a preceding pointer event.
      if (openNow.current && !inside(event)) { consume(event); finishRef.current() }
    }
    const focus = (event: FocusEvent) => { if (openNow.current && !inside(event)) finishRef.current() }
    document.addEventListener('pointerdown', pointer, true)
    document.addEventListener('click', click, true)
    document.addEventListener('focusin', focus, true)
    return () => {
      document.removeEventListener('pointerdown', pointer, true)
      document.removeEventListener('click', click, true)
      document.removeEventListener('focusin', focus, true)
    }
  }, [])
  useLayoutEffect(() => {
    if (!open) return
    const positionPopup = () => {
      const rect = trigger.current?.getBoundingClientRect()
      if (!rect) return
      const below = window.innerHeight - rect.bottom - 18
      const above = rect.top - 18
      const useBelow = below >= Math.min(300, above)
      const maxHeight = Math.max(100, Math.min(400, useBelow ? below : above))
      const width = Math.min(420, window.innerWidth - 24)
      setPosition({ width, maxHeight, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), top: useBelow ? rect.bottom + 6 : Math.max(12, rect.top - maxHeight - 6) })
    }
    positionPopup()
    popup.current?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus({ preventScroll: true })
    window.addEventListener('resize', positionPopup)
    window.addEventListener('scroll', positionPopup, true)
    return () => { window.removeEventListener('resize', positionPopup); window.removeEventListener('scroll', positionPopup, true) }
  }, [open])
  function keyDown(event: React.KeyboardEvent) {
    if (!openNow.current || !['Enter', 'Escape'].includes(event.key)) return
    if (event.key === 'Enter' && (event.target as HTMLElement).closest('[data-dependency-cancel]')) return
    event.preventDefault(); event.stopPropagation()
    finish(event.key === 'Escape')
  }
  function toggle(id: string) {
    const next = draft.includes(id) ? draft.filter(value => value !== id) : [...draft, id]
    setDraft(next); setError('')
    onDraftChange?.(next.length !== selected.length || next.some(value => !selected.includes(value)))
  }
  return <>
    <button ref={trigger} type="button" className={`dependency-trigger${compact ? ' compact' : ''}`} aria-label={`${taskId} predecessors`} aria-expanded={open} aria-controls={open ? popupId : undefined}
      disabled={disabled && !open} onKeyDown={keyDown} onClick={() => {
        if (openNow.current) { finish(); return }
        setDraft([...selected]); setError(''); openNow.current = true; setOpen(true)
      }}><svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"><path d={open ? 'M1 3l4 4 4-4' : 'M3 1l4 4-4 4'} fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      {compact ? selected.length ? `Predecessors (${selected.length})` : 'None' : `Predecessors (${selected.length} selected)`}
    </button>
    {open && createPortal(<div ref={popup} id={popupId} tabIndex={-1} className="dependency-popover" style={position} role="group" aria-label={`${taskId} predecessor selection`} onKeyDown={keyDown}>
      <div className="dependency-popover-heading"><strong>{taskId} predecessors · {draft.length} selected</strong><small>Done, Enter or outside click saves. Escape cancels. An outside click only closes this picker.</small></div>
      <div className="dependency-choices" role="region" aria-label={`${taskId} predecessor options`} tabIndex={0}>
      <fieldset><legend className="sr-only">Choose predecessor tasks</legend>
        {!tasks.length && <p className="muted">Save another task first to add a predecessor.</p>}
        {tasks.map(task => {
          const checked = draft.includes(task.taskId)
          const problem = task.taskId === taskId ? 'A task cannot depend on itself.' : checked ? undefined : optionError([...draft, task.taskId])
          return <label className="dependency-option" key={task.taskId}>
            <input type="checkbox" aria-label={`${taskId} predecessor ${task.taskId} — ${task.name}`} checked={checked} disabled={task.taskId === taskId} onChange={() => toggle(task.taskId)} />
            <span>{task.taskId} — {task.name}{problem && <small className="field-error">{problem}</small>}</span>
          </label>
        })}
      </fieldset></div>
      {error && <p className="field-error dependency-error" role="alert">{error}</p>}
      <div className="dependency-popover-actions"><button type="button" onClick={() => finish()}>Done</button><button type="button" className="quiet" data-dependency-cancel onClick={() => finish(true)}>Cancel</button></div>
    </div>, document.body)}
  </>
}
