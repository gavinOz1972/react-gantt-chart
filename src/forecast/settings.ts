import { dateToOrdinal } from '../domain'
import { record } from '../persistence/planInputs'

export interface ForecastSettings {
  readonly schemaVersion: 1
  readonly enabled: boolean
  readonly classHoursPerStudent: number
  readonly homeworkHoursPerStudent: number
  readonly teamSize: number
  /** Omitted means today's local calendar date, supplied by the caller. */
  readonly asOfDate?: string
}
export function decodeForecastSettings(value: unknown): { ok: true; value: ForecastSettings } | { ok: false; errors: { code: string; message: string }[] } {
  const fail = (message: string) => ({ ok: false as const, errors: [{ code: 'INVALID_FORECAST_SETTINGS', message }] })
  if (!record(value) || value.schemaVersion !== 1 || typeof value.enabled !== 'boolean') return fail('Forecast settings require version 1 and an enabled boolean.')
  const hours = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1_000_000 && Math.abs(n * 100 - Math.round(n * 100)) < 1e-6
  if (!hours(value.classHoursPerStudent) || !hours(value.homeworkHoursPerStudent)) return fail('Forecast hours must be nonnegative, finite, at most 1,000,000 and have at most two decimal places.')
  if (!Number.isSafeInteger(value.teamSize) || Number(value.teamSize) < 1 || Number(value.teamSize) > 10_000) return fail('Team size must be a whole number from 1 to 10,000.')
  if (value.asOfDate !== undefined) {
    try { if (typeof value.asOfDate !== 'string') throw new Error(); dateToOrdinal(value.asOfDate) } catch { return fail('Choose a valid forecast As-of date.') }
  }
  return { ok: true, value: { schemaVersion: 1, enabled: value.enabled, classHoursPerStudent: value.classHoursPerStudent, homeworkHoursPerStudent: value.homeworkHoursPerStudent, teamSize: Number(value.teamSize), ...(value.asOfDate === undefined ? {} : { asOfDate: String(value.asOfDate) }) } }
}
