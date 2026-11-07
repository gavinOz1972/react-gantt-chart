import { useId } from 'react'
import type { TaskImpact } from '../../projection/progressImpact'
import { impactDescription } from '../../projection/progressImpact'
import type { TimelineAxis, TimelineDay } from '../../timeline/projection'
import { clipOverlayPoint, overlayPoint } from '../../timeline/overlays'
import { elapsedOverrun, hasHistoryConflict, hasPrimaryPA, historyCaption } from '../../timeline/historyPresentation'

export function ActualImpactOverlays({ item, asOf, axis, x, width, y, onSelect, days, gapPatternId }: {
  item: TaskImpact; asOf: string; axis: TimelineAxis; x: (unit: number) => number; width: number; y: number; onSelect: (id: string) => void; days: readonly TimelineDay[]
  gapPatternId: string
}) {
  const pattern = useId().replace(/:/g, '')
  const fact = item.completion, label = `${historyCaption(item)} ${impactDescription(item, asOf)}`
  const first = fact ? clipOverlayPoint(overlayPoint(axis, fact.date, 0), x, width) : null
  const last = fact ? clipOverlayPoint(overlayPoint(axis, fact.date, 1), x, width) : null
  const overrun = elapsedOverrun(axis, item)
  const start = overrun ? clipOverlayPoint(overrun.start, x, width) : null
  const end = overrun ? clipOverlayPoint(overrun.end, x, width) : null
  const shifted = hasPrimaryPA(item) && item.shiftSlots !== '0'
  const paStart = item.start ? axis.startAt(item.start) : 0, paEnd = item.finish ? axis.finishAt(item.finish) : 0
  const left = Math.max(0, x(paStart)), right = Math.min(width, x(paEnd))
  const activate = (event: React.KeyboardEvent<SVGGElement>) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(item.taskId) } }
  const unknown = item.state === 'Unknown' || hasHistoryConflict(item)
  return <g className="actual-impact-overlays">
    <defs><pattern id={pattern} width={10} height={8} patternUnits="userSpaceOnUse"><rect width={10} height={8} fill="#fff0ed" /><circle cx={2} cy={2} r={1.2} fill="#a92b24" /><circle cx={7} cy={6} r={1.2} fill="#a92b24" /></pattern></defs>
    {overrun && start && end && <g className={`historical-overrun${fact?.future || !fact?.active ? ' is-historical' : ''}`} role="button" tabIndex={0}
      aria-label={overrun.label} data-task-id={item.taskId} data-reference-date={fact!.reference} data-actual-date={fact!.date} data-calendar-days={overrun.calendarDays} data-collapsed={overrun.collapsed} data-start-unit={overrun.start.unit} data-end-unit={overrun.end.unit}
      onClick={() => onSelect(item.taskId)} onKeyDown={activate}>
      <title>{overrun.label}{start.clipping || end.clipping ? ' Offscreen extent; use Go to impact.' : ''}</title>
      <rect className="elapsed-delay-band" x={Math.min(start.x, end.x)} y={y + 20} width={Math.max(2, Math.abs(end.x - start.x))} height={20} fill={`url(#${pattern})`} stroke="#a92b24" strokeWidth={2.3} strokeDasharray={fact?.future || !fact?.active ? '4 2' : undefined} />
      {overrun.collapsed && <path d={`M ${end.x - 6} ${y + 22} l 4 5 l -4 5 l 4 5`} stroke="#a92b24" strokeWidth={2.5} fill="none" />}
      {Math.abs(end.x - start.x) > 210 && <text x={start.x + 5} y={y + 34} fontSize={11} fill="#8c241f" stroke="white" strokeWidth={3} paintOrder="stroke">Elapsed late +{overrun.calendarDays}d</text>}
      <rect x={Math.max(0, Math.min(start.x, end.x) - 3)} y={y + 17} width={Math.max(16, Math.abs(end.x - start.x) + 6)} height={26} fill="transparent" />
    </g>}
    {fact && first && last && <g role="button" tabIndex={0} className="actual-date-marker" aria-label={`Actual ${label}`} data-task-id={item.taskId} data-actual-date={fact.date} data-active={fact.active} data-future={fact.future} data-omitted={first.omitted} data-clipped={first.clipping || last.clipping || 'none'}
      onClick={() => onSelect(item.taskId)} onKeyDown={activate}>
      <title>{label} Whole-date bracket; display edge is not a measured finish hour.{first.omitted ? ' Nonworking date at collapsed calendar boundary.' : ''}{first.clipping || last.clipping ? ' Offscreen date: edge cue; use Go to impact.' : ''}</title>
      <path d={`M ${first.x} ${y + 42} V ${y + 18} H ${last.x} V ${y + 42}`} fill="none" stroke={overrun ? '#a92b24' : '#234961'} strokeWidth={3} strokeDasharray={fact.active && !fact.future ? undefined : '4 2'} />
      {first.omitted && <path d={`M ${first.x - 5} ${y + 20} l 10 16 m -10 0 l 10 -16`} stroke="#a92b24" strokeWidth={2} />}
      <text x={Math.max(4, Math.min(width - 65, first.x + 4))} y={y + 33} fontWeight={700} fontSize={11} fill={overrun ? '#942c26' : '#234961'} stroke="white" strokeWidth={3} paintOrder="stroke">{first.clipping ? '< ' : last.clipping ? '> ' : ''}{!fact.active ? 'History A' : fact.future ? 'Future A' : 'Actual'}</text>
      <rect x={Math.max(0, first.x - 4)} y={y + 16} width={Math.max(22, last.x - first.x + 8)} height={28} fill="transparent" />
    </g>}
    {shifted && right > left && <g className="pa-outline pa-primary" role="button" tabIndex={0} aria-label={`PA conditional window. ${label}`} data-task-id={item.taskId} data-start-date={item.start!.date} data-finish-date={item.finish!.date} data-cause={item.causes.join(', ')}
      onClick={() => onSelect(item.taskId)} onKeyDown={activate}>
      <title>{label} Primary conditional PA window; secondary C is the current committed reference. Hatching is nonworking elapsed time, not performed work.</title>
      <rect x={left} y={y + 20} width={right - left} height={20} fill="#fff6db" stroke="#895300" strokeWidth={2.5} strokeDasharray="6 2" />
      {axis.mode === 'expanded' && days.filter(d => !d.working).map(day => {
        const a = Math.max(left, x(day.start)), b = Math.min(right, x(day.end))
        return b > a ? <path key={day.date} d={`M ${a} ${y + 21} H ${b} V ${y + 39} H ${a} Z`} fill={`url(#${gapPatternId})`} stroke="#91a6b8" strokeWidth={1} data-kind="pa-nonworking" /> : null
      })}
      <text x={Math.min(width - 22, left + 4)} y={y + 34} fontSize={11} fontWeight={700} fill="#704200">PA</text>
      <rect x={left} y={y + 17} width={Math.max(18, right - left)} height={26} fill="transparent" />
    </g>}
    {shifted && right <= left && <g role="button" tabIndex={0} aria-label={`PA offscreen. ${label}`} onClick={() => onSelect(item.taskId)} onKeyDown={activate}>
      <title>{label} Offscreen; use Go to impact.</title><text x={8} y={y + 34} fill="#704200" fontSize={11}>PA offscreen - Go to impact</text>
    </g>}
    {unknown && <g className="pa-unknown" role="button" tabIndex={0} aria-label={`PA Unknown. ${label}`} data-task-id={item.taskId} onClick={() => onSelect(item.taskId)} onKeyDown={activate}>
      <title>{label}</title><text x={8} y={y + (fact ? 57 : 34)} fontSize={fact ? 10 : 11} fontWeight={600} fill="#704200">PA ? {hasHistoryConflict(item) ? 'Conflict' : fact?.future ? 'Future-effective / Unknown' : 'Unknown'}</text><rect x={4} y={y + (fact ? 46 : 22)} width={190} height={15} fill="transparent" />
    </g>}
  </g>
}
