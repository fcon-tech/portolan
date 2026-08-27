# harbor-run Design

## Decision 1: reuse the watch's launch machinery exactly

`runProposal(targetRoot, { fingerprint, launcher, launcherTimeoutMs })`
computes the queue, finds the fingerprint, and launches through the same
`launchExpedition` the watch uses — same brief (`{ target, proposal }` on
stdin), same timeout handling, same stdout-discarded discipline. No second
launcher path exists to drift.

## Decision 2: any kind, because the choice is the Governor's

The night policy bounds *automatic* repairs because nobody is watching. A
manual `run` is the Governor watching. So `run` accepts repair, gap, and
new-land alike, and the night policy's bounds are not consulted. This is
the deliberate resolution of the gap-policy thread: auto — never; manual —
one command.

## Decision 3: attribution `by: "governor"`

History gains the attribution constant `governor` alongside `night-watch`
(absent remains "the Governor in session"). The launch appends `accepted
by: governor` BEFORE spawning; on failure, `launch-failed by: governor` is
appended and — being the latest word — leaves the proposal effectively
not-accepted and queued, exactly like the watch's semantics. Only the
night watch and the governor's manual run write launch outcomes; the
vocabulary stays closed.

## Decision 4: loud input errors, receipted launch failures

Unknown fingerprint and missing launcher are usage errors: exit 1, message
on stderr, nothing written. A launcher failure is an outcome, not an error:
the report names it, the history records it, exit stays 0 (mirroring the
watch so scripted callers always get the report).

## Not here

Batch run (`--all`) — the Governor names one proposal at a time; a batch is
what the watch already is under policy. MCP surface — a server is bound to
one province, and `expeditions.decide` already covers in-session choice.
