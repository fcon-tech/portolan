# Slice 1 Review Disposition: Evidence Graph Diff

## Scope Reviewed

- `internal/diff/diff.go`
- `internal/app/app.go`
- `internal/app/app_test.go`
- `testdata/evidence-diff/`
- `internal/app/testdata/evidence-diff/`
- `README.md`
- P3-006 SpecKit status and task ledgers

## Local Verification

- `go test -count=1 ./...`: passed.
- `jq empty schema/*.json`: passed.
- `jq empty internal/app/testdata/evidence-diff/base.json internal/app/testdata/evidence-diff/head.json testdata/evidence-diff/base.json testdata/evidence-diff/head.json schema/*.json`: passed.
- `go run ./cmd/portolan diff --base testdata/evidence-diff/base.json --head testdata/evidence-diff/head.json --out /tmp/portolan-diff.json --force`: passed.
- `jq empty /tmp/portolan-diff.json`: passed.

## Independent Review Lanes

- Initial `pi -p -` launch for all three lanes: failed; invalid CLI usage. This
  output is not review evidence.
- `kimi-coding/kimi-for-coding`: assessed after corrected launch.
- `minimax/MiniMax-M2.7`: degraded. The response attempted unavailable tool
  calls before seeing `internal/diff`; only visible app-level concerns were
  considered.
- `zai/glm-5.1`: assessed after corrected launch.

## Findings

### major: Output-path policy was duplicated between compute and write phases

`internal/diff.Options` originally carried `OutputPath` and `Force` even though
`Write` also owned output-path validation.

Disposition: accepted and fixed. `diff.Run` now only accepts graph inputs;
`diff.Write` owns output-path validation and write behavior.

### major: Unchanged edge output was not asserted

The fixture and test asserted added, removed, and changed edges but did not
prove unchanged edges were emitted.

Disposition: accepted and fixed. The fixtures now include an unchanged `owns`
edge, and the CLI test asserts one unchanged edge.

### minor: Required-input and missing-file paths needed more coverage

Bare `portolan diff`, missing base file, and missing head file were not tested.

Disposition: accepted and fixed in `TestRunDiffRejectsInvalidInputs`.

### minor: Identical graph input was not covered

Comparing a graph to itself should produce all-unchanged output without added,
removed, or changed facts.

Disposition: accepted and fixed in `TestRunDiffIdenticalInputsAreUnchanged`.

### minor: Verdict-regression test was too broad and case-sensitive

The first version searched raw lowercase substrings such as `pass`, which could
false-positive on user data and miss cased key names.

Disposition: accepted and fixed by searching lowercased JSON for quoted verdict
terms.

### major: Arbitrary explicit output paths can overwrite files with `--force`

One lane classified this as a path traversal issue.

Disposition: rejected. Portolan's current CLI contract uses explicit local
output paths for scan, import, packet, and diff commands. The boundary is no
network, no credentials, no target repository mutation, parent existence,
directory refusal, symlink refusal, and `--force` for overwrite. Restricting all
absolute or relative output paths would be a product-wide behavior change, not a
P3-006 fix.

### minor: Edge identity should include `kind`

One lane noted the need to verify that `kind` is part of edge identity.

Disposition: accepted as covered by implementation shape and fixtures. The
current unchanged edge uses the same nodes with a distinct `owns` kind while
the changed edge uses `depends-on`.

## Result

Accepted findings were fixed and local verification passed after fixes. P3-006
can proceed to PR packaging and PR-level review; it is not ready-to-merge
without explicit merge approval.
