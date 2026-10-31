import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { CriticalPathResult, ScheduleResult, TaskInput } from '../../domain'
import { layoutNetwork, NODE_HEIGHT, NODE_WIDTH } from '../../network/layout'
import { TaskInspection } from '../TaskInspection'

export function NetworkView({ tasks, result, analysis, selectedTaskId, onSelect, showInspection = true }: { tasks: readonly TaskInput[]; result: ScheduleResult; analysis: CriticalPathResult; selectedTaskId: string | null; onSelect: (id: string) => void; showInspection?: boolean }) {
  const [zoom, setZoom] = useState(1)
  const [viewport, setViewport] = useState({ left: 0, top: 0, width: 1000, height: 500 })
  const [inspected, setInspected] = useState('')
  const region = useRef<HTMLDivElement>(null)
  const arrow = useId().replace(/:/g, '')
  const layout = useMemo(() => analysis.ok && result.ok ? layoutNetwork(tasks, analysis) : null, [tasks, result, analysis])
  const hasNodes = !!layout?.nodes.length
  const tooLarge = !!layout && (layout.width * zoom > 4_000_000 || layout.height * zoom > 4_000_000)
  useEffect(() => {
    const element = region.current
    if (!element) return
    const measure = () => setViewport(value => ({ ...value, width: element.clientWidth || 1000, height: element.clientHeight || 500 }))
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : undefined
    observer?.observe(element)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [hasNodes, tooLarge])
  const byId = new Map(tasks.map(task => [task.taskId, task]))
  const analyzed = new Map(analysis.ok ? analysis.tasks.map(task => [task.taskId, task]) : [])
  const selected = byId.get(selectedTaskId ?? '')
  const selectedSchedule = result.ok ? result.tasks.find(task => task.taskId === selectedTaskId) : undefined
  const left = viewport.left / zoom - NODE_WIDTH
  const right = (viewport.left + viewport.width) / zoom + NODE_WIDTH
  const top = viewport.top / zoom - NODE_HEIGHT
  const bottom = (viewport.top + viewport.height) / zoom + NODE_HEIGHT
  const nodes = layout?.nodes.filter(node => node.x + NODE_WIDTH >= left && node.x <= right && node.y + NODE_HEIGHT >= top && node.y <= bottom) ?? []
  const edges = layout?.edges.filter(edge => edge.maxX >= left && edge.minX <= right && edge.maxY >= top && edge.minY <= bottom) ?? []
  function reset() {
    if (region.current) { region.current.scrollLeft = 0; region.current.scrollTop = 0 }
    setViewport(value => ({ ...value, left: 0, top: 0 }))
  }
  function goToSelected() {
    const node = layout?.nodes.find(node => node.taskId === selectedTaskId)
    const element = region.current
    if (!node || !element) return
    element.scrollLeft = Math.max(0, (node.x + NODE_WIDTH / 2) * zoom - viewport.width / 2)
    element.scrollTop = Math.max(0, (node.y + NODE_HEIGHT / 2) * zoom - viewport.height / 2)
    setViewport(value => ({ ...value, left: element.scrollLeft, top: element.scrollTop }))
  }
  return <section className="panel network-panel" aria-labelledby="network-heading">
    <div className="section-heading"><div><span className="eyebrow">01 / Timeline</span><h2 id="network-heading">Network / Critical Path</h2></div><span className="phase-label">Read-only dependency view</span></div>
    <p className="gantt-help">Follow the arrows from predecessor to successor. Critical nodes have zero working-hour slack against calculated completion, not the target. Independent release dates are not task effort.</p>
    <div className="gantt-toolbar"><label className="gantt-zoom">Network zoom<select aria-label="Network zoom" value={zoom} onChange={event => { setZoom(Number(event.target.value)); reset() }}>
      {[0.5, 0.75, 1, 1.25, 1.5].map(value => <option key={value} value={value}>{Math.round(value * 100)}%</option>)}</select></label>
      <button type="button" className="quiet" onClick={reset}>Reset network position</button>
      <button type="button" className="quiet" disabled={!selected || !hasNodes} onClick={goToSelected}>Go to selected node</button>
    </div>
    <div className="gantt-legend"><span><i className="legend-critical" />Critical / zero slack · bold solid edge</span><span><i className="legend-other" />Other dependency · dashed edge</span></div>
    {!result.ok || !analysis.ok ? <p className="gantt-state" role="status">Network unavailable. Correct the project entries or analysis errors first.</p>
      : !tasks.length ? <p className="gantt-state">Add tasks and dependencies to see their network.</p>
        : tooLarge ? <p className="gantt-state">This network exceeds the display size limit. Reduce network zoom or use the task table; project data is unchanged.</p>
          : layout && <div ref={region} className="network-scroll" role="region" aria-label="Scrollable dependency network" tabIndex={0}
            onScroll={event => { const element = event.currentTarget; setViewport({ left: element.scrollLeft, top: element.scrollTop, width: element.clientWidth || 1000, height: element.clientHeight || 500 }) }}>
            <svg className="network-svg" width={Math.max(viewport.width - 2, layout.width * zoom)} height={layout.height * zoom} viewBox={`0 0 ${Math.max((viewport.width - 2) / zoom, layout.width)} ${layout.height}`} aria-label="Dependency graph">
              <defs><marker id={arrow} viewBox="0 0 8 8" refX={7} refY={4} markerWidth={7} markerHeight={7} orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" fill="#5f788d" /></marker></defs>
              {edges.map(edge => {
                const label = `Network dependency ${edge.predecessorId} to ${edge.successorId}`
                return <path key={edge.key} d={edge.path} className={`network-edge${edge.critical ? ' critical' : ''}`} fill="none" stroke={edge.critical ? '#aa3d32' : '#647e92'} strokeWidth={edge.critical ? 3 : 1.4} strokeDasharray={edge.critical ? undefined : '5 4'} markerEnd={`url(#${arrow})`}
                  role="img" tabIndex={0} aria-label={label} data-critical={edge.critical} onFocus={() => setInspected(label)} onBlur={() => setInspected('')} onMouseEnter={() => setInspected(label)} onMouseLeave={() => setInspected('')}><title>{label}{edge.critical ? ' — critical relationship' : ''}</title></path>
              })}
              {nodes.map(node => {
                const task = byId.get(node.taskId)!
                const info = analyzed.get(node.taskId)!
                const selected = selectedTaskId === node.taskId
                const nameClip = `${arrow}-${node.x}-${node.y}-name`
                const label = `Network task ${task.taskId} ${task.name}: ${task.durationHours} working hours, ${info.totalSlackHours} hours slack${info.critical ? ', critical' : ''}`
                return <g key={node.taskId} transform={`translate(${node.x} ${node.y})`} className={`network-node${info.critical ? ' critical' : ''}${selected ? ' selected' : ''}`} role="button" tabIndex={0} aria-label={label} aria-pressed={selected} data-task-id={node.taskId} data-critical={info.critical}
                  onClick={() => onSelect(node.taskId)} onFocus={() => onSelect(node.taskId)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(node.taskId) } }}>
                  <title>{label}</title><rect className="network-node-box" width={NODE_WIDTH} height={NODE_HEIGHT} rx={8} fill={info.critical ? '#fff6f1' : '#f4f9fc'} stroke={info.critical ? '#aa3d32' : '#6d92a8'} strokeWidth={info.critical ? 3 : 1.5} />
                  <defs><clipPath id={nameClip}><rect x={12} y={30} width={NODE_WIDTH - 24} height={40} /></clipPath></defs>
                  <text x={12} y={22} className="network-id">{task.taskId.length > 12 ? `${task.taskId.slice(0, 11)}…` : task.taskId}</text><text x={NODE_WIDTH - 12} y={22} textAnchor="end" className="network-classification">{info.critical ? 'CRITICAL · 0 slack' : `${info.totalSlackHours}h slack`}</text>
                  <g clipPath={`url(#${nameClip})`}>{node.nameLines.map((line, index) => <text key={index} x={12} y={46 + index * 16} className="network-name">{line}</text>)}</g>
                  <text x={12} y={86}>{task.durationHours} working hours effort</text>
                  <text x={12} y={105}>Starts {info.earliestStart.date}, H{info.earliestStart.hour}</text>
                  <text x={12} y={123}>{info.releaseDelayHours > 0 ? `Release wait: ${info.releaseDelayHours} working slots` : `Finishes ${info.earliestFinish.date}, after H${info.earliestFinish.afterHour}`}</text>
                </g>
              })}
            </svg>
          </div>}
    <p role="status" className="gantt-link-inspection">{layout?.edges.some(edge => `Network dependency ${edge.predecessorId} to ${edge.successorId}` === inspected) ? inspected : ''}</p>
    {showInspection && selected && selectedSchedule && <TaskInspection task={selected} scheduled={selectedSchedule} analysis={analyzed.get(selected.taskId)} />}
  </section>
}
