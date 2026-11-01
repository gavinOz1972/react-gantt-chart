import type { ScheduleError, Weekday } from '../domain'
import type { ProjectDraft } from './projectEntry'
import { FieldError } from './EntryErrors'

const weekdays: [Weekday, string][] = [[1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday'], [0, 'Sunday']]

export function ProjectSettingsForm({ draft, errors, disabled, dirty, onChange, onCommit, onRevert }: {
  draft: ProjectDraft; errors: readonly ScheduleError[]; disabled: boolean; dirty: boolean
  onChange: (draft: ProjectDraft) => void; onCommit: (draft: ProjectDraft) => void; onRevert: () => void
}) {
  function changeDays(day: Weekday, checked: boolean) {
    const next = { ...draft, workingWeekdays: checked ? [...draft.workingWeekdays, day] : draft.workingWeekdays.filter(value => value !== day) }
    onChange(next)
    onCommit(next)
  }
  const error = (field: string) => <FieldError errors={errors} field={field} id={`project-${field}-error`} />
  const invalid = (field: string) => errors.some(entry => !entry.taskId && entry.field.split('/').includes(field))
  return <section className="panel" aria-labelledby="project-settings-heading">
    <div className="section-heading"><div><span className="eyebrow">01 / Calendar</span><h2 id="project-settings-heading">Project settings</h2></div>
      {dirty && <button type="button" className="quiet" disabled={disabled} onClick={onRevert}>Revert settings</button>}</div>
    <p className="muted">Settings apply when you leave a field. Weekday changes apply immediately.</p>
    {disabled && <p className="muted">Finish or cancel task and effort edits to change project settings.</p>}
    <fieldset disabled={disabled} className="settings-fields">
      <legend className="sr-only">Project calendar settings</legend>
      <label className="wide">Project name<input value={draft.name} onChange={event => onChange({ ...draft, name: event.target.value })}
        onBlur={() => onCommit(draft)} aria-invalid={invalid('name')} aria-describedby="project-name-error" />{error('name')}</label>
      <label>Project start date<input type="date" value={draft.projectStartDate} onChange={event => onChange({ ...draft, projectStartDate: event.target.value })}
        onBlur={() => onCommit(draft)} aria-invalid={invalid('projectStartDate')} aria-describedby="project-projectStartDate-error" />{error('projectStartDate')}</label>
      <label>Target end date<input type="date" value={draft.targetEndDate} onChange={event => onChange({ ...draft, targetEndDate: event.target.value })}
        onBlur={() => onCommit(draft)} aria-invalid={invalid('targetEndDate')} aria-describedby="project-targetEndDate-error" />{error('targetEndDate')}</label>
      <label>Working hours per day<input type="number" min="1" step="1" value={draft.workingHoursPerDay}
        onChange={event => onChange({ ...draft, workingHoursPerDay: event.target.value })} onBlur={() => onCommit(draft)}
        aria-invalid={invalid('workingHoursPerDay')} aria-describedby="project-workingHoursPerDay-error" />{error('workingHoursPerDay')}</label>
      <fieldset className="weekday-field wide" aria-describedby="project-workingWeekdays-error">
        <legend>Working weekdays</legend><div className="weekday-options">{weekdays.map(([day, label]) => <label key={day}>
          <input type="checkbox" checked={draft.workingWeekdays.includes(day)} onChange={event => changeDays(day, event.target.checked)} />{label}
        </label>)}</div>{error('workingWeekdays')}
      </fieldset>
    </fieldset>
  </section>
}
