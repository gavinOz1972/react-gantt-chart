# Owner decisions — all pending

Assessment date 2026-11-09, America/Regina. All boxes start unchecked. Choose one
alternative per question and record conditions. Acceptance of this assessment or
a design direction does **not** authorize a future implementation phase.

## D01: Architecture direction for subsequent design

- [ ] Accept the recommended staged A semantic/export boundary with separately
  designed operational loading and immutable history queries. No mandatory replay.
- [ ] Request B design instead, including exact reconstruction requirements and a
  separately versioned event/compatibility proposal; accept its context/storage cost.
- [ ] Request C design instead, including B prerequisites and measured checkpoint
  objectives, interval/target workloads and provenance rules.
- [ ] Defer architecture choice; additional evidence requested: ________________

## D02: Near-term classroom portable limit and recovery

- [ ] Retain provisional 10 MiB raw input / depth 64. Before future activation,
  require canonical-size preflight and prevent portable-only accepted edits from
  crossing the supported reopen bound, retaining the draft/source for recovery.
- [ ] Retain those default reader bounds but permit larger accepted plans only
  after a separately qualified explicit higher-cap/offline recovery/export route.
- [ ] Request another bounded policy and qualification budget: ________________
- [ ] Defer; the supported lifecycle/reopen policy is not yet decided.

No choice authorizes pruning, dropping opaque data, baseline rewriting, silent
cap escalation or treating a SQL quota as a portable-input cap. Indefinite history
cannot be promised within any fixed file limit. Thresholds remain resource policy,
distinct from valid format semantics.

## D03: Historical reconstruction product requirement

- [ ] Explanation/audit evidence is sufficient near term; arbitrary exact past
  states remain Unknown/Partial when not recorded. Do not add replay/checkpoints.
- [ ] Require exact recorded-state reconstruction from a future explicit cutover
  base only, with versioned changes and truthful gaps before it.
- [ ] Require a broader historical feature; specify recorded versus effective-date
  interpretation, required fidelity, latency and retention: __________________
- [ ] Defer; a separate user/workflow study is required: ______________________

No option invents missing legacy states, actual dates or authors. An engine rerun
with current formulas cannot substitute for an accepted historical state.

## D04: Compatibility and API proposal

- [ ] Accept a separate additive operational/history capability as the direction
  for a future contract review; existing load/commit S semantics remain intact.
- [ ] Request a breaking repository revision with explicit consumers/migration
  plan, conformance and owner acceptance before integration.
- [ ] Defer API direction; conditions: _______________________________________

Physical factoring alone may retain `/2`. Any wire references, authoritative
deltas/checkpoints or hash-scope changes require an explicit profile/version
proposal. Test B/C encodings are never imported as projects. Full-D traversal cost,
baseline/history guards and operational consumer parity remain unresolved gates.

## D05: Larger database/archive requirement

- [ ] Request a separately scoped archival design covering expected lifetime,
  history query volume, concurrency, access control, backups and complete export.
- [ ] Defer database/archive requirements; no unlimited-lifetime claim.

Conditions/budgets: _________________________________________________________

## Assessment acceptance and R07

- [ ] WP7.4.4c assessment accepted as an evidence-backed handoff only.
- [ ] Additional verification requested instead: _____________________________
- [ ] Owner explicitly records final R07 disposition at reviewed SHA: __________

Owner/date: ____________________ Conditions: ________________________________

These decisions remain pending. No acceptance is inferred from the request to
implement this assessment. WP7.4.5, production formats/models/codecs, adapters,
integration and WP8 require separate explicit authorization. Stop for owner review.
