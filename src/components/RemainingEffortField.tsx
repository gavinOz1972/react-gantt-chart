import { useEffect, useId, useRef } from 'react'
import { formatEffort } from '../workTracking/workTracking'

export interface RemainingEffortDraft { taskId: string; fieldKey: string; text: string; error: string }
export function RemainingEffortField({ label, value, draft, disabled, onBegin, onChange, onCommit, onCancel }: {
  label: string; value: number | null; draft?: RemainingEffortDraft; disabled: boolean
  onBegin: () => void; onChange: (text: string) => void; onCommit: () => string | undefined; onCancel: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const finished = useRef(false)
  const descriptionId = useId()
  const editing = !!draft
  useEffect(() => {
    if (editing) { finished.current = false; input.current?.focus(); input.current?.select() }
  }, [editing])
  function finish(cancel = false, focus = false): boolean {
    if (finished.current) return true
    if (cancel) onCancel()
    else if (onCommit()) return false
    finished.current = true
    if (focus) requestAnimationFrame(() => trigger.current?.focus())
    return true
  }
  function tabTarget(backwards: boolean) {
    const container = root.current
    if (!container) return
    const targets = [...document.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]')]
      .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0)
    const candidates = backwards ? targets.reverse() : targets
    const direction = backwards ? Node.DOCUMENT_POSITION_PRECEDING : Node.DOCUMENT_POSITION_FOLLOWING
    return candidates.find(element => !container.contains(element) && !!(container.compareDocumentPosition(element) & direction))
  }
  return <div ref={root} className="remaining-quick-field" onKeyDown={event => {
    if (draft && event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); finish(true, true) }
  }}>
    <button ref={trigger} type="button" className="inline-value remaining-quick-value" hidden={editing} disabled={disabled} aria-label={`Edit ${label}`} aria-description={value === null ? 'Current remaining effort is unknown.' : `Current remaining effort is ${formatEffort(value)} hours.`} title="Edit remaining effort; blank means unknown" onClick={onBegin}>
      <span>{value === null ? <><span aria-hidden="true">—</span><span className="sr-only">Unknown</span></> : `${formatEffort(value)} h`}</span><span className="remaining-edit-label">Edit</span>
    </button>
    {draft && <>
      <div className="remaining-quick-input"><input ref={input} type="text" inputMode="decimal" aria-label={label} value={draft.text} aria-invalid={!!draft.error} aria-describedby={descriptionId}
        onChange={event => onChange(event.target.value)} onBlur={event => { if (!root.current?.contains(event.relatedTarget as Node | null)) finish() }}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(true, true) }
          else if (event.key === 'Enter') { event.preventDefault(); if (!finish(false, true)) input.current?.focus() }
          else if (event.key === 'Tab') {
            if (!finish()) { event.preventDefault(); return }
            event.preventDefault()
            const backwards = event.shiftKey
            requestAnimationFrame(() => (tabTarget(backwards) ?? trigger.current)?.focus())
          }
        }} /><span aria-hidden="true">h</span></div>
      <div className="remaining-quick-actions"><button type="button" className="quiet" aria-label={`Save ${label}`} onClick={() => { if (!finish(false, true)) input.current?.focus() }}>Save</button>
        <button type="button" className="quiet" aria-label={`Cancel ${label}`} onPointerDown={event => event.preventDefault()} onClick={() => finish(true, true)}>Cancel</button></div>
      <small id={descriptionId} className={draft.error ? 'field-error' : 'inline-help'} role={draft.error ? 'alert' : undefined}>{draft.error || 'Enter / Tab: save · Escape: cancel. Blank = Unknown.'}</small>
    </>}
  </div>
}
