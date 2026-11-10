// Runner bridge only. No App/runtime imports or existing port changes.
import { operationalHistoryConformance } from '../../docs/qa/wp7-4-5/tests/conformance'
import { ReferenceOperationalHistoryRepository } from '../../docs/qa/wp7-4-5/tests/referenceOperationalHistoryRepository'
import { fixtureFingerprint } from '../../docs/qa/wp7-4-5/tests/fixtures'
import { validateFixtureChange } from '../../docs/qa/wp7-4-5/tests/fixtureSemantics'
import type { assertOperationalTypes } from '../../docs/qa/wp7-4-5/tests/typeChecks'
export type OperationalTypeAssertions = typeof assertOperationalTypes

operationalHistoryConformance('WP7.4.5 unused operational/history capability', (name, seeds, config = {}) => {
  const repository = new ReferenceOperationalHistoryRepository(name, seeds, {
    ...config,
    fingerprint(value) {
      if (config.failure === 'fingerprint' && value && typeof value === 'object' && 'revision' in value && value.revision === 18) throw new Error('Injected fixture fingerprint failure')
      return fixtureFingerprint(value)
    },
    validate(...args) { if (config.failure === 'validate') throw new Error('Injected fixture boundary failure'); return validateFixtureChange(...args) },
  })
  return { repository, inspect: id => repository.inspectAccepted(id), rejectNext: () => repository.rejectNextCommit(), loseAcknowledgement: hook => repository.loseNextAcknowledgement(hook) }
})
