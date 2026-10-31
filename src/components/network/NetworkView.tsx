import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CriticalPathResult, ScheduleResult, TaskInput } from '../../domain'
import { layoutNetwork, NODE_HEIGHT, NODE_WIDTH } from '../../network/layout'
import { centerNetwork, fitNetwork, hitNetworkNode, MAX_NETWORK_ZOOM, MIN_NETWORK_ZOOM, networkWindow, panNetwork, zoomNetwork } from '../../network/viewport'
import type { ViewTransform } from '../../network/viewport'
import { TaskInspection } from '../TaskInspection'

export function NetworkView({ tasks, result, analysis, selectedTaskId, onSelect, showInspection = true, active = true }: { tasks: readonly TaskInput[]; result: ScheduleResult; analysis: CriticalPathResult; selectedTaskId: string | null; onSelect: (id: string) => void; showInspection?: boolean; active?: boolean }) {
  const [manualView, setView] = useState<ViewTransform>({ scale: 1, x: 0, y: 0 })
  const [size, setSize] = useState({ width: 1000, height: 500 })
  const [fitMode, setFitMode] = useState(true)
  const [panning, setPanning] = useState(false)
  const [inspected, setInspected] = useState('')
  const region = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointerId: number; x: number; y: number; initial: ViewTransform; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const arrow = useId().replace(/:/g, '')
  const layout = useMemo(() => analysis.ok && result.ok ? layoutNetwork(tasks, analysis) : null, [tasks, result, analysis])
  const hasNodes = !!layout?.nodes.length
  const bounds = useMemo(() => ({ x: 0, y: 0, width: layout?.width ?? 0, height: layout?.height ?? 0 }), [layout?.width, layout?.height])
  useLayoutEffect(() => {
    const element = region.current
    if (!element || !active) return
    const measure = () => {
      const width = element.clientWidth || 1000, height = element.clientHeight || 500
      setSize(previous => previous.width === width && previous.height === height ? previous : { width, height })
    }
    measure()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : undefined
    observer?.observe(element)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [active, hasNodes])
  const view = fitMode && hasNodes ? fitNetwork(bounds, size) : manualView
  const byId = new Map(tasks.map(task => [task.taskId, task]))
  const analyzed = new Map(analysis.ok ? analysis.tasks.map(task => [task.taskId, task]) : [])
  const selected = byId.get(selectedTaskId ?? '')
  const selectedSchedule = result.ok ? result.tasks.find(task => task.taskId === selectedTaskId) : undefined
  const visible = networkWindow(view, size, 48)
  const nodes = layout?.nodes.filter(node => node.x + NODE_WIDTH >= visible.x && node.x <= visible.x + visible.width && node.y + NODE_HEIGHT >= visible.y && node.y <= visible.y + visible.height) ?? []
  const edges = layout?.edges.filter(edge => edge.maxX >= visible.x && edge.minX <= visible.x + visible.width && edge.maxY >= visible.y && edge.minY <= visible.y + visible.height) ?? []
  const overview = nodes.length > 100
  const detailedNodes = overview ? nodes.filter(node => node.taskId === selectedTaskId) : nodes
  const batchedEdges = overview && edges.length > 100
  const zoomChoices = [...new Set([view.scale, 0.5, 0.75, 1, 1.25, 1.5, 2, 3])].sort((a, b) => a - b)
  function fit() { if (hasNodes) setFitMode(true) }
  function zoomTo(scale: number) { setFitMode(false); setView(zoomNetwork(view, scale, { x: size.width / 2, y: size.height / 2 })) }
  function reset() { setFitMode(false); setView(centerNetwork(view, { x: bounds.width / 2, y: bounds.height / 2 }, size)) }
  function goToSelected() {
    const node = layout?.nodes.find(node => node.taskId === selectedTaskId)
    if (!node) return
    setFitMode(false)
    setView(centerNetwork(view, { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT / 2 }, size, true))
  }
  function beginPan(event: React.PointerEvent<HTMLDivElement>) {
    suppressClick.current = false
    if (event.button !== 0 || (event.target as Element).closest('.network-node,.network-edge')) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (overview) {
      const hit = hitNetworkNode(nodes, { x: event.clientX - rect.left - event.currentTarget.clientLeft, y: event.clientY - rect.top - event.currentTarget.clientTop }, view, { width: NODE_WIDTH, height: NODE_HEIGHT })
      if (hit) { onSelect(hit.taskId); return }
    }
    event.preventDefault(); event.currentTarget.focus({ preventScroll: true })
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, initial: view, moved: false }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  function movePan(event: React.PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const delta = { x: event.clientX - current.x, y: event.clientY - current.y }
    if (!current.moved && Math.hypot(delta.x, delta.y) < 3) return
    current.moved = true; setPanning(true); setFitMode(false)
    setView(panNetwork(current.initial, delta))
  }
  function endPan(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    suppressClick.current = drag.current.moved
    drag.current = null; setPanning(false)
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return <section className="panel network-panel" aria-labelledby="network-heading">
    <div className="section-heading"><div><span className="eyebrow">01 / Timeline</span><h2 id="network-heading">Network / Critical Path</h2></div><span className="phase-label">Read-only dependency view</span></div>
    <p className="gantt-help">Follow the arrows from predecessor to successor. Critical nodes have zero working-hour slack against calculated completion, not the target. Independent release dates are not task effort.</p>
    <div className="gantt-toolbar network-toolbar">
      <button type="button" className="quiet" aria-label="Zoom out" title="Zoom out (minimum 5%)" disabled={!hasNodes || view.scale <= MIN_NETWORK_ZOOM} onClick={() => zoomTo(view.scale / 1.25)}>Zoom out <span aria-hidden="true">-</span></button>
      <button type="button" className="quiet" aria-label="Zoom in" title="Zoom in (maximum 300%)" disabled={!hasNodes || view.scale >= MAX_NETWORK_ZOOM} onClick={() => zoomTo(view.scale * 1.25)}>Zoom in <span aria-hidden="true">+</span></button>
      <button type="button" className="quiet" title="Centre the whole network in the visible canvas" disabled={!hasNodes} onClick={fit}>Fit to View</button>
      <label className="gantt-zoom">Network zoom<select aria-label="Network zoom" value={view.scale} disabled={!hasNodes} onChange={event => zoomTo(Number(event.target.value))}>
        {zoomChoices.map(value => <option key={value} value={value}>{Math.round(value * 1000) / 10}%</option>)}</select></label>
      <button type="button" className="quiet" disabled={!hasNodes} onClick={reset}>Reset network position</button>
      <button type="button" className="quiet" disabled={!selected || !hasNodes} onClick={goToSelected}>Go to selected node</button>
    </div>
    <p className="muted network-navigation-help" id={arrow + '-help'}>Drag blank background to pan. Focus the canvas and use arrow keys to move, or Home to fit. Zoom and pan change the view only.</p>
    <div className="gantt-legend"><span><i className="legend-critical" />Critical / zero slack · bold solid edge</span><span><i className="legend-other" />Other dependency · dashed edge</span></div>
    {!result.ok || !analysis.ok ? <p className="gantt-state" role="status">Network unavailable. Correct the project entries or analysis errors first.</p>
      : !tasks.length ? <p className="gantt-state">Add tasks and dependencies to see their network.</p>
        : layout && <div ref={region} className={`network-scroll${panning ? ' is-panning' : ''}`} role="region" aria-label="Scrollable dependency network" aria-describedby={arrow + '-help'} tabIndex={0}
            onPointerDown={beginPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onLostPointerCapture={endPan}
            onClickCapture={event => { if (suppressClick.current) { suppressClick.current = false; event.preventDefault(); event.stopPropagation() } }}
            onKeyDown={event => {
              if (event.target !== event.currentTarget) return
              if (event.key === 'Home') { event.preventDefault(); fit(); return }
              const delta = ({ ArrowLeft: { x: 40, y: 0 }, ArrowRight: { x: -40, y: 0 }, ArrowUp: { x: 0, y: 40 }, ArrowDown: { x: 0, y: -40 } } as Record<string, { x: number; y: number }>)[event.key]
              if (delta) { event.preventDefault(); setFitMode(false); setView(panNetwork(view, delta)) }
            }}>
            <svg className="network-svg" width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`} aria-label="Dependency graph" data-zoom={view.scale} data-pan-x={view.x} data-pan-y={view.y}>
              <defs><marker id={arrow} viewBox="0 0 8 8" refX={7} refY={4} markerWidth={7} markerHeight={7} orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" fill="#5f788d" /></marker></defs>
              <g className="network-transform" transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
              {overview && <g aria-label={`Overview of ${nodes.length} tasks`}>{[false, true].map(critical => <path key={String(critical)} className="network-overview" data-critical={critical} d={nodes.filter(node => !!analyzed.get(node.taskId)?.critical === critical).map(node => `M${node.x} ${node.y}h${NODE_WIDTH}v${NODE_HEIGHT}h-${NODE_WIDTH}Z`).join(' ')} fill={critical ? '#fff0e8' : '#e2eff6'} stroke={critical ? '#aa3d32' : '#6d92a8'} strokeWidth={critical ? 3 : 1.5} />)}</g>}
              {batchedEdges && [false, true].map(critical => <path key={String(critical)} className="network-edge" d={edges.filter(edge => edge.critical === critical).map(edge => edge.path).join(' ')} fill="none" stroke={critical ? '#aa3d32' : '#647e92'} strokeWidth={critical ? 3 : 1.4} strokeDasharray={critical ? undefined : '5 4'} markerEnd={`url(#${arrow})`} />)}
              {(!batchedEdges ? edges : []).map(edge => {
                const label = `Network dependency ${edge.predecessorId} to ${edge.successorId}`
                return <path key={edge.key} d={edge.path} className={`network-edge${edge.critical ? ' critical' : ''}`} fill="none" stroke={edge.critical ? '#aa3d32' : '#647e92'} strokeWidth={edge.critical ? 3 : 1.4} strokeDasharray={edge.critical ? undefined : '5 4'} markerEnd={`url(#${arrow})`}
                  role="img" tabIndex={0} aria-label={label} data-critical={edge.critical} onFocus={() => setInspected(label)} onBlur={() => setInspected('')} onMouseEnter={() => setInspected(label)} onMouseLeave={() => setInspected('')}><title>{label}{edge.critical ? ' — critical relationship' : ''}</title></path>
              })}
              {detailedNodes.map(node => {
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
              </g>
            </svg>
          </div>}
    {overview && <p className="muted" role="status">Overview of {nodes.length} tasks. Zoom in or choose a task and Go to selected node for readable details.</p>}
    <p role="status" className="gantt-link-inspection">{layout?.edges.some(edge => `Network dependency ${edge.predecessorId} to ${edge.successorId}` === inspected) ? inspected : ''}</p>
    {showInspection && selected && selectedSchedule && <TaskInspection task={selected} scheduled={selectedSchedule} analysis={analyzed.get(selected.taskId)} />}
  </section>
}
