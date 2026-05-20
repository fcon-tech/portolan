# PR 1 Review Cycle Disposition

Date: 2026-05-20

## Review Lanes

- Gemini via `pi`: assessed. Findings recorded in `pr1-gemini-review.md`.
- Claude via `pi`: `not_assessed`; the run produced an empty artifact after a
  long review window and was cancelled.
- Local Codex reviewer: assessed.

## Accepted Findings And Fixes

### Major: Claim-Derived Nodes Could Duplicate Existing Graph IDs

Fixed by tracking graph node IDs during assembly. Claim-derived nodes are only
added when no target, claim source, prior claim node, or symlink diagnostic node
already owns the ID. Claim edges still reference existing observed nodes.

### Major: Claim Node Evidence Could Be Overwritten Within A Claim File

Fixed by preserving the first claim-derived node evidence for a given ID inside
each claim source instead of overwriting it with later claims.

### Major: Edge Ordering Was Under-Specified For Duplicate Relations

Fixed by adding evidence source and reason to the deterministic edge sort key.

### Minor: Unknown Predicates Were Coerced To `claims`

Fixed by mapping unsupported claim predicates to the schema's `unknown` edge
kind.

### Minor: CLI Byte Count Used A Second Marshal

Fixed by reporting the written file size from `os.Stat`.

## Verification

- `go test -count=1 ./...`: passed.
- `go run ./cmd/portolan scan --selection testdata/local-evidence-graph/selection.json --out /tmp/portolan-graph.json --force`: passed.
- `jq empty /tmp/portolan-graph.json`: passed.
- `jq empty schema/*.json`: passed.
- `git diff --check`: passed.
