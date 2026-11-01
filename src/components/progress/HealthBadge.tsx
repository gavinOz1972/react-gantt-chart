import type { HealthTone, TaskHealth } from '../../progress/healthPresentation'

export function HealthBadge({ label, tone, explanation, compact = false }: { label: string; tone: HealthTone; explanation?: string; compact?: boolean }) {
  return <span className={`health-badge health-${tone}${compact ? ' health-icon-only' : ''}`} aria-label={label} title={explanation ? `${label}: ${explanation}` : label}>
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      {tone === 'warning' ? <><path d="M8 1.5 15 14H1Z" /><path d="M8 5v4m0 2v1" /></> : <><circle cx="8" cy="8" r="6.5" />{tone === 'good' || tone === 'complete' ? <path d="m4.5 8 2.3 2.3 4.7-5" /> : tone === 'late' ? <path d="M8 4v5m0 2v1" /> : <path d="M5.7 5.6c0-2.8 5-2.8 4.6.2C10 7.4 8 7 8 9.5m0 1.5v1" />}</>}
    </svg><span className={compact ? 'sr-only' : ''}>{label}</span>
  </span>
}
export function TaskHealthBadge({ health, compact = false }: { health: TaskHealth; compact?: boolean }) {
  return <span className="task-health" title={`Schedule: ${health.label}. Work status: ${health.workStatus}. ${health.explanation}`}>
    <HealthBadge {...health} compact={compact} />
    {health.workStatus === 'Blocked' && <span className="blocked-health" aria-label="Work status: Blocked" title="Work status: Blocked"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1v10M9 1v10" stroke="currentColor" strokeWidth="3" /></svg>{!compact && <span>Blocked</span>}</span>}
  </span>
}
