import { useState } from 'react'
import { decodeForecastSettings } from '../../forecast/settings'
import type { ForecastSettings } from '../../forecast/settings'
import { localDate } from '../progress/localDate'
import { useLocalDate } from '../progress/useLocalDate'

const fields = [['classHoursPerStudent', 'Class hours per student per week'], ['homeworkHoursPerStudent', 'Homework hours per student per week'], ['teamSize', 'Team size']] as const
const toDraft = (value?: ForecastSettings) => ({ enabled: value?.enabled ?? false, classHoursPerStudent: String(value?.classHoursPerStudent ?? 0), homeworkHoursPerStudent: String(value?.homeworkHoursPerStudent ?? 0), teamSize: String(value?.teamSize ?? 1), dateMode: value?.asOfDate === undefined ? 'automatic' as const : 'fixed' as const, asOfDate: value?.asOfDate ?? localDate() })
export function ForecastSettingsForm({ value, disabled, onChange, onDraftChange }: { value?: ForecastSettings; disabled: boolean; onChange: (value: ForecastSettings) => void; onDraftChange: (dirty: boolean) => void }) {
  const [draft, setDraft] = useState(() => toDraft(value))
  const [error, setError] = useState('')
  const today = useLocalDate()
  function change(next: typeof draft) {
    setDraft(next)
    const numbers = fields.map(([key]) => next[key].trim() === '' ? NaN : Number(next[key]))
    const checked = decodeForecastSettings({ schemaVersion: 1, enabled: next.enabled, classHoursPerStudent: numbers[0], homeworkHoursPerStudent: numbers[1], teamSize: numbers[2], ...(next.dateMode === 'fixed' ? { asOfDate: next.asOfDate } : {}) })
    if (!checked.ok) { setError(checked.errors[0].message); onDraftChange(true); return }
    setError(''); onDraftChange(false); onChange(checked.value)
  }
  return <section className="panel" aria-labelledby="forecast-settings-heading">
    <div className="section-heading"><h2 id="forecast-settings-heading">Forecast assumptions</h2></div>
    <p className="muted">Each hour input is per student. Weekly team capacity = (class + homework) × team size, in person-hours. A shared pool spread evenly across all seven calendar days is an approximation, without individual availability or concurrency guarantees.</p>
    <fieldset className="settings-fields" disabled={disabled}><legend className="sr-only">Forecast capacity settings</legend>
      <label className="wide checkbox-label"><input type="checkbox" checked={draft.enabled} onChange={event => change({ ...draft, enabled: event.target.checked })} />Enable effort-based forecasting</label>
      {fields.map(([key, label]) => <label key={key}>{label}<input type="number" min={key === 'teamSize' ? '1' : '0'} max={key === 'teamSize' ? '10000' : '1000000'} step={key === 'teamSize' ? '1' : '0.01'} value={draft[key]} onChange={event => change({ ...draft, [key]: event.target.value })} aria-invalid={!!error} aria-describedby="forecast-settings-error" /></label>)}
      <fieldset className="forecast-date-mode wide"><legend>Forecast date mode</legend>
        <label><input type="radio" name="forecast-date-mode" value="automatic" checked={draft.dateMode === 'automatic'} onChange={() => change({ ...draft, dateMode: 'automatic' })} />Automatic — Use today's local date</label>
        <label><input type="radio" name="forecast-date-mode" value="fixed" checked={draft.dateMode === 'fixed'} onChange={() => change({ ...draft, dateMode: 'fixed', asOfDate: draft.dateMode === 'automatic' ? today : draft.asOfDate })} />Fixed — Use a selected date</label>
        {draft.dateMode === 'fixed' ? <label>Forecast As-of date<input type="date" value={draft.asOfDate} onChange={event => change({ ...draft, asOfDate: event.target.value })} aria-invalid={!!error} aria-describedby="forecast-settings-error" /></label>
          : <p className="muted">Automatic As-of: {today}</p>}
      </fieldset>
      {error && <button type="button" className="quiet" onClick={() => { setDraft(toDraft(value)); setError(''); onDraftChange(false) }}>Revert invalid forecast entries</button>}
    </fieldset>
    <p className="muted">Valid changes update the projection immediately. {draft.dateMode === 'fixed' ? 'Using a fixed scenario date.' : 'As-of follows today locally.'} Capacity through target includes both endpoint dates and prorates partial weeks. These settings do not change the committed calendar or baseline.</p>
    {error && <p id="forecast-settings-error" role="alert" className="field-error">{error} Forecast unavailable until corrected or reverted.</p>}
  </section>
}
