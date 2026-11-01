import { useState } from 'react'

export function DefinitionOfDone({ value, disabled, onCommit, onDraftChange }: { value: string; disabled: boolean; onCommit: (text: string) => string | undefined; onDraftChange: (dirty: boolean) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState('')
  function cancel() { setDraft(null); setError(''); onDraftChange(false) }
  return <section className="panel" aria-labelledby="definition-heading"><h2 id="definition-heading">Project Definition of Done</h2>
    <p className="muted">Optional guidance shown when confirming task completion. It does not create criteria or change the approved baseline.</p>
    <form noValidate onSubmit={event => { event.preventDefault(); const problem = onCommit(draft ?? value); if (problem) setError(problem); else cancel() }}>
      <label>Definition of Done<textarea aria-label="Definition of Done" disabled={disabled} rows={3} value={draft ?? value} onChange={event => { setDraft(event.target.value); setError(''); onDraftChange(true) }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); cancel() } }} aria-describedby="definition-help" /></label>
      <small id="definition-help">Plain text, up to 2,000 characters. Blank means no project-level definition.</small>
      {draft !== null && <div className="form-actions"><button type="submit" disabled={disabled}>Save Definition of Done</button><button type="button" className="quiet" onClick={cancel}>Cancel definition</button></div>}
      {error && <p role="alert" className="field-error">{error}</p>}
    </form></section>
}
