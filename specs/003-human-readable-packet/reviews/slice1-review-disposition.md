# Slice 1 Review Disposition: Human-Readable Evidence Packet

Date: 2026-05-20

## Scope

Implemented the P0-003 packet slice:

- packet graph fixtures;
- `internal/packet` graph loader and Markdown renderer;
- `portolan packet render --graph <file> --out <file> [--force]`;
- aggregate node, edge, and evidence-state counts;
- graph id citations for non-aggregate statements;
- claim-only wording as claimed, not observed;
- unknown and cannot-verify sections;
- malformed graph no-partial-output coverage.

## Review Evidence

- Local repo-grounded implementation review: assessed.
- External model review: deferred to PR review cycle and currently
  `not_assessed` for this slice.

## Accepted And Fixed

### Minor: Initial Test Expected Wrong Claim-Only Count

Disposition: accepted and fixed.

The fixture contains one claim-only node and one claim-only edge, so the packet
count is `2`, not `3`.

### Minor: Claim-Only Regression Test Matched Its Own Wording

Disposition: accepted and fixed.

The test searched for `observed from`, which appears inside `not observed from`.
It now checks that claim-only packets do not contain visible source evidence.

### Major: Weak Edge Evidence Could Be Rendered As Observed

Disposition: accepted and fixed during PR review.

Relationship rendering originally described every non-claim edge as observed.
Edges with `unknown` or `cannot_verify` evidence now render as `unknown` or
`cannot verify`, and tests cover both states.

### Major: Graph Text Needed Markdown/HTML Escaping

Disposition: accepted and fixed during PR review.

Graph labels, ids, sources, and reasons can come from local evidence files. The
renderer now escapes HTML-sensitive characters and neutralizes code-span
backticks/newlines before writing Markdown.

## Verification

- `go test -count=1 ./...`: passed.
- `jq empty schema/*.json`: passed.
- `go run ./cmd/portolan packet render --graph testdata/human-readable-packet/graph.json --out /tmp/portolan-packet.md --force`: passed.
- `git diff --check`: passed.
