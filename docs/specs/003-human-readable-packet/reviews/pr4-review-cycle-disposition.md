# PR 4 Review Cycle Disposition: Human-Readable Evidence Packet

Date: 2026-05-20

PR: https://github.com/fall-out-bug/portolan/pull/4

## PR State Reconstruction

- PR state at creation: open draft.
- Base: `main` at `eebf1c75c872e91ab4321dad6669c3af71425e45`.
- Head before PR-review fixes: `b7bccac28752d5c22f9720f1d800131f1fd0c1be`.
- Merge state: clean.
- GitHub checks: `not_assessed`; `gh pr checks 4` reported no checks.
- Review decision: empty.

## Review Lanes

- Local repo-grounded PR review: assessed.
- `openrouter/deepseek/deepseek-v4-pro`: assessed with caveats; findings were
  adjudicated locally before edits.
- `openrouter/qwen/qwen3.6-plus`: `not_assessed`; output attempted tool/file
  exploration instead of returning findings against the supplied packet.
- `openrouter/~google/gemini-pro-latest`: `not_assessed`; output reported it
  could not inspect files despite the supplied packet and did not return
  findings.

## Accepted And Fixed

### Major: Weak Relationship Evidence Could Be Overclaimed

The first renderer described non-claim edges as observed. This was wrong for
`unknown`, `cannot_verify`, metadata, and runtime evidence states. Fixed by
using state-specific relationship descriptions and adding tests for unknown and
cannot-verify edges.

### Major: Markdown/HTML Injection Through Graph Text

Graph labels, ids, sources, and reasons were inserted into Markdown without
escaping. Fixed by escaping HTML-sensitive characters and neutralizing backticks
and newlines in dynamic graph text. Added a regression test with script-like
labels, backticks, and heading-like reason text.

### Minor: JSON Decoder Should Reject Trailing Content

Accepted during local review. `LoadGraph` now rejects trailing JSON content
after the graph object.

## Rejected Findings

- Missing schema version validation: rejected. `LoadGraph` checks
  `schema_version` against `graph.SchemaVersion`.
- Missing `--force` overwrite safety: rejected. Packet output refuses existing
  output unless `--force` is set and tests cover this.
- Temp file cross-device risk: rejected. Temp files are created in the output
  directory before rename.
- Output path traversal restriction: rejected for this slice. The CLI writes to
  an explicit local `--out` path selected by the operator and rejects symlinks;
  sandboxing output under a base directory is a separate policy decision.
- JSON OOM limit: not accepted for this small local fixture slice; record as a
  possible future hardening item if graph sizes grow.

## Verification After Fixes

- `go test -count=1 ./...`: passed.
- `jq empty schema/*.json`: passed.
- `go run ./cmd/portolan packet render --graph internal/testfixtures/human-readable-packet/graph.json --out /tmp/portolan-packet.md --force`: passed.
- `git diff --check`: passed.
