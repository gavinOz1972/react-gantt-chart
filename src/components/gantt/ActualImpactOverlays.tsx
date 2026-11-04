import type { TaskImpact } from '../../projection/progressImpact'
import { impactDescription } from '../../projection/progressImpact'
import type { TimelineAxis } from '../../timeline/projection'
import { clipOverlayPoint, overlayPoint } from '../../timeline/overlays'

export function ActualImpactOverlays({ item, asOf, axis, x, width, y, onSelect }: {
  item: TaskImpact; asOf: string; axis: TimelineAxis; x: (unit: number) => number; width: number; y: number; onSelect: (id: string) => void
}) {
  const fact = item.completion, label = impactDescription(item, asOf)
  const first = fact ? clipOverlayPoint(overlayPoint(axis, fact.date, 0), x, width) : null
  const last = fact ? clipOverlayPoint(overlayPoint(axis, fact.date, 1), x, width) : null
  const shifted = item.start && item.finish && item.shiftSlots !== '0'
  const left = item.start ? Math.max(2, x(axis.startAt(item.start))) : 0
  const right = item.finish ? Math.min(width - 2, x(axis.finishAt(item.finish))) : 0
  const activate = (event: React.KeyboardEvent<SVGGElement>) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(item.taskId) } }
  return <g className="actual-impact-overlays">
    {fact && first && last && <g role="button" tabIndex={0} className="actual-date-marker" aria-label={`A ${label}`} data-task-id={item.taskId} data-actual-date={fact.date} data-active={fact.active} data-omitted={first.omitted} data-clipped={first.clipping || last.clipping || 'none'}
      onClick={() => onSelect(item.taskId)} onKeyDown={activate}>
      <title>{label}{first.omitted ? ' Nonworking date at collapsed calendar boundary.' : ''}{first.clipping || last.clipping ? ' Offscreen date: edge cue; use Go to impact.' : ''}</title>
      <path d={`M ${first.x} ${y + 69} v -9 H ${last.x} v 9`} fill="none" stroke="#283c53" strokeWidth={2} strokeDasharray={fact.active ? undefined : '3 2'} />
      {first.omitted && <path d={`M ${first.x - 4} ${y + 59} l 8 10 m -8 0 l 8 -10`} stroke="#283c53" />}
      {(first.clipping || last.clipping) && <text x={first.x} y={y + 70} fontSize={12}>{first.clipping.startsWith('before') ? '<' : '>'}</text>}
      <text x={Math.max(4, Math.min(width - 55, first.x + 4))} y={y + 70} fontSize={10} fill="#283c53">A{fact.active ? '' : ' history'}</text>
      <rect x={Math.max(0, first.x - 5)} y={y + 55} width={Math.max(16, last.x - first.x + 10)} height={18} fill="transparent" />
    </g>}
    {shifted && right > left && <g className="pa-outline" role="button" tabIndex={0} aria-label={`PA ${label}`} data-task-id={item.taskId} data-start-date={item.start!.date} data-finish-date={item.finish!.date} data-cause={item.causes.join(', ')}
      onClick={() => onSelect(item.taskId)} onKeyDown={activate}>
      <title>{label}</title><rect x={left} y={y + 50} width={right - left} height={10} fill="none" stroke="#895300" strokeWidth={2} />
      <text x={Math.min(width - 20, left + 3)} y={y + 58} fontSize={10} fill="#704200">PA</text>
      <rect x={left} y={y + 48} width={Math.max(18, right - left)} height={14} fill="transparent" />
    </g>}
    {shifted && right <= left && <g role="button" tabIndex={0} aria-label={`PA offscreen. ${label}`} onClick={() => onSelect(item.taskId)} onKeyDown={activate}>
      <title>{label} Offscreen; use Go to impact.</title><text x={8} y={y + 55} fill="#704200" fontSize={11}>PA offscreen — Go to impact</text>
    </g>}
    {item.state === 'Unknown' && <g className="pa-unknown" role="button" tabIndex={0} aria-label={`PA Unknown. ${label}`} data-task-id={item.taskId} onClick={() => onSelect(item.taskId)} onKeyDown={activate}>
      <title>{label}</title><text x={8} y={y + 55} fontSize={11} fill="#704200">PA ? Unknown</text><rect x={4} y={y + 44} width={100} height={15} fill="transparent" />
    </g>}
  </g>
}
