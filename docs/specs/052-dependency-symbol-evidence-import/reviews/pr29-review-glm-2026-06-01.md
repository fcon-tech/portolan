# PR 29 Review: `codex/052-dependency-symbol-evidence-import`

---

## Findings

### Critical

None.

### Major

**M1 — No test coverage for `symbol-index` normalization path**

The PR adds a new `case "symbol-index"` branch in `selection.go` with non-trivial semantics (document/symbol node creation, `owns` edges, bounding by `maxSelectedSymbolDocuments` / `maxSelectedSymbols`, edge reason disclaimers). The test file `internal/selection/selection_test.go` is newly added but the verification section does not enumerate symbol-index-specific test cases. Without tests that exercise:

- a valid symbol-index payload within bounds,
- a symbol-index payload exceeding document or symbol limits,
- an empty or malformed symbol-index payload,

the core normalization path for this PR's headline feature is untested. This is a test-first violation per the constitution.

**M2 — No test coverage for `cannot_verify` / `not_assessed` preservation on malformed/oversized output**

The PR explicitly promises: *"Preserves malformed, empty, oversized, or unsupported producer output as `cannot_verify`"* and *"Preserves missing dependency/symbol producer families as `not_assessed`."* The `maxSelectedToolOutputBytes` guard at 64 MiB and the handling of unsupported `kind` values are safety-critical boundary behaviors. Without tests confirming:

- an output exceeding 64 MiB is classified `cannot_verify`,
- a malformed JSON payload is classified `cannot_verify`,
- a missing producer family emits the producer-gap finding with `not_assessed`,

these guarantees are unsubstantiated.

### Minor

**m1 — `maxSelectedToolOutputBytes` is a package-level `var`, not a `const`**

```go
var maxSelectedToolOutputBytes int64 = 64 * 1024 * 1024
```

This is presumably mutable to allow test overriding, but no test exercises the override. If it is meant to be tunable, consider exporting it or making it a configurable option with a documented default. If not, make it `const` to prevent accidental mutation.

**m2 — Syft exclusion paths use `./.portolan/**` and `./run/**` but relative-path behavior depends on CWD**

The exclusion:

```go
"--exclude", "./.portolan/**",
"--exclude", "./run/**",
```

Syft's `--exclude` flag interprets paths relative to the scan root. The leading `./` is technically redundant and may confuse future maintainers about whether the path is relative to CWD or to the scan root `root`. A brief inline comment clarifying intent would help.

**m3 — `relationship-candidate` `reason` field is a fixed string, not derived from actual parsing state**

```go
reason: semantic parsing remains not_assessed
```

This is semantically correct for the current slice, but if a future slice adds actual manifest parsing, this reason must be updated or made conditional. A code comment marking this as a placeholder would aid future authors.

**m4 — `feature.json` and `tasks.md` changes are co-mingled with prior spec 051**

The diff includes modifications to `docs/specs/051-portolan-quality-boundary/tasks.md`. If these are legitimate cross-spec updates (e.g., marking 051 tasks as complete or superseded), a brief note in the PR description would clarify intent.

---

## Assessment

### Q1: Evidence-state honesty

**Preserved.** The PR correctly uses `metadata-visible` for imported tool outputs, `source-visible` for tree-scanned candidates, `not_assessed` for missing producer families, and `cannot_verify` for malformed/oversized/unsupported outputs. The symbol-index path explicitly disclaims completeness ("not a complete call graph"). No evidence states are collapsed or falsified.

### Q2: Native PHP/JVM/Scala semantics or runtime topology claims

**Not present.** The query/answer guidance is updated to avoid these claims. The symbol-index path produces only `owns` relationships and document/symbol metadata. No call-graph, class-hierarchy, or runtime-topology edges are emitted.

### Q3: Local-first / read-only / output-safety boundaries

**Preserved.** The 64 MiB output cap prevents unbounded reads. Symbol/document limits (5K/50K) bound graph explosion. No network calls, daemons, or target mutations are introduced.

### Q4: Tests and docs

**Insufficient for the headline feature.** Tests exist for selection (new file), maprun, and app-level behavior. The CI is green and the stress run is comprehensive. However, the two major findings above identify untested normalization and boundary-preservation paths that are central to this slice's scope.

### Q5: Blockers

Yes — M1 and M2 are test-first blockers.

---

## Verdict

**`pass_with_changes`**

---

## Readiness Recommendation

**Draft stays draft.** M1 and M2 must be resolved before promoting to ready-for-review. Specifically:

1. Add `selection_test.go` cases covering:
   - Valid symbol-index within bounds → correct document/symbol nodes and `owns` edges
   - Symbol-index exceeding `maxSelectedSymbolDocuments` or `maxSelectedSymbols` → truncation or `cannot_verify`
   - Empty/malformed symbol-index → `cannot_verify`
   - Output exceeding `maxSelectedToolOutputBytes` → `cannot_verify`
   - Missing producer family → producer-gap finding with `not_assessed`
   - Unsupported `kind` → `cannot_verify`

2. Confirm all new test cases pass with `go test -count=1 ./...`.

3. Address m1 (var vs const) and m3 (placeholder comment) as hygiene.

Once M1 and M2 are resolved, the PR is ready for final review and merge.
