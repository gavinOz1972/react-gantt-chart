# R07 owner decisions - WP7.4.4a dispositions, final contract pending

The owner selected Option A: authoritative self-contained current state with
structured explanatory history. This choice is fixed for this design, not a
new approval request. WP7.4.3b port/test-only acceptance remains recorded in
[its acceptance sheet](../wp7-4-3b/ACCEPTANCE.md). The owner-confirmed WP7.4.4a
amendment now records the dispositions below. Approval in principle or with
conditions is not final R07 acceptance or permission to implement.

The questions required by WP7.4.4 have concrete recommended answers in the
contract. Authority: WP7.4.4a requirement, confirmed by the owner in this
conversation,2026-11-08 (America/Regina). Base reviewed design commit:
`fd7fee933f843c9b547e88590e2bb1b20edb4081`.

| ID | Owner disposition | Concrete contract / remaining condition |
| --- | --- | --- |
| F01 | Approved in principle | Self-contained snapshot-history/2 proposal now includes lifecycle, archived edges and scope reviews. Final complete-contract consistency review required. |
| F02 | Approved in principle | Explanatory events, honest Partial coverage and immutable evidence; no mandatory load-time replay. Review lifecycle records and archived-edge references consistently. |
| F03 | Approved in principle | One project revision/transaction per complete review, separate event sequence, lineage versus stored-copy identity. Historical revision stamps are not extra counters. |
| F04 | Conditional approval | Deterministic JCS/SHA-256 direction. Before implementation require independent cross-language vectors, Unicode/numeric/duplicate-member coverage and explicit scope including all new lifecycle/archives/reviews. Restricted fixture digests do not discharge this condition. |
| F05 | Approved in principle | Unknown actuals and event-independent read-model boundary; future active-only projections must not fabricate events or change the accepted evaluator. Final consistency review remains. |
| F06 | Approved in principle | Immutable first baseline and preserved old commitments/facts; retired promises stay in before-context, current W covers active scope. Final consistency review remains. |
| F07 | Approved in principle | Explicit preserved-source1-5 copy-upgrade. No surviving retirement evidence means documented Active default, not invented historical retirement or deletion. Final consistency review remains. |
| F08 | Conditional approval | Strict rejection/source preservation, no silent dropping/rounding.10MiB/depth64 are PROVISIONAL. Require realistic/larger fixtures, size/depth boundaries and expanded lifecycle-history growth tests before fixing bounds or implementation. |
| F09 | Retirement workflow approved; concrete schema pending | Replace blanket deletion prohibition with retained active/retired lifecycle, rationale/date/available actor, archived incident edges, deduplicated cascading successor review and explicit restoration. Review exact fields/invariants/examples and interactions before final R07 acceptance. |

Conditions / alternatives per item: _______________________________________

Final review conditions / issue IDs: _______________________________________

Owner/date for final R07 decision: __________ Reviewed amended design SHA: __________

## Design acceptance and next authorization

- [x] Accept WP7.4.4 as a design-only handoff, per the WP7.4.4a instruction.
- [ ] Final complete-contract consistency review accepts the amended schema, including F09.
- [ ] Compatibility/source-preservation decisions and F08 fixture/limit conditions accepted.
- [ ] F04 cross-language integrity vectors/scope and conditional acceptance completed.
- [ ] Final R07 contract accepted; record exact conditions and reviewed SHA above.
- [ ] Further analysis requested: _________________________________________

R07 is not final until schema, compatibility and integrity decisions are all
explicitly accepted. Design acceptance alone does not start implementation.
Completing WP7.4.4a does not authorize any next slice. A separately named
design/vector qualification or unused foundation scope requires explicit
authorization after its prerequisites are agreed. No pure model, canonicalizer, codec,
adapter, repository activation, production integration, migration or UI follows
automatically. R04/R05 physical-adapter conditions remain separate. Earlier
independent owner acceptance gates, main, protected tags and WP8 are unchanged.
