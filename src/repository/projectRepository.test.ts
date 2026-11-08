// Test runner bridge only: existing Vitest/TypeScript configuration stays unchanged.
import { repositoryConformance } from '../../docs/qa/wp7-4-3b/tests/conformance'
import { fixtureSemantics } from '../../docs/qa/wp7-4-3b/tests/fixtures'
import { ReferenceRepository } from '../../docs/qa/wp7-4-3b/tests/referenceRepository'
import type { assertReadonlyPortTypes } from '../../docs/qa/wp7-4-3b/tests/typeChecks'

// Include compile-only expectations without executing deliberate mutation examples.
export type PortTypeAssertions = typeof assertReadonlyPortTypes

repositoryConformance('WP7.4.3b test-only repository conformance', (namespace, semantics = fixtureSemantics) => {
  const repository = new ReferenceRepository(namespace, semantics)
  return {
    repository,
    rejectNext: (operation, failure) => repository.rejectNext(operation, failure),
    loseNextAcknowledgement: (operation, committed) => repository.loseNextAcknowledgement(operation, committed),
  }
})
