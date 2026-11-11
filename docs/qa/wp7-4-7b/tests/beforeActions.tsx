/** Run only in the archived 22bfd6a source with a temporary Vitest bridge. */
import { afterAll, describe, expect, test } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { mkdirSync, writeFileSync } from 'node:fs'
import { SelectedTaskHistory } from '../../../../src/components/progress/SelectedTaskHistory'
import { scenarioReader } from './scenarioReaders'
import type { FailureScenario } from './scenarioReaders'
const observations: object[] = []
describe('WP7.4.7b original action diagnostics', () => {
  test.each(['invalid', 'expired', 'oversized', 'mixed'] as const)('%s action starts a new attempt despite unchanged primary', async (scenario: FailureScenario) => {
    const { reader, metrics, tracking } = scenarioReader(scenario), before = JSON.stringify(tracking)
    render(<SelectedTaskHistory taskId="T1" reader={reader} fallback={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Show history' }))
    const first = (await screen.findByRole('alert')).textContent
    fireEvent.click(screen.getByRole('button', { name: scenario === 'invalid' || scenario === 'oversized' ? 'Retry reading history' : 'Refresh history' }))
    await waitFor(() => expect(metrics.opens).toBe(2))
    expect(await screen.findByRole('alert')).toHaveTextContent(first!)
    expect(metrics.pageReads).toBe(scenario === 'invalid' ? 0 : 2)
    if (scenario !== 'invalid') { expect(metrics.sessions[0]).not.toBe(metrics.sessions[1]); expect(metrics.releases).toBe(1) }
    expect(JSON.stringify(tracking)).toBe(before)
    observations.push({ scenario, openAttempts: metrics.opens, pageReads: metrics.pageReads, releasedPriorSessions: metrics.releases, distinctSessions: new Set(metrics.sessions).size, unchangedPrimary: first, sourceUnchanged: true, diagnosis: scenario === 'invalid' ? 'Two fresh validation attempts; invalid source prevents opening/page dispatch' : 'Fresh read session and page dispatch; deterministic synthetic problem persists' })
  })
  afterAll(() => { mkdirSync('docs/qa/wp7-4-7b/evidence', { recursive: true }); writeFileSync('docs/qa/wp7-4-7b/evidence/before-actions.json', JSON.stringify(observations, null, 2) + '\n') })
})
