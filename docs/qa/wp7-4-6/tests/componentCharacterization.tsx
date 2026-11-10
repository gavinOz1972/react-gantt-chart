import { describe,expect,test } from 'vitest'
import { render,cleanup } from '@testing-library/react'
import { TaskStatusPanel } from '../../../../src/components/progress/TaskStatusPanel'
import { TaskWorkPanel } from '../../../../src/components/TaskWorkPanel'
import { legacyCases } from './legacyFixtures'
const noop=()=>undefined
export function componentCharacterization() {
  describe('WP7.4.6 unchanged component characterization',()=>{
    test.each(['complete','reopened','timestamp-ties'])('UI01 %s existing panel preserves row order and recorded facts',id=>{
      const c=legacyCases().find(c=>c.id===id)!,expected=c.progress.events.filter(e=>e.taskId==='T1').slice().reverse()
      const rendered=render(<TaskStatusPanel task={c.tasks[0]} tracking={c.progress} disabled={false} statusDisabled={false} onRequest={noop} onCriteria={noop} onDraftChange={noop} onSelect={noop}/> )
      expect([...rendered.container.querySelectorAll('[data-status-event]')].map(e=>e.getAttribute('data-status-event'))).toEqual(expected.map(e=>e.eventId))
      expect(rendered.container.textContent).toContain('do not verify identity')
      if(expected.some(e=>e.toStatus==='Complete'))expect(rendered.container.textContent).toContain('Project guidance at completion: Reviewed deliverable guidance.')
      cleanup()
    })
    test.each(['work-corrected','work-retracted'])('UI02 %s current work summary qualifies optional recorded data',id=>{
      const c=legacyCases().find(c=>c.id===id)!
      const rendered=render(<TaskWorkPanel task={c.tasks[0]} tracking={c.work} baseline={c.baseline} disabled={false} onChange={noop} onDraftChange={noop} onSelect={noop}/> )
      expect(rendered.container.textContent).toContain('Work logging is optional')
      expect(rendered.container.querySelector('[data-effort="actual"]')?.textContent).toBe(id==='work-corrected'?'1.75 h':'0 h')
      if(id==='work-retracted')expect(rendered.container.querySelector('[data-effort="variance"]')?.textContent).toBe('Not available')
      cleanup()
    })
  })
}
