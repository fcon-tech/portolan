## ADDED Requirements

### Requirement: The Governor can launch one proposal by hand
The harbor CLI SHALL offer a `run` command that takes one fingerprint, finds
that proposal in the freshly computed queue, and launches exactly it
through the external launcher. Any kind SHALL be launchable — repair, gap,
or new-land — because the Governor's explicit choice overrides the night
policy bounds; the policy itself SHALL remain unchanged. A launcher SHALL
be required (there is no report-only run); an unknown fingerprint SHALL
fail loudly before anything is written.

#### Scenario: A standing gap launches by name
- **WHEN** the Governor runs the named fingerprint of a standing gap
  proposal with a launcher configured
- **THEN** exactly that expedition launches, and the queue recomputes
  against its results on the next proposal run

#### Scenario: An unknown fingerprint fails loudly
- **WHEN** the fingerprint names no proposal in the current queue
- **THEN** the command fails naming the fingerprint, hinting at the
  propose command, and writes no history

#### Scenario: No launcher, no run
- **WHEN** `run` is invoked without `--launcher`
- **THEN** the command is rejected as a usage error before any history is
  written

### Requirement: A manual run is attributed and failure-safe
The launched proposal SHALL be recorded in the harbor history as accepted
`by: governor` before the launch; a launcher failure or timeout SHALL
append a `launch-failed` outcome attributed the same way — as the latest
word it leaves the proposal effectively not-accepted and queued. The
chat-formatted run report SHALL name the proposal, its scope, and the
outcome deterministically (no timestamps).

#### Scenario: A failing launcher leaves the proposal standing
- **WHEN** the launcher exits non-zero or times out
- **THEN** the history records the attempt and its launch-failure, the
  report names the failure, and the proposal remains queued for the
  Governor

#### Scenario: The report is deterministic
- **WHEN** the same run outcome is rendered twice
- **THEN** the chat report is byte-identical
