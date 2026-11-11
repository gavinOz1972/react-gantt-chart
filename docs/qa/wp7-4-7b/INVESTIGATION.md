# Retry/refresh investigation

Four instrumented component checks ran against a separate Git archive of
`22bfd6a3afff6f78e977d9fde55405de9983cabd` before the UI correction. The existing
component was unchanged there; only the synthetic test helpers and a temporary
Vitest bridge were added. That bridge is not part of the application or commit.

[before-actions.json](evidence/before-actions.json) and
[test log](evidence/before-actions.txt) record the observations:

| Synthetic case | Open/validation attempts, initial + action | Page reads | Fresh sessions | Why the primary remained unchanged |
| --- | --- | --- | --- | --- |
| invalid | 2 | 0 | 0 admitted | Each open rejects the same invalid recordedAt before querying |
| expired | 2 | 2 | 2 distinct | Synthetic wrapper returns ReadExpired every time |
| oversized | 2 | 2 | 2 distinct | Same valid 300-criterion attestation still exceeds 128 KiB |
| mixed | 2 | 2 | 2 distinct | Synthetic wrapper returns an inconsistent watermark every time |

For admitted sessions, the previous session was released once before the new
opening. Source bytes were unchanged in every case. The invalid case is a fresh
read **attempt**, not an accepted session or a dispatched page query. No network
request or storage fetch is claimed: this reader uses loaded immutable memory.

## Small correction

Explicit recovery actions now retain a per-panel attempt number, action kind and
terminal outcome in view state. Feedback is polite/atomic for assistive readers.
It reports reading, completion, the same typed history problem, a changed failure,
continued Unavailable, or success. It never says retry repairs a source.

A synchronous in-flight guard admits one request; rapid additional clicks are
ignored rather than queued, counted or dispatched. The button uses aria-disabled
while reading, preserving keyboard focus. The same guard enforces its unavailable
action state. A successful recovery keeps an explicit Refresh history action.

Existing cancellation/generation checks discard obsolete results. Hiding or
switching task/project resets the local feedback; a source change hides prior
feedback and requires a new consistent read. Paging is not counted as a retry.
Counters and feedback are not written to project data or preferences.

Initial browser verification exposed native focus loss when a focused button was
disabled; this was corrected to focusable aria-disabled plus the single-flight
guard. The other initial failure was a test comparing innerText newlines with
textContent; the primary itself had not changed. Component and browser tests now
verify both action dispatch and visible outcomes.

Deferred residual observation: the low-priority **More about this change**
observation supplied by the owner remains unchanged. Its function/rendering and
scoped styles are audited against the accepted source. No extra UX behavior was
implemented for it, and no further work package was initiated.
