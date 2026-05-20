# Slice 1 Review Disposition: Local Evidence Graph MVP

Date: 2026-05-20

## Review Evidence

- Codex code review lane: assessed.
- Codex security/evidence lane: assessed.
- Direct `pi` review artifact: partial. It returned late against an older diff;
  its concrete CLI/help, byte-count, and test-coverage findings were accepted
  and fixed, but it is not counted as final approval of the current diff.

## Accepted And Fixed

### Major: Claim Sources Could Emit Schema-Invalid Evidence

Fixed by validating claim source `id` and `path` in `internal/selection`.

### Major: Target Kinds Could Violate Schema Enum

Fixed by rejecting unsupported target kinds in `internal/selection`.

### Major: Output Symlink Protection Was Check-Then-Write

Fixed by writing to a temporary file in the output directory and replacing the
requested output path with `rename`, so a swapped symlink is replaced rather
than followed/truncated.

### Major: `source-visible` Was Too Cheap

Fixed by requiring a readable, non-empty selected directory before assigning
`source-visible`; empty or unreadable directories produce `cannot_verify`.

### Minor: Determinism And Schema-Shape Tests Were Too Thin

Fixed by adding tests for stable rerun output and required node/edge/evidence
fields and enums.

### Major: Graph IDs Could Collide Across Targets And Claim Sources

Fixed by enforcing cross-namespace uniqueness for target and claim source IDs in
`internal/selection`.

### Major: Symlink-Only Or Root-Symlink Repositories Could Be Overclaimed

Fixed by rejecting selected-root symlinks and requiring a visible in-root source
entry before assigning `source-visible`.

### Minor: CLI Help And Summary Output Were Misleading

Fixed by returning help with exit 0 and empty stderr when `--help` is combined
with other scan flags, and by reporting the actual indented JSON payload size.

## Verification

- `go test -count=1 ./...`: passed.
- `go run ./cmd/portolan scan --selection testdata/local-evidence-graph/selection.json --out /tmp/portolan-graph.json --force`: passed.
- `jq empty /tmp/portolan-graph.json`: passed.
- `jq empty schema/*.json`: passed.
- `git diff --check`: passed.

## Remaining Gaps

- Full JSON Schema runtime validation remains intentionally deferred; fixture
  tests assert the current schema-shaped contract without adding a dependency.
- Network and mutation absence were checked by source inspection and local
  fixture behavior, not syscall tracing.
