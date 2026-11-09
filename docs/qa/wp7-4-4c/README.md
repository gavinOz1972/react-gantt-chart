# WP7.4.4c — historical storage architecture assessment

**Design and synthetic measurement only. R07 remains pending owner review.**
Client date: 2026-11-09, America/Regina. Branch: `feature/wp7-stabilization`.
Starting commit: `1b35da8ed7e4d113557b992d7abe7a1a0c316e6d`.

Authority: owner's request and
`Bugsys_WP7_4_4c_Historical_Storage_Assessment.docx`, SHA-256
`5ce9cbc00137917884c781f7d1156aa5d41848dbca6ea8038eff66d0cf0d2c05`.
The document authorizes this bounded assessment and illustrations, not production
formats, migrations, adapters, integration, WP7.4.5 or WP8.

## Results and review order

1. [CURRENT-ARCHITECTURE-ASSESSMENT](CURRENT-ARCHITECTURE-ASSESSMENT.md): actual
   App/file/consumer/repository code versus the unimplemented `/2` design.
2. [STORAGE-MEASUREMENTS](STORAGE-MEASUREMENTS.md): 11 scenarios, 165 measured
   fresh processes/55 warmups, 1,180 research assertions. A dense 100-task DAG has
   1,034 edges and 99 affected successors for one early task change.
3. [ARCHITECTURE-COMPARISON](ARCHITECTURE-COMPARISON.md): A full snapshot/history,
   B structured events and C optional checkpoints, including fidelity/cost limits.
4. [MEMORY-AND-REPOSITORY-CONTRACT](MEMORY-AND-REPOSITORY-CONTRACT.md): proposed
   purpose-based loads, pagination, revisions, atomic recovery and complete exports.
5. [RECOMMENDATION](RECOMMENDATION.md), then [OWNER-DECISIONS](OWNER-DECISIONS.md):
   recommended staged semantic/physical separation, amendments and unchecked choices.
6. [VERIFICATION](VERIFICATION.md): actual commands, regressions, warnings,
   reproducibility and source/asset/preservation audit.

Factoring repeated definitions reduces bytes, but does not bound lifetime history.
At 100 tasks/50 batch cycles, canonical A is 27.1 MB and factored B 15.7 MB; both
exceed 10 MiB. In the dense 20-cycle scenario, adding exact recorded-state changes
makes B larger than A (20.1 MB versus 9.4 MB). Checkpoints trade replay time for more
storage. These synthetic results do not predict student behaviour or certify a
future event format. Existing app consumers still read legacy completion events.

The recommendation retains A's semantic/export boundary initially while separately
scoping lazy operational/history reads. It does not select an implementation.
All B/C artifacts are labelled illustrations; exact A can be re-expanded with its
original full-snapshot digest. No production imports, app assets, formats, limits,
formula or UI changed. Large synthetic outputs stay outside Git; prior owner edits
are preserved. All 625 unit/component and 223 Chromium checks pass, along with
lint/typecheck/build. Stop for owner review; no R07 checkbox is automatically set.
