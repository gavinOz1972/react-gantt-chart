import { useRef, useState } from 'react'

export function InlineField({ label, value, display, type = 'text', disabled, onCommit, onDraftChange }: {
  label: string; value: string; display?: string; type?: 'text' | 'number' | 'date' | 'multiline'; disabled: boolean
  onCommit: (value: string) => string | undefined; onDraftChange: (dirty: boolean) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')
  const button = useRef<HTMLButtonElement>(null)
  const finished = useRef(false)
  function finish(cancel = false, focus = false) {
    if (finished.current) return
    const problem = cancel ? undefined : onCommit(draft)
    if (problem) { setError(problem); return }
    finished.current = true
    setEditing(false); setError(''); onDraftChange(false)
    if (focus) requestAnimationFrame(() => button.current?.focus())
  }
  const props = {
    'aria-label': label, 'aria-invalid': !!error, autoFocus: true, value: draft,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setDraft(event.target.value); setError(''); onDraftChange(true) },
    onBlur: () => finish(),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(true, true) }
      else if (event.key === 'Enter' && (type !== 'multiline' || event.ctrlKey || event.metaKey)) { event.preventDefault(); finish(false, true) }
    },
  }
  return <div className="inline-field">
    <button ref={button} type="button" className="inline-value" hidden={editing} disabled={disabled} aria-label={`Edit ${label}`} onClick={() => {
      finished.current = false; setDraft(value); setError(''); setEditing(true); onDraftChange(true)
    }}>{display ?? (value || (type === 'multiline' ? 'Add description' : 'Edit'))}</button>
    {editing && <>{type === 'multiline' ? <textarea {...props} rows={4} /> : <input {...props} type={type} step={type === 'number' ? 1 : undefined} />}
      <small className="inline-help">{type === 'multiline' ? 'Enter: new line · Ctrl+Enter: save' : 'Enter or Tab: save'} · Escape: cancel</small>
      {error && <span className="field-error" role="alert">{error}</span>}</>}
  </div>
}
