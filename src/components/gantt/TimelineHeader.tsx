import { useId, useLayoutEffect, useRef, useState } from 'react'
import { visibleHourTicks } from '../../timeline/projection'
import type { TimelineAxis, TimelineDay, TimelineZoom } from '../../timeline/projection'
import { fitWeekLabel, visibleWeeks, weekLabelCandidates } from '../../timeline/headers'

export function TimelineHeader({ axis, days, zoom, x, width, left, right, scale }: {
  axis: TimelineAxis; days: readonly TimelineDay[]; zoom: TimelineZoom; x: (unit: number) => number; width: number; left: number; right: number; scale: number
}) {
  const prefix = useId().replace(/:/g, '')
  const weeks = visibleWeeks(axis, days)
  return <svg className="gantt-axis" width={width} height={72} aria-label={`${axis.mode === 'expanded' ? 'Calendar dates' : 'Working dates only'}, ${zoom} scale`}>
    <rect width={width} height={72} fill="#f5f8fb" />
    {zoom === 'week' && weeks.map(week => <g key={week.monday}>
      <rect x={x(week.start)} y={0} width={x(week.end) - x(week.start)} height={36} fill="none" stroke="#d5e0e9" />
      <WeekLabel date={week.date} compressed={axis.mode === 'compressed'} left={Math.max(0, x(week.start))} right={Math.min(width, x(week.end))} clipId={`${prefix}-week-${week.monday}`} />
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

function WeekLabel({ date, compressed, left, right, clipId }: { date: string; compressed: boolean; left: number; right: number; clipId: string }) {
  const [label, setLabel] = useState('')
  const probe = useRef<SVGTextElement>(null)
  const available = Math.max(0, right - left - 12)
  useLayoutEffect(() => {
    const element = probe.current
    if (!element) return
    setLabel(fitWeekLabel(weekLabelCandidates(date, compressed), available, text => {
      element.textContent = text
      return element.getComputedTextLength?.() ?? Infinity
    }))
  }, [date, compressed, available])
  if (right <= left) return null
  return <g role="img" tabIndex={0} aria-label={`Week of ${date}`} data-week-start={date} data-label-left={left} data-label-right={right}>
    <title>{date} (week start)</title>
    <defs><clipPath id={clipId}><rect x={left} y={0} width={right - left} height={36} /></clipPath></defs>
    <text data-week-label="true" x={left + 6} y={23} clipPath={`url(#${clipId})`}>{label}</text>
    <text ref={probe} visibility="hidden" aria-hidden="true" />
  </g>
}
