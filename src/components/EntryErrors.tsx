import type { ScheduleError } from '../domain'

export function FieldError({ errors, field, taskId, id }: {
  errors: readonly ScheduleError[]; field: string; taskId?: string; id: string
}) {
  const matching = errors.filter(error => error.taskId === taskId && error.field.split('/').includes(field))
  return <span id={id} className="field-error">{matching.map(error => error.message).join(' ')}</span>
}

export function EntryErrors({ errors }: { errors: readonly ScheduleError[] }) {
  if (!errors.length) return null
  return <div className="error-summary" role="alert">
    <strong>Check these entries</strong>
    <p>Calculated dates are unavailable until these entries are valid. Your saved data is kept.</p>
    <ul>{errors.map((error, index) => <li key={`${error.code}-${error.taskId}-${index}`}>
      {error.taskId && <strong>{error.taskId}: </strong>}{error.message}
    </li>)}</ul>
  </div>
}
