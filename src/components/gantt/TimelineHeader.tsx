import { useId } from 'react'
import { ordinalToDate } from '../../domain'
import { visibleHourTicks } from '../../timeline/projection'
import type { TimelineAxis, TimelineDay, TimelineZoom } from '../../timeline/projection'

export function TimelineHeader({ axis, days, zoom, x, width, left, right, scale }: {
  axis: TimelineAxis; days: readonly TimelineDay[]; zoom: TimelineZoom; x: (unit: number) => number; width: number; left: number; right: number; scale: number
}) {
  const prefix = useId().replace(/:/g, '')
  const weeks = new Map<number, { start: number; end: number }>()
  for (const day of days) {
    const monday = Math.max(0, day.ordinal - ((day.ordinal + 1) % 7 + 6) % 7)
    const existing = weeks.get(monday)
    weeks.set(monday, { start: existing?.start ?? day.start, end: day.end })
  }
  return <svg className="gantt-axis" width={width} height={72} aria-label={`${axis.mode === 'expanded' ? 'Calendar dates' : 'Working dates only'}, ${zoom} scale`}>
    <rect width={width} height={72} fill="#f5f8fb" />
    {zoom === 'week' && [...weeks].map(([monday, week]) => <g key={monday}>
      <rect x={x(week.start)} y={0} width={x(week.end) - x(week.start)} height={36} fill="none" stroke="#d5e0e9" />
      <text x={Math.max(4, x(week.start) + 6)} y={23}>Week of {ordinalToDate(monday)}</text>
    </g>)}
    {days.map(day => {
      const dayLeft = x(day.start)
      const dayWidth = x(day.end) - dayLeft
      const ticks = visibleHourTicks(axis, day, left, right, scale)
      const clipId = `${prefix}-${day.ordinal}`
      return <g key={day.date} clipPath={`url(#${clipId})`}>
        <defs><clipPath id={clipId}><rect x={dayLeft} y={0} width={dayWidth} height={72} /></clipPath></defs>
        <title>{day.date} {day.weekday}: {day.working ? `${axis.hoursPerDay} working hours` : 'nonworking day'}</title>
        <rect x={dayLeft} y={zoom === 'week' ? 36 : 0} width={dayWidth} height={zoom === 'week' ? 36 : 72} fill={day.working ? 'none' : '#e8edf2'} stroke="#d5e0e9" />
        {zoom === 'week' ? <text className="gantt-tiny" x={dayLeft + 3} y={58}>{day.weekday.slice(0, 2)} {day.date.slice(-2)}</text> : <>
          <text x={Math.max(4, dayLeft + 6)} y={20}>{day.date}</text><text className="gantt-weekday" x={Math.max(4, dayLeft + 6)} y={36}>{day.weekday}</text>
          {ticks.length ? ticks.map(tick => <g key={tick.hour}><line x1={x(tick.unit)} x2={x(tick.unit)} y1={44} y2={72} stroke="#d5e0e9" />
            <text x={x(tick.unit) + 5} y={62}>H{tick.hour}</text></g>) : <text className="gantt-weekday" x={dayLeft + 6} y={62}>{day.working ? `${axis.hoursPerDay} working hrs` : 'Nonworking'}</text>}
        </>}
      </g>
    })}
  </svg>
}
