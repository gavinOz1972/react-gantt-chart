import type { ImpactRelation } from '../../timeline/historyPresentation'
import { PRIMARY_Y, RELEASE_Y } from '../../timeline/historyPresentation'
import { connectorPath, ROW_HEIGHT } from '../../timeline/projection'

export function ImpactRelations({ relations, x, width, firstRow, bodyHeight, markerId, onInspect }: {
  relations: readonly ImpactRelation[]; x: (unit: number) => number; width: number; firstRow: number; bodyHeight: number; markerId: string; onInspect: (label: string) => void
}) {
  const uncertain = new Map<number, ImpactRelation[]>()
  for (const relation of relations) if (relation.kind === 'unknown') {
    const list = uncertain.get(relation.toRow) ?? []; list.push(relation); uncertain.set(relation.toRow, list)
  }
  const releaseGlyphs = new Set<string>()
  return <g className="impact-relations">
    {relations.filter(r => r.kind !== 'unknown').map(r => {
      const a = (r.fromRow - firstRow) * ROW_HEIGHT + (r.kind === 'actual-release' ? RELEASE_Y : PRIMARY_Y), b = (r.toRow - firstRow) * ROW_HEIGHT + PRIMARY_Y
      const from = x(r.fromUnit!), to = x(r.toUnit!)
      if (Math.max(a, b) < 0 || Math.min(a, b) > bodyHeight || Math.max(from, to) + 12 < 0 || Math.min(from, to) - 12 > width) return null
      const glyphKey = `${r.predecessorId}:${r.fromUnit}`, drawRelease = r.release && !releaseGlyphs.has(glyphKey)
      if (drawRelease) releaseGlyphs.add(glyphKey)
      return <g key={r.key}>
        <path className="pa-dependency" d={connectorPath(from, a, to, b)} fill="none" stroke="#895300" strokeWidth={2} strokeDasharray="6 2" markerEnd={`url(#${markerId})`} role="img" tabIndex={0} aria-label={r.label} data-kind={r.kind} data-predecessor={r.predecessorId} data-successor={r.successorId} data-release-date={r.release?.date} data-from-unit={r.fromUnit} data-to-unit={r.toUnit}
          onMouseEnter={() => onInspect(r.label)} onMouseLeave={() => onInspect('')} onFocus={() => onInspect(r.label)} onBlur={() => onInspect('')}><title>{r.label}</title></path>
        {drawRelease && from >= -8 && from <= width + 8 && a >= 0 && a <= bodyHeight && <g className="actual-release-bound" role="img" tabIndex={0} aria-label={r.label} data-task-id={r.predecessorId} data-release-date={r.release!.date} onFocus={() => onInspect(r.label)} onBlur={() => onInspect('')}>
          <title>{r.label}</title><path d={`M ${Math.max(0, Math.min(width, x(r.actualDateEdge!)))} ${a - 10} V ${a} H ${from}`} stroke="#895300" strokeDasharray="1 3" fill="none" pointerEvents="none" />
          <rect x={from - 6} y={a - 7} width={12} height={14} rx={2} fill="white" stroke="#895300" /><text x={from} y={a + 3} fontSize={9} fontWeight={700} textAnchor="middle" fill="#704200">R</text>
        </g>}
      </g>
    })}
    {[...uncertain.entries()].map(([row, list]) => {
      const y = (row - firstRow) * ROW_HEIGHT + ROW_HEIGHT - 4
      if (y < 0 || y > bodyHeight) return null
      const label = list.map(r => r.label).join(' ')
      return <g className="uncertain-dependency" key={row} role="img" tabIndex={0} aria-label={label} data-successor={list[0].successorId} onFocus={() => onInspect(label)} onBlur={() => onInspect('')}>
        <title>{label}</title><text x={8} y={y} fontSize={10} fill="#704200">Deps ? {list.map(r => r.predecessorId).join(', ')} to {list[0].successorId}</text>
      </g>
    })}
  </g>
}
