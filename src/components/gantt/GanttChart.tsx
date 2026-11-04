import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { dateToOrdinal } from '../../domain'
import type { ReactNode } from 'react'
import type { CriticalPathResult, ProjectSettings, ScheduleResult, TaskInput } from '../../domain'
import { TaskInspection } from '../TaskInspection'
import { connectorPath, createTimelineAxis, HEADER_HEIGHT, LABEL_WIDTH, pixelsPerUnit, projectTimeline, ROW_HEIGHT, taskSegments, timelineWindow, visibleDays, visibleHourTicks } from '../../timeline/projection'
import type { TimelineMode, TimelineZoom } from '../../timeline/projection'
import { TimelineHeader } from './TimelineHeader'
import type { Baseline } from '../../baseline/baseline'
import type { Forecast } from '../../forecast/forecast'
import { taskHealthDescription } from '../../progress/healthPresentation'
import type { TaskHealth } from '../../progress/healthPresentation'
import { TaskHealthBadge } from '../progress/HealthBadge'
import { ProgressOverlays } from './ProgressOverlays'
import { comparisonDescription } from '../../timeline/overlays'
import type { ProgressImpact } from '../../projection/progressImpact'
import { ImpactSummary } from './ImpactSummary'
import { ActualImpactOverlays } from './ActualImpactOverlays'
import type { TimelineAxis } from '../../timeline/projection'

export function GanttChart({ project, tasks, result, selectedTaskId, previewing, onSelect, onDismissSelection, analysis, highlightCritical = false, onHighlightChange, showInspection = true, children, baseline, forecast, health, showBaseline = false, showForecast = false, onBaselineChange, onForecastChange, invalidForecast = false, remainingHours = {}, impact, paAsOf = '', onPaAsOfChange, onPaToday }: {
  project: ProjectSettings; tasks: readonly TaskInput[]; result: ScheduleResult; selectedTaskId: string | null
  previewing: boolean; onSelect: (id: string) => void
  analysis?: CriticalPathResult; highlightCritical?: boolean; onHighlightChange?: (enabled: boolean) => void
  showInspection?: boolean
  children?: ReactNode
  onDismissSelection?: () => void
  baseline?: Baseline; forecast?: Forecast; health?: ReadonlyMap<string, TaskHealth>
  showBaseline?: boolean; showForecast?: boolean; onBaselineChange?: (value: boolean) => void; onForecastChange?: (value: boolean) => void; invalidForecast?: boolean
  remainingHours?: Readonly<Record<string, number | null>>
  impact?: ProgressImpact; paAsOf?: string; onPaAsOfChange?: (date: string) => void; onPaToday?: () => void
}) {
  const [mode, setMode] = useState<TimelineMode>('expanded')
  const [zoom, setZoom] = useState<TimelineZoom>('hour')
  const [viewport, setViewport] = useState({ left: 0, top: 0, width: 1000, height: 440 })
  const [inspectedLink, setInspectedLink] = useState('')
  const scroll = useRef<HTMLDivElement>(null)
  const patternId = useId().replace(/:/g, '')
  const arrowId = `${patternId}-arrow`
  const model = useMemo(() => {
    if (!result.ok || !result.tasks.length) return null
    try {
      const dates = impact?.ok ? impact.tasks.flatMap(t => [t.completion?.date, t.start?.date, t.finish?.date].filter((d): d is string => !!d)) : []
      const axis = createTimelineAxis(project, result.tasks, mode, dates)
      return { axis, ...projectTimeline(axis, tasks, result.tasks) }
    } catch (error) {
      if (!(error instanceof RangeError)) throw error
      return { message: error.message }
    }
  }, [project, tasks, result, mode, impact])

  const hasTimeline = !!model && 'axis' in model
  useEffect(() => {
    const element = scroll.current
    if (!element) return
    const measure = () => setViewport(value => ({ ...value, width: element.clientWidth || 1000, height: element.clientHeight || 440 }))
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : undefined
    observer?.observe(element)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [hasTimeline])

  const geometry = model && 'axis' in model ? model : null
  const axis = geometry?.axis
  const scale = axis ? pixelsPerUnit(axis, zoom) : 1
  const view = timelineWindow(axis?.totalUnits ?? 1, scale, viewport.width - LABEL_WIDTH, viewport.left)
  const previousAxis = useRef<{ axis: TimelineAxis; zoom: TimelineZoom; left: number; width: number } | null>(null)
  useLayoutEffect(() => {
    if (!axis) { previousAxis.current = null; return }
    const previous = previousAxis.current
    previousAxis.current = { axis, zoom, left: viewport.left, width: viewport.width }
    const element = scroll.current
    if (!previous || !element || (previous.axis === axis && previous.zoom === zoom)) return
    // Preserve the established scale/mode reset policy. Only derived extent
    // changes retain the visible calendar anchor; general C10 is out of scope.
    if (previous.axis.mode !== axis.mode || previous.zoom !== zoom) return
    const oldView = timelineWindow(previous.axis.totalUnits, pixelsPerUnit(previous.axis, previous.zoom), previous.width - LABEL_WIDTH, previous.left)
    const ordinal = previous.axis.ordinalAt(oldView.left)
    const span = previous.axis.dayEnd(ordinal) - previous.axis.dayStart(ordinal)
    const fraction = span ? (oldView.left - previous.axis.dayStart(ordinal)) / span : 0
    const unit = axis.dayStart(ordinal) + fraction * (axis.dayEnd(ordinal) - axis.dayStart(ordinal))
    const available = axis.totalUnits - view.width / scale
    const left = available > 0 ? Math.max(0, Math.min(1, unit / available)) * (view.scrollWidth - view.width) : 0
    element.scrollLeft = left
    setViewport(v => ({ ...v, left }))
  }, [axis, zoom, viewport.left, viewport.width, view.width, view.scrollWidth, scale])
  const days = axis ? visibleDays(axis, view.left, view.right) : []
  const firstRow = Math.min(Math.max(0, tasks.length - 1), Math.max(0, Math.floor((viewport.top - HEADER_HEIGHT) / ROW_HEIGHT) - 2))
  const lastRow = Math.min(tasks.length, Math.ceil((viewport.top + viewport.height) / ROW_HEIGHT) + 2)
  const rows = geometry?.rows.slice(firstRow, lastRow) ?? []
  const bodyHeight = (lastRow - firstRow) * ROW_HEIGHT
  const selected = tasks.find(task => task.taskId === selectedTaskId)
  const selectedSchedule = result.ok ? result.tasks.find(task => task.taskId === selectedTaskId) : undefined
  const analyzed = new Map(analysis?.ok ? analysis.tasks.map(task => [task.taskId, task]) : [])
  const criticalLinks = new Set(analysis?.ok ? analysis.relationships.filter(link => link.critical).map(link => link.key) : [])
  const baselineById = new Map(baseline?.schedule.tasks.map(task => [task.taskId, task]) ?? [])
  const forecastById = new Map(!invalidForecast ? forecast?.tasks.map(task => [task.taskId, task]) ?? [] : [])
  const canShowForecast = !!forecast && forecast.state !== 'Disabled' && !invalidForecast
  const forecastVisible = showForecast && canShowForecast
  const forecastHelp = invalidForecast ? 'Correct invalid forecast assumptions in Project Settings.' : !forecast || forecast.state === 'Disabled' ? 'Enable effort-based forecasting in Project Settings to show forecast annotations.' : ''
  const impactById = new Map(impact?.ok ? impact.tasks.map(t => [t.taskId, t]) : [])

  function resetScroll() {
    if (scroll.current) scroll.current.scrollLeft = 0
    setViewport(value => ({ ...value, left: 0 }))
  }
  function goToSelected() {
    const row = geometry?.rows.find(task => task.taskId === selectedTaskId)
    const element = scroll.current
    if (!row || !element || !axis) return
    const unitsAvailable = Math.max(0, axis.totalUnits - view.width / scale)
    element.scrollLeft = unitsAvailable ? Math.max(0, row.start - 20 / scale) / unitsAvailable * (view.scrollWidth - view.width) : 0
    element.scrollTop = Math.max(0, row.index * ROW_HEIGHT - ROW_HEIGHT)
    setViewport(value => ({ ...value, left: element.scrollLeft, top: element.scrollTop }))
  }
  function goToImpact(id: string) {
    const row = geometry?.rows.find(t => t.taskId === id), item = impactById.get(id), element = scroll.current
    if (!row || !element || !axis || !item) return
    onSelect(id)
    const unit = item.start ? axis.startAt(item.start) : item.completion ? axis.dayStart(dateToOrdinal(item.completion.date)) : row.start
    const available = axis.totalUnits - view.width / scale
    element.scrollLeft = available > 0 ? Math.max(0, Math.min(1, (unit - 25 / scale) / available)) * (view.scrollWidth - view.width) : 0
    element.scrollTop = Math.max(0, row.index * ROW_HEIGHT - ROW_HEIGHT)
    setViewport(v => ({ ...v, left: element.scrollLeft, top: element.scrollTop }))
    element.focus({ preventScroll: true })
  }

  return <section className="panel gantt-panel" aria-labelledby="gantt-heading" onKeyDown={event => {
    if (event.key !== 'Escape' || event.defaultPrevented || !selectedTaskId || (event.target as Element).closest('input,textarea,select,dialog')) return
    event.preventDefault(); onDismissSelection?.()
  }}>
    <div className="section-heading"><div><span className="eyebrow">01 / Timeline</span><h2 id="gantt-heading">Gantt chart</h2></div>
      <span className="preview-label">{previewing ? 'Unsaved preview' : 'Live schedule'}</span></div>
    <div className="gantt-toolbar">
      <div role="group" aria-label="Timeline representation" className="gantt-mode">
        <button type="button" aria-pressed={mode === 'expanded'} onClick={() => { setMode('expanded'); resetScroll() }}>Expanded</button>
        <button type="button" aria-pressed={mode === 'compressed'} onClick={() => { setMode('compressed'); resetScroll() }}>Compressed</button>
      </div>
      <label className="gantt-zoom">Scale<select value={zoom} onChange={event => { setZoom(event.target.value as TimelineZoom); resetScroll() }}>
        <option value="hour">Hour</option><option value="day">Day</option><option value="week">Week</option>
      </select></label>
      <button className="quiet" type="button" data-dismiss-focus onClick={resetScroll}>Go to start</button>
      <button className="quiet" type="button" disabled={!selected || !geometry} onClick={goToSelected}>Go to selected task</button>
      {analysis && tasks.length > 0 && <label className="critical-toggle"><input type="checkbox" checked={highlightCritical} disabled={!analysis.ok} onChange={event => onHighlightChange?.(event.target.checked)} />Highlight Critical Path</label>}
      <label className="overlay-toggle"><input type="checkbox" checked={showBaseline && !!baseline} disabled={!baseline} aria-describedby="overlay-help" onChange={event => onBaselineChange?.(event.target.checked)} />Show Baseline</label>
      <label className="overlay-toggle"><input type="checkbox" checked={forecastVisible} disabled={!canShowForecast} aria-describedby="forecast-visibility-help overlay-help" onChange={event => onForecastChange?.(event.target.checked)} />Show Forecast</label>
      <span id="forecast-visibility-help" className="muted forecast-toggle-help">{forecastHelp}</span>
    </div>
    {impact && <ImpactSummary impact={impact} asOf={paAsOf} onAsOfChange={onPaAsOfChange} onToday={onPaToday} onGo={goToImpact} previewing={previewing} />}
    {impact && <p className="gantt-legend">A: actual date (time unknown) · PA: conditional progress-adjusted outline · PA ?: Unknown. These cues are always visible. FF remains the optional effort forecast.</p>}
    <p className="gantt-help" id="gantt-help">Expanded keeps every calendar day, with hatched nonworking gaps. Compressed joins working slots and omits nonworking dates. Neither view changes the schedule.</p>
    <div className="gantt-legend" aria-label="Chart legend"><span><i className="legend-work" />Occupied working time</span><span><i className="legend-gap" />Nonworking elapsed time</span><span><i className="legend-link" />Finish-to-start dependency</span></div>
    <p id="overlay-help" className="muted overlay-help">{!baseline && 'Establish a baseline in Project Settings to show original dates. '}{(showBaseline || forecastVisible) && 'Overlays are read-only. Edge chevrons mean dates outside the visible range; a crossed forecast marker means a nonworking date omitted in Compressed view. Committed bars and range stay fixed.'}{forecastVisible && ' FF means Forecast Finish, even to the left of a committed bar. Dashed length represents a difference between calendar dates, not effort hours or scheduled working slots. Task Forecast Slip compares against its own commitment; project At Risk compares against the project target.'}{forecastVisible && previewing && ' Forecasts use the accepted plan; task/calendar edits remain previews until saved.'}</p>
    {(showBaseline || forecastVisible) && <div className="gantt-legend overlay-legend" aria-label="Overlay legend"><span><i className="legend-work" />Committed plan</span>{showBaseline && <span><i className="legend-baseline" />Baseline: originally approved plan</span>}{forecastVisible && <span><i className="legend-forecast" />FF: Forecast Finish (calendar date)</span>}{forecastVisible && <span>Unavailable or indeterminate forecasts have no endpoint.</span>}</div>}
    {analysis?.ok && tasks.length > 0 && <p className="critical-help">{analysis.tasks.filter(task => task.critical).length} critical tasks. Zero slack means no working-slot delay is possible without moving calculated completion. The target date is not the critical-path deadline.{highlightCritical && <span className="critical-badge">Critical work · bold outline and label; hatching still means nonworking time</span>}</p>}
    <p className="muted gantt-convention">Each selected day is divided into {project.workingHoursPerDay} numbered working slots, not wall-clock hours. {mode === 'compressed' ? 'Date jumps in the header show omitted nonworking days.' : 'Hatching is elapsed time, not performed effort.'} Click or focus a bar to inspect a task.</p>
    {!result.ok ? <p className="gantt-state" role="status">Timeline unavailable. Correct the entries above to show the current schedule.</p>
      : !tasks.length ? <p className="gantt-state">No tasks to plot yet. Add a task to see its working time and calendar span.</p>
        : model && 'message' in model ? <p className="gantt-state" role="status">{model.message}</p>
          : geometry && axis && <div ref={scroll} className="gantt-scroll" role="region" aria-label="Scrollable Gantt timeline" aria-describedby="gantt-help" tabIndex={0}
            onScroll={event => { const element = event.currentTarget; setViewport({ left: element.scrollLeft, top: element.scrollTop, width: element.clientWidth || 1000, height: element.clientHeight || 440 }) }}>
            <div className="gantt-surface" style={{ width: LABEL_WIDTH + view.scrollWidth, height: HEADER_HEIGHT + geometry.rows.length * ROW_HEIGHT }}>
              <div className="gantt-header" style={{ height: HEADER_HEIGHT }}>
                <div className="gantt-corner" style={{ width: LABEL_WIDTH, height: HEADER_HEIGHT }}>Task / total hours</div>
                <div className="gantt-header-window" style={{ left: viewport.left + LABEL_WIDTH, width: view.width }}><TimelineHeader axis={axis} days={days} zoom={zoom} x={view.x} width={view.width} left={view.left} right={view.right} scale={scale} /></div>
              </div>
              {rows.map(row => <div key={row.taskId} className={`gantt-row${selectedTaskId === row.taskId ? ' selected' : ''}`} style={{ top: HEADER_HEIGHT + row.index * ROW_HEIGHT, height: ROW_HEIGHT }}>
                <button type="button" className="gantt-row-label" style={{ width: LABEL_WIDTH, height: ROW_HEIGHT }} aria-label={`Inspect ${row.taskId} ${row.task.name}`} aria-description={`${health?.get(row.taskId) ? `${taskHealthDescription(health.get(row.taskId)!, forecastVisible)} ` : ''}${comparisonDescription(row.scheduled, baselineById.get(row.taskId), forecastById.get(row.taskId), !!baseline, forecastVisible)}`} aria-pressed={selectedTaskId === row.taskId} onClick={() => onSelect(row.taskId)}>
                  <span className="gantt-row-identity"><span className="task-id">{row.taskId}</span>{health?.get(row.taskId) && <TaskHealthBadge health={health.get(row.taskId)!} showForecast={forecastVisible} compact />}</span><span className="gantt-row-name" title={row.task.name}>{row.task.name}<small>{row.task.durationHours} working hours{highlightCritical && analyzed.get(row.taskId)?.critical && <b className="critical-word"> · Critical</b>}</small></span>
                </button>
              </div>)}
              <svg className="gantt-drawing" width={view.width} height={bodyHeight} style={{ left: viewport.left + LABEL_WIDTH, top: HEADER_HEIGHT + firstRow * ROW_HEIGHT }} aria-label="Task bars and dependencies">
                <defs><pattern id={patternId} patternUnits="userSpaceOnUse" width={8} height={8}><rect width={8} height={8} fill="#e3eaf0" /><path d="M -2 2 L 2 -2 M 0 8 L 8 0 M 6 10 L 10 6" stroke="#91a6b8" strokeWidth={1.4} /></pattern>
                  <marker id={arrowId} viewBox="0 0 8 8" refX={7} refY={4} markerWidth={6} markerHeight={6} orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="#5f788d" /></marker></defs>
                {days.map(day => <g key={day.date}><rect x={view.x(day.start)} y={0} width={view.x(day.end) - view.x(day.start)} height={bodyHeight} fill={day.working ? '#fff' : '#f0f3f6'} /><line x1={view.x(day.start)} x2={view.x(day.start)} y1={0} y2={bodyHeight} stroke="#d5e0e9" />
                  {zoom === 'hour' && visibleHourTicks(axis, day, view.left, view.right, scale).map(tick => <line key={tick.hour} x1={view.x(tick.unit)} x2={view.x(tick.unit)} y1={0} y2={bodyHeight} stroke="#e9eef3" />)}</g>)}
                {rows.map(row => {
                  const y = (row.index - firstRow) * ROW_HEIGHT
                  const left = Math.max(-1, view.x(row.start))
                  const right = Math.min(view.width + 1, view.x(row.end))
                  const selected = selectedTaskId === row.taskId
                  const critical = highlightCritical && !!analyzed.get(row.taskId)?.critical
                  const label = `${row.taskId} ${row.task.name}: ${row.task.durationHours} working hours; starts ${row.scheduled.startDate} hour ${row.scheduled.startSlot.hour}; finishes ${row.scheduled.finishDate} after hour ${row.scheduled.finishBoundary.afterHour}`
                  const comparison = comparisonDescription(row.scheduled, baselineById.get(row.taskId), forecastById.get(row.taskId), !!baseline, forecastVisible)
                  return <g key={row.taskId}>
                    <line x1={0} x2={view.width} y1={y + ROW_HEIGHT} y2={y + ROW_HEIGHT} stroke="#e1e8ef" />
                    {selected && <rect x={0} y={y} width={view.width} height={ROW_HEIGHT} fill="#24779b0d" />}
                    {right > left && <g className={`gantt-bar${selected ? ' is-selected' : ''}${critical ? ' is-critical' : ''}`} role="button" tabIndex={0} aria-label={`${label}${critical ? '; critical, zero slack' : ''}`} aria-description={comparison} aria-pressed={selected} data-task-id={row.taskId} data-start={row.start} data-end={row.end} data-critical={critical}
                      onClick={() => onSelect(row.taskId)} onFocus={() => onSelect(row.taskId)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.taskId) } }}>
                      <title>{label}. {comparison}</title>
                      <rect className="gantt-bar-outline" x={left} y={y + 14} width={right - left} height={24} rx={3} fill={mode === 'expanded' ? `url(#${patternId})` : critical ? '#aa3d32' : '#24779b'} />
                      {mode === 'expanded' && taskSegments(axis, row, days).filter(segment => segment.kind === 'working').map(segment => {
                        const x = Math.max(-1, view.x(segment.start))
                        return <rect key={segment.start} data-kind="working" x={x} y={y + 14} width={Math.max(0, Math.min(view.width + 1, view.x(segment.end)) - x)} height={24} fill={critical ? '#aa3d32' : '#24779b'} />
                      })}
                      <rect className="gantt-bar-hit" x={left} y={y + 8} width={Math.max(8, right - left)} height={36} fill="transparent" />
                    </g>}
                    <ProgressOverlays axis={axis} row={row} baseline={baselineById.get(row.taskId)} baselineHours={baseline?.project.workingHoursPerDay ?? project.workingHoursPerDay} forecast={forecastById.get(row.taskId)} showBaseline={showBaseline && !!baseline} showForecast={forecastVisible} x={view.x} width={view.width} y={y} remainingHours={health?.get(row.taskId)?.workStatus === 'Complete' ? 0 : Object.hasOwn(remainingHours, row.taskId) ? remainingHours[row.taskId] : null} />
                    {impact?.ok && impactById.has(row.taskId) && <ActualImpactOverlays item={impactById.get(row.taskId)!} asOf={impact.asOf} axis={axis} x={view.x} width={view.width} y={y} onSelect={onSelect} />}
                  </g>
                })}
                {geometry.links.map(link => {
                  const fromY = (link.from.row - firstRow) * ROW_HEIGHT + 26
                  const toY = (link.to.row - firstRow) * ROW_HEIGHT + 26
                  const fromX = view.x(link.from.x)
                  const toX = view.x(link.to.x)
                  if (Math.max(fromY, toY) < 0 || Math.min(fromY, toY) > bodyHeight || Math.max(fromX, toX) + 12 < 0 || Math.min(fromX, toX) - 12 > view.width) return null
                  const label = `Dependency ${link.predecessorId} to ${link.successorId}`
                  const critical = highlightCritical && criticalLinks.has(link.key)
                  return <path key={link.key} className={`gantt-connector${critical ? ' is-critical' : ''}`} d={connectorPath(fromX, fromY, toX, toY)} fill="none" stroke={critical ? '#aa3d32' : '#5f788d'} strokeWidth={critical ? 2.8 : 1.4} markerEnd={`url(#${arrowId})`} tabIndex={0} role="img" aria-label={label} data-critical={critical}
                    onMouseEnter={() => setInspectedLink(label)} onMouseLeave={() => setInspectedLink('')} onFocus={() => setInspectedLink(label)} onBlur={() => setInspectedLink('')}><title>{label}</title></path>
                })}
              </svg>
            </div>
          </div>}
    <div className="gantt-link-inspection" role="status" aria-label="Dependency inspection">{geometry?.links.some(link => `Dependency ${link.predecessorId} to ${link.successorId}` === inspectedLink) ? inspectedLink : ''}</div>
    {children}
    {showInspection && selected && selectedSchedule && <TaskInspection task={selected} scheduled={selectedSchedule} analysis={analyzed.get(selected.taskId)} />}
  </section>
}
