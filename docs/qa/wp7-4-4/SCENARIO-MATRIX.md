# Proposed acceptance scenarios and actual verification

**No format6 codec exists.** The outcomes below are requirements for later
implementation, not passing import/migration tests. Example checks validate
selected authoring properties only. Positive, negative and boundary scenarios
must become independently specified tests after R07 acceptance.

## Required scenario matrix

| ID | Input/action | Proposed result | Present evidence / remaining work |
| --- | --- | --- | --- |
| S01 | Empty project/logical1/no baseline/events | Valid explicit empty snapshot, Unreviewed, no auto-baseline | Complete empty example; future codec test. |
| S02 | T1 committedNov2, actual completionNov6, optional recorded effort2h | Preserve all three meanings; Complete effective future effort0, no manufactured start or historical duration | late-retained example/literal authoring check. |
| S03 | T2 not known started; retain edge and reviewNov9 | Actual Start Unknown; revised future promiseNov9/hour1; no backdating | Complete late-retained example. |
| S04 | Attested T2 startNov3 while retained T1 completesNov6 | Preserve historical start; qualify execution/dependency conflict, ReferenceOnly remaining schedule | Complete late-retained-actual example; future read-model conflict test. |
| S05 | Explicitly sever current edge with same actual claim | Current edge removed with decision/reason, original baseline edge and actual evidence unchanged | Complete late-severed-actual example and paired-baseline equality check. |
| S06 | Early T1 completionNov4 versus commitmentNov6 | Retain T2 originalNov9 start unless explicitly advanced; no automatic acceleration | Corrected early-keep example; original WP1 baseline validated. |
| S07 | Completion date correctionNov6→Nov5 recordedNov10 | New claim/event supersedes prior same-topic event, current fact updated atomically, old payload/reference/B retained | Complete corrected example and literal assertions. |
| S08 | Already Complete with Actual Start missing | Keep Unknown; never infer from status/first log/completion | Late and partial examples. |
| S09 | Existing complete current snapshot but explanatory records missing | Valid only with honest Partial/inline fact data and null missing links; no replay required | Complete partial-current example. Cannot create it by dropping a known accepted prefix. |
| S10 | Empty or omitted history list | Mandatory history header; omitted list rejects, empty permitted under valid coverage | Empty/legacy/partial examples; future missing-field negative test. |
| S11 | Current linked fact disagrees with event, or complete covered latest assertion contradicts current | Reject contradiction before publication; no replay-based repair | Design only; future validator negative cases. |
| S12 | Older historical status/completion differs after reopen/correction | Preserve historical episode; current inline state authoritative; no false active release | Corrected example; reopen fixture and event-independent evaluator tests pending. |
| S13 | Current Complete but actual date historically unavailable | Unknown completion allowed/qualified; no definite successor release; Unsupported if existing evaluator projection would fabricate data | Design only; interface decision F05 and tests pending. |
| S14 | Self/forward/cross-task/cross-topic correction or fork | Reject with path/reference issue | Design only; native pure-validator cases pending. |
| S15 | Duplicate task/event/criterion IDs or conflicting definition of a claim/decision | Reject; repeated identical embedded snapshot/reference of same identity remains allowed | Example identity/reference authoring checks; full negative suite pending. |
| S16 | Event sequence gaps/tied or skewed timestamps | Sequence controls order; Partial explains missing events, timestamps never sort them | Explicit design; future timestamp/coverage cases. |
| S17 | Two events in one accepted project revision | One counter increment; event sequence remains distinct | Complete examples include grouped events; future transition test. |
| S18 | Missing/new required field or unknown future schema/profile/kind/field | Reject without stripping or guessed fallback, current project unchanged | Design only; old codec remains unchanged. |
| S19 | Fingerprint mismatch, Unicode/number/duplicate-name corruption | Typed rejection; no automatic checksum replacement/normalization | Restricted example digests pass; real JCS/lexer/negative suite pending. |
| S20 | Same snapshot exported twice with new exportInfo | Same snapshot D, potentially different envelope/raw bytes | Defined exclusion; future codec round-trip test. |
| S21 | Reordered object members versus reordered arrays | Object order does not change D; array order does, even for set-like dependency arrays | Defined JCS/profile rule; general canonicalization vectors pending. |
| S22 | null versus omitted/0/false/empty array | Distinct unless a specific schema rule rejects the shape; no coercion/default guessing | Defined scalar rules; future vectors pending. |
| S23 | Invalid date/UTC, lone surrogate, unsafe integer, malformed UTF-8, excessive bytes/depth | Reject with specific Syntax/Structure/ResourceLimit issue; source retained | Design only; depth64/10MiB boundaries require native implementation tests. |
| S24 | Logical revision/sequence/allocation maximum or overflow | Valid safe maximum can read/copy if invariants hold; unsupported next append/increment rejects atomically | Accepted port reference already checks revision overflow; new codec/sequence cases pending. |
| S25 | Format1–5 copy-upgrade | Same known meanings/IDs; raw source retained; no invented baseline/Actual Start/old working revision | One complete authored v1 pair validated; existing regression covers legacy codecs, not new migration. |
| S26 | Legacy unsafe opaque values, unknown active fields, duplicate names/namespace collisions | Reject strict upgrade, retain usable original; no silent field loss/rounding/renumbering | Policy/design only; native migration negatives pending. |
| S27 | Existing/known baseline changed, missing or given new lineage to bypass guard | Reject accepted-target transition; never regenerate first baseline | Paired original JSON equality/old WP1 checks; full known-lineage acceptance tests pending. |
| S28 | Clone/repeated import/duplicate label/divergent same revision | Preserve portable identity/content; new resource ID for a new create, original receipt for exact retry; no name overwrite/automatic merge | Existing accepted port suite; format6 file flows not activated. |
| S29 | Cancel/fail/interruption before copy accepted | Source bytes and accepted target unchanged; no half-migrated file/state | Existing regressions and policy only; new migration interruption test pending. |
| S30 | Ack lost after a copy may have committed | OutcomeUnknown; same-ID exact request reconciliation, not a fresh duplicate create | Accepted port synthetic suite; no physical adapter proof. |
| S31 | Lossy down-export or unofficial6.0-A/B draft | Reject; offer original legacy backup or explicitly authorized bridge | Policy/design only. |
| S32 | Deleting referenced task or pruning accepted history | Gate deletion/history rewrite; don't remove evidence to make references validate | Proposed lifecycle restriction; no current deletion behavior changed. |
| S33 | Future-effective actual or actual start before retained predecessor | Preserve genuine recorded claim, qualify with explicit review date/dependency conflict; no clock-dependent rewrite | Retained-actual example; future pure adapter parity needed. |
| S34 | Current task starts after its own known completion | Contradictory accepted facts reject; retain original for recovery | Design only; new pure-validator case pending. |
| S35 | Today/As-of changes, source estimate or optional logs change | No automatic remaining deduction or replacement of B/W/A; recompute derived views with explicit context only | Existing regressions; no formula/consumer change. |

## Actual executed verification

Starting feature HEAD was `4f8d70548bfbc2867fdfd859d6bf54e8867342e7`, with
pre-existing local evidence edits. Tests ran in an isolated `git archive` export
of that exact HEAD at `output/wp7-4-4-verification`, reusing installed dependencies
through a node_modules junction. No test wrote into the owner's edited evidence
directories. No other branch/worktree was created or altered.

| Command/check | Exact actual result | Evidence |
| --- | --- | --- |
| `npm.cmd run check` in isolated export | Exit0: lint/typecheck,625 unit/component tests in37 files, production build. | [Log](evidence/check.txt) |
| `npm.cmd run test:e2e -- --workers=3` with process-local NO_COLOR removed and native exit capture | Exit0,223 Chromium browser checks passed in2.6minutes; owned4173 server only. Owner5173/5174 untouched. | [Log](evidence/browser-all.txt) |
| Built-in JSON authoring/selected reference/digest/literal checks plus current legacy/WP1 validators |77 checks pass across eight proposed files and one fictional format1 source. | [Individual checks](evidence/example-checks.json), [digest inventory](evidence/example-authoring.json) |
| First example authoring validation | Failed on early-keep original baseline because a dependent manual date does not control its WP1 start. Corrected fictional inputs/literal baseline to four Friday T1 slots and DEFAULT T2, then all77 checks passed. No engine or real baseline changed. | [Review note](evidence/example-review-notes.txt) |
| Documentation/source scope, links, pending decisions, preserved edits and asset comparison | Only this new design package; original code/configs/acceptance unchanged; pre-existing edited files retain captured bytes; isolated/current build JS/CSS identical. | [Scope evidence](evidence/scope-review.json), [metadata](evidence/verification.json) |

No regression assertion failed. A Python availability probe failed on this
machine; Node built-ins were used for authoring instead. The examples were
reviewed/corrected, not treated as accepted real baseline records.

## Verification limits and stop

The77 checks are selected design-authoring checks, **not77 passing format6 codec
acceptance tests**. Restricted ASCII-key/safe-integer JSON digest authoring is
not general JCS conformance, UTF-8 duplicate-name scanning or cross-language
golden vectors. Existing decoders validate only the old fictional source and
known original baseline semantics; their normalized outputs never replace the
complete example baseline values/opaque extras.

No new schema validator, parser, serializer, historical replay, generic upgrade,
repository adapter, storage key, application consumer or save flow was created.
Existing625/223 regression results establish unchanged current behavior; they
do not certify future snapshot import, physical locking/durability or DBMS/API
compatibility. No new UI/student/screen-reader study or performance claim.

All required questions have concrete proposed answers in the contract/policies
and recorded consequences in OWNER-DECISIONS. R07 remains Pending until schema,
compatibility and integrity decisions are explicitly accepted. Commit/push only
this design package; stop for owner review. No implementation follows automatically.
