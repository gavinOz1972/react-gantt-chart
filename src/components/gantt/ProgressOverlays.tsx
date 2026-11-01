import type { ScheduledTask } from '../../domain'
import type { TaskForecast } from '../../forecast/forecast'
import type { TimelineAxis, TimelineRow } from '../../timeline/projection'
import { clipOverlayPoint, forecastFinishDescription, forecastPoint, overlayPoint } from '../../timeline/overlays'

function EdgeMark({ x, y, direction }: { x: number; y: number; direction: string }) {
  const delta = direction.startsWith('before') ? 5 : -5
  return <path d={`M ${x + delta} ${y - 4} L ${x} ${y} L ${x + delta} ${y + 4}`} fill="none" strokeWidth={2} />
}
export function ProgressOverlays({ axis, row, baseline, baselineHours, forecast, showBaseline, showForecast, x, width, y, remainingHours }: {
  axis: TimelineAxis; row: TimelineRow; baseline?: ScheduledTask; baselineHours: number; forecast?: TaskForecast
  showBaseline: boolean; showForecast: boolean; x: (unit: number) => number; width: number; y: number
  remainingHours?: number | null
}) {
  const start = baseline ? overlayPoint(axis, baseline.startDate, (baseline.startSlot.hour - 1) / baselineHours) : null
  const end = baseline ? overlayPoint(axis, baseline.finishDate, baseline.finishBoundary.afterHour / baselineHours) : null
  const first = start ? clipOverlayPoint(start, x, width) : null
  const last = end ? clipOverlayPoint(end, x, width) : null
  const projected = forecast ? forecastPoint(axis, forecast) : null
  const point = projected ? clipOverlayPoint(projected, x, width) : null
  const location = (item: { clipping: string; omitted: boolean }) => `${item.clipping ? `; ${item.clipping.replaceAll('-', ' ')}: clipped edge indication, not a date at this edge` : ''}${item.omitted ? '; nonworking date omitted in compressed view: marker at collapsed calendar boundary' : ''}`
  const baselineLabel = baseline && first && last ? `Baseline ${row.taskId}: originally approved ${baseline.startDate} hour ${baseline.startSlot.hour} to ${baseline.finishDate} after hour ${baseline.finishBoundary.afterHour}${location(first)}${location(last)}. Original working-day proportions.` : ''
  const forecastLabel = forecast && point ? `${forecastFinishDescription(row.scheduled, forecast, remainingHours)}${location(point)}. ${forecast.finishPosition === null ? 'Recorded completion date; date-only endpoint at end of day.' : 'Exclusive fractional calendar-day endpoint from WP6.4.'}` : ''
  return <g className="progress-overlays">
    {showBaseline && baseline && first && last && <g className="baseline-overlay" role="img" tabIndex={0} aria-label={baselineLabel} data-overlay="baseline" data-task-id={row.taskId} data-start-date={baseline.startDate} data-finish-date={baseline.finishDate} data-start-unit={start!.unit} data-end-unit={end!.unit} data-clipped={first.clipping || last.clipping || 'none'} data-omitted={first.omitted || last.omitted}>
      <title>{baselineLabel}</title>
      <rect x={Math.min(first.x, last.x)} y={y + 43} width={Math.max(1, Math.abs(last.x - first.x))} height={5} fill="none" stroke="#64717e" strokeWidth={1.6} />
      {first.clipping && <EdgeMark x={first.x} y={y + 45} direction={first.clipping} />}
      {last.clipping && <EdgeMark x={last.x} y={y + 45} direction={last.clipping} />}
    </g>}
    {showForecast && forecast && projected && point && <g className="forecast-overlay" role="img" tabIndex={0} aria-label={forecastLabel} data-overlay="forecast" data-task-id={row.taskId} data-finish-date={forecast.forecastFinish!} data-end-unit={projected.unit} data-endpoint-x={point.x} data-clipped={point.clipping || 'none'} data-omitted={point.omitted}>
      <title>{forecastLabel}</title>
      <path d={`M ${Math.max(0, Math.min(width, x(row.end)))} ${y + 7} H ${point.x}`} fill="none" stroke="#704496" strokeWidth={1.6} strokeDasharray="4 3" />
      {point.clipping ? <EdgeMark x={point.x} y={y + 7} direction={point.clipping} /> : point.omitted ? <path d={`M ${point.x - 4} ${y + 3} H ${point.x + 4} V ${y + 11} H ${point.x - 4} Z M ${point.x - 4} ${y + 3} L ${point.x + 4} ${y + 11}`} fill="white" stroke="#704496" /> : <path d={`M ${point.x} ${y + 2} L ${point.x + 5} ${y + 7} L ${point.x} ${y + 12} L ${point.x - 5} ${y + 7} Z`} fill="white" stroke="#704496" strokeWidth={1.6} />}
      <text x={point.x > width - 28 ? point.x - 9 : point.x + 9} y={y + 10} textAnchor={point.x > width - 28 ? 'end' : 'start'} fill="#5f3385" stroke="none" fontSize={9}>FF</text>
    </g>}
  </g>
}
